import { GoogleGenAI } from "@google/genai";
import { config as dotenvConfig } from "dotenv";
import {
  BaseLLM,
  BaseLLMCallOptions,
} from "@langchain/core/language_models/llms";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { z } from "zod";
import { ChainPerformanceMonitor } from "../monitor/ChainPerformanceMonitor";
import { ValidatorFactory } from "../monitor/Validator";

dotenvConfig();

// Configure your primary and fallback models with built-in retries
const geminiPrimaryModel =
  process.env.GEMINI_PRIMARY_MODEL || "gemini-2.5-flash-lite";
const geminiFallbackModel =
  process.env.GEMINI_FALLBACK_MODEL || "gemini-2.5-flash";
const geminiApiKey = process.env.GEMINI_API_KEY || "";
const geminiTemperature = Number(process.env.GEMINI_TEMPERATURE) || 0.7;
const geminiMaxRetries = Number(process.env.GEMINI_MAX_RETRIES) || 3;

class GeminiLLM extends BaseLLM<BaseLLMCallOptions> {
  lc_serializable = true;
  private model;
  private maxRetries;
  private modelId;

  constructor(modelId: string) {
    super({});
    const genAI = new GoogleGenAI({
      apiKey: geminiApiKey,
    });
    this.model = genAI.models;
    this.maxRetries = geminiMaxRetries;
    this.modelId = modelId;
  }

  _llmType() {
    return "gemini-api";
  }

  async _call(prompt: string): Promise<string> {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const result = await this.model.generateContent({
          model: this.modelId,
          contents: prompt,
        });
        return result.text || "";
      } catch (err) {
        if (attempt === this.maxRetries - 1) throw err;
      }
    }
    throw new Error("Gemini API failed");
  }

  async _generate(prompts: string[], options?: BaseLLMCallOptions) {
    const generations = await Promise.all(
      prompts.map(async (prompt) => {
        const text = await this._call(prompt);
        return { text, generationInfo: {} };
      })
    );
    return { generations: [generations] };
  }
}

export const GeminiPrimaryClient = new GeminiLLM(geminiPrimaryModel);
export const GeminiFallbackClient = new GeminiLLM(geminiFallbackModel);

/**
 * Create a chain that uses LangChain's built-in retry and fallback mechanisms
 */
export function makeChain<T>(
  prompt: PromptTemplate,
  schema: z.ZodType<T>,
  chainName?: string,
  skipValidation = false
) {
  const monitor = ChainPerformanceMonitor.getInstance();
  const finalChainName = chainName;

  // Create the main chain with built-in retries
  const mainChain = RunnableSequence.from([
    prompt,
    GeminiPrimaryClient,
    (output: string) => {
      console.log("Gemini API raw output:", output);
      try {
        // Extract JSON from markdown code blocks if present
        let jsonStr = output.trim();
        if (jsonStr.startsWith("```json")) {
          jsonStr = jsonStr.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (jsonStr.startsWith("```")) {
          jsonStr = jsonStr.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }

        const parsed = JSON.parse(jsonStr);
        if (schema.safeParse(parsed).success) {
          return parsed as T;
        }
        throw new Error("Invalid schema");
      } catch {
        throw new Error("Failed to parse or validate output");
      }
    },
  ]);

  // Create the fallback chain using the Gemini API
  const fallbackChain = RunnableSequence.from([
    prompt,
    GeminiFallbackClient,
    (output: string) => {
      console.log("Gemini API fallback raw output:", output);
      try {
        // Extract JSON from markdown code blocks if present
        let jsonStr = output.trim();
        if (jsonStr.startsWith("```json")) {
          jsonStr = jsonStr.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (jsonStr.startsWith("```")) {
          jsonStr = jsonStr.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }

        const parsed = JSON.parse(jsonStr);
        if (schema.safeParse(parsed).success) {
          return parsed as T;
        }
        throw new Error("Invalid schema");
      } catch {
        throw new Error("Failed to parse or validate output");
      }
    },
  ]);

  // Return a chain that tries main, then fallback with monitoring
  return async (input: any, testExpected?: any) => {
    const isFromTest = testExpected !== undefined;

    // Skip monitoring if no chain name provided
    if (!finalChainName) {
      console.log(`About to call chain...`);

      // Try main chain up to 3 times
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`Attempt ${attempt}/3 with main chain...`);
          const result = await mainChain.invoke(input);
          console.log(`Chain succeeded on attempt ${attempt}:`, result);

          // Validate if this is a test and validation is not skipped
          if (isFromTest && !skipValidation) {
            const validator = ValidatorFactory.create("unknown");
            const validation = validator.validate(
              "unknown",
              result,
              testExpected,
              true
            );
            return { result, validation };
          }

          return { result };
        } catch (error) {
          console.log(`Main chain attempt ${attempt} failed:`, error);
          if (attempt === 3) {
            console.log(`All 3 main chain attempts failed, trying fallback...`);
            try {
              const result = await fallbackChain.invoke(input);
              console.log(`Fallback chain succeeded:`, result);

              // Validate if this is a test and validation is not skipped
              if (isFromTest && !skipValidation) {
                const validator = ValidatorFactory.create("unknown");
                const validation = validator.validate(
                  "unknown",
                  result,
                  testExpected,
                  true
                );
                return { result, validation };
              }

              return { result };
            } catch (fallbackError) {
              console.log(`Fallback chain also failed:`, fallbackError);
              throw fallbackError;
            }
          }
        }
      }
    }

    // With monitoring
    const inputText = JSON.stringify(input);
    monitor.startCall(finalChainName!, inputText, isFromTest);

    console.log(`About to call ${finalChainName} chain...`);

    // Try main chain up to 3 times
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(
          `Attempt ${attempt}/3 with ${finalChainName} main chain...`
        );
        const result = await mainChain.invoke(input);
        console.log(
          `${finalChainName} chain succeeded on attempt ${attempt}:`,
          result
        );

        // Validate if this is a test and validation is not skipped
        let validation = null;
        if (isFromTest && !skipValidation) {
          const validator = ValidatorFactory.create(finalChainName!);
          validation = validator.validate(
            finalChainName!,
            result,
            testExpected,
            true
          );
          // Pass validation data to monitor
          monitor.endCall(
            finalChainName!,
            result,
            undefined,
            testExpected,
            result,
            validation.match
          );
        } else {
          monitor.endCall(finalChainName!, result);
        }

        if (isFromTest) {
          return { result, validation };
        }
        return { result };
      } catch (error) {
        console.log(
          `${finalChainName} main chain attempt ${attempt} failed:`,
          error
        );
        if (attempt === 3) {
          console.log(
            `All 3 ${finalChainName} main chain attempts failed, trying fallback...`
          );
          try {
            const result = await fallbackChain.invoke(input);
            console.log(`${finalChainName} fallback chain succeeded:`, result);

            // Validate if this is a test and validation is not skipped
            let validation = null;
            if (isFromTest && !skipValidation) {
              const validator = ValidatorFactory.create(finalChainName!);
              validation = validator.validate(
                finalChainName!,
                result,
                testExpected,
                true
              );
              // Pass validation data to monitor
              monitor.endCall(
                finalChainName!,
                result,
                undefined,
                testExpected,
                result,
                validation.match
              );
            } else {
              monitor.endCall(finalChainName!, result);
            }

            if (isFromTest) {
              return { result, validation };
            }
            return { result };
          } catch (fallbackError) {
            console.log(
              `${finalChainName} fallback chain also failed:`,
              fallbackError
            );
            monitor.endCall(finalChainName!, null, fallbackError as Error);
            throw fallbackError;
          }
        }
      }
    }
  };
}
