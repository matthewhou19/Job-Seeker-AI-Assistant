import { Ollama } from "@langchain/ollama";
import {
  BaseLLM,
  BaseLLMCallOptions,
} from "@langchain/core/language_models/llms";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { z } from "zod";
import { spawnSync } from "child_process";

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
export const OllamaClient = new Ollama({
  model: "mistral",
  temperature: 0.7,
  maxRetries: 3, // LangChain's built-in retry mechanism
});

// Configure fallback model
export const GeminiClient = new GeminiCLI();

/**
 * Create a chain that uses LangChain's built-in retry and fallback mechanisms
 */
export function makeChain<T>(prompt: PromptTemplate, schema: z.ZodType<T>) {
  // Create the main chain with built-in retries
  const mainChain = RunnableSequence.from([
    prompt,
    OllamaClient,
    (output: string) => {
      console.log("Ollama raw output:", output);
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
    GeminiClient,
    (output: string) => {
      console.log("Raw LLM output:", output);
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

  // Return a chain that tries main, then fallback
  return async (input: any) => {
    console.log("About to call main chain...");
    try {
      const result = await mainChain.invoke(input);
      console.log("Main chain succeeded:", result);
      return result;
    } catch (error) {
      console.log("Main chain failed, trying fallback...", error);
      return await fallbackChain.invoke(input);
    }
  };
}
