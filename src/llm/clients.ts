import { GoogleGenerativeAI } from "@google/generative-ai";
import { config as dotenvConfig } from "dotenv";
import {
  BaseLLM,
  BaseLLMCallOptions,
} from "@langchain/core/language_models/llms";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { z } from "zod";
import { spawnSync } from "child_process";
import { ChainPerformanceMonitor } from "../monitor/ChainPerformanceMonitor";
import { ValidatorFactory } from "../monitor/Validator";

dotenvConfig();

// 1. Custom Gemini CLI LLM wrapper
export class GeminiCLI extends BaseLLM<BaseLLMCallOptions> {
  lc_serializable = true;

  constructor(public cliPath = "gemini", public model = "gemini-2.5-pro") {
    super({});
  }

  _llmType() {
    return "gemini-cli";
  }

  async _call(prompt: string): Promise<string> {
    const args = ["--model", this.model];
    const isWin = process.platform === "win32";
    const geminiCmd = isWin ? "gemini.cmd" : this.cliPath;
    const res = spawnSync(geminiCmd, args, {
      input: prompt,
      encoding: "utf-8",
      shell: true,
    });
    if (res.error) throw res.error;
    if (res.status !== 0) throw new Error(`Gemini CLI error: ${res.stderr}`);
    return res.stdout;
  }

  async _generate(prompts: string[], options?: BaseLLMCallOptions) {
    const generations = await Promise.all(
      prompts.map(async (prompt) => {
        const text = await this._call(prompt);
        return {
          text,
          generationInfo: {},
        };
      })
    );

    return {
      generations: [generations],
    };
  }
}

// Configure your primary model with built-in retries
const geminiModel = process.env.GEMINI_MODEL || "gemini-2.0-flash-lite";
const geminiApiKey = process.env.GEMINI_API_KEY || "";
const geminiTemperature = Number(process.env.GEMINI_TEMPERATURE) || 0.7;
const geminiMaxRetries = Number(process.env.GEMINI_MAX_RETRIES) || 3;

class GeminiFlashLiteLLM extends BaseLLM<BaseLLMCallOptions> {
  lc_serializable = true;
  private model;
  private maxRetries;

  constructor() {
    super({});
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    this.model = genAI.getGenerativeModel({
      model: geminiModel,
      generationConfig: { temperature: geminiTemperature },
    });
    this.maxRetries = geminiMaxRetries;
  }

  _llmType() {
    return "gemini-api";
  }

  async _call(prompt: string): Promise<string> {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const result = await this.model.generateContent(prompt);
        return result.response.text();
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

export const GeminiFlashLiteClient = new GeminiFlashLiteLLM();

// Configure fallback model (CLI)
export const GeminiCLIClient = new GeminiCLI();

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
    GeminiFlashLiteClient,
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

  // Create the fallback chain
  const fallbackChain = RunnableSequence.from([
    prompt,
    GeminiCLIClient,
    (output: string) => {
      console.log("Gemini CLI raw output:", output);
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
        console.log(`Attempt ${attempt}/3 with ${finalChainName} main chain...`);
        const result = await mainChain.invoke(input);
        console.log(`${finalChainName} chain succeeded on attempt ${attempt}:`, result);

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
