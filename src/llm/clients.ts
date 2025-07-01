import { Ollama } from "@langchain/ollama";
import {
  BaseLLM,
  BaseLLMCallOptions,
} from "@langchain/core/language_models/llms";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { z } from "zod";
import { spawnSync } from "child_process";

// Performance monitoring class
class ChainPerformanceMonitor {
  private static instance: ChainPerformanceMonitor;
  private metrics: {
    [chainName: string]: {
      totalCalls: number;
      totalDuration: number;
      totalInputTokens: number;
      totalOutputTokens: number;
      errors: number;
      minDuration: number;
      maxDuration: number;
      lastCallTime?: number;
    };
  } = {};

  static getInstance(): ChainPerformanceMonitor {
    if (!ChainPerformanceMonitor.instance) {
      ChainPerformanceMonitor.instance = new ChainPerformanceMonitor();
    }
    return ChainPerformanceMonitor.instance;
  }

  startCall(chainName: string, inputText: string): string {
    if (!this.metrics[chainName]) {
      this.metrics[chainName] = {
        totalCalls: 0,
        totalDuration: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        errors: 0,
        minDuration: Infinity,
        maxDuration: 0,
      };
    }

    this.metrics[chainName].totalCalls++;
    this.metrics[chainName].lastCallTime = Date.now();

    // Estimate input tokens
    const estimatedInputTokens = Math.ceil(inputText.length / 4);
    this.metrics[chainName].totalInputTokens += estimatedInputTokens;

    return chainName;
  }

  endCall(chainName: string, result: any, error?: Error): void {
    const metrics = this.metrics[chainName];
    if (!metrics || !metrics.lastCallTime) return;

    const duration = Date.now() - metrics.lastCallTime;
    metrics.totalDuration += duration;
    metrics.minDuration = Math.min(metrics.minDuration, duration);
    metrics.maxDuration = Math.max(metrics.maxDuration, duration);

    if (error) {
      metrics.errors++;
    } else {
      // Estimate output tokens
      const resultStr = JSON.stringify(result);
      const estimatedOutputTokens = Math.ceil(resultStr.length / 4);
      metrics.totalOutputTokens += estimatedOutputTokens;
    }

    // Log performance for this call
    console.log(
      `📊 ${chainName}: ${duration}ms, ${metrics.totalInputTokens} input tokens, ${metrics.totalOutputTokens} output tokens`
    );
  }

  getMetrics() {
    return this.metrics;
  }

  getChainMetrics(chainName: string) {
    return this.metrics[chainName];
  }

  logChainMetrics(chainName: string) {
    const metrics = this.metrics[chainName];
    if (!metrics) return;

    const avgDuration =
      metrics.totalCalls > 0 ? metrics.totalDuration / metrics.totalCalls : 0;
    console.log(`\n🔗 ${chainName} Metrics:`);
    console.log(`   Total Calls: ${metrics.totalCalls}`);
    console.log(`   Avg Duration: ${avgDuration.toFixed(0)}ms`);
    console.log(
      `   Min/Max: ${
        metrics.minDuration === Infinity ? 0 : metrics.minDuration
      }ms / ${metrics.maxDuration}ms`
    );
    console.log(
      `   Total Tokens: ${(
        metrics.totalInputTokens + metrics.totalOutputTokens
      ).toLocaleString()}`
    );
  }

  printSummary() {
    console.log("\n📊 Chain Performance Summary:");
    console.log("=".repeat(50));

    let totalCalls = 0;
    let totalDuration = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalErrors = 0;

    Object.entries(this.metrics).forEach(([chainName, metrics]) => {
      const avgDuration =
        metrics.totalCalls > 0 ? metrics.totalDuration / metrics.totalCalls : 0;
      const successRate =
        metrics.totalCalls > 0
          ? ((metrics.totalCalls - metrics.errors) / metrics.totalCalls) * 100
          : 0;

      console.log(`\n🔗 ${chainName}:`);
      console.log(`   Calls: ${metrics.totalCalls}`);
      console.log(`   Avg Duration: ${avgDuration.toFixed(0)}ms`);
      console.log(
        `   Min/Max Duration: ${
          metrics.minDuration === Infinity ? 0 : metrics.minDuration
        }ms / ${metrics.maxDuration}ms`
      );
      console.log(
        `   Input Tokens: ${metrics.totalInputTokens.toLocaleString()}`
      );
      console.log(
        `   Output Tokens: ${metrics.totalOutputTokens.toLocaleString()}`
      );
      console.log(`   Success Rate: ${successRate.toFixed(1)}%`);

      totalCalls += metrics.totalCalls;
      totalDuration += metrics.totalDuration;
      totalInputTokens += metrics.totalInputTokens;
      totalOutputTokens += metrics.totalOutputTokens;
      totalErrors += metrics.errors;
    });

    const overallAvgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;
    const overallSuccessRate =
      totalCalls > 0 ? ((totalCalls - totalErrors) / totalCalls) * 100 : 0;
    const totalTokens = totalInputTokens + totalOutputTokens;

    console.log(`\n🎯 Overall Performance:`);
    console.log(`   Total Calls: ${totalCalls}`);
    console.log(`   Total Duration: ${totalDuration}ms`);
    console.log(`   Avg Duration: ${overallAvgDuration.toFixed(0)}ms`);
    console.log(`   Total Tokens: ${totalTokens.toLocaleString()}`);
    console.log(`   Success Rate: ${overallSuccessRate.toFixed(1)}%`);

    // Rough cost estimation (assuming $0.0015 per 1K tokens)
    const estimatedCost = (totalTokens / 1000) * 0.0015;
    console.log(`   Estimated Cost: $${estimatedCost.toFixed(4)}`);
  }

  reset() {
    this.metrics = {};
  }
}

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
export function makeChain<T>(
  prompt: PromptTemplate,
  schema: z.ZodType<T>,
  chainName?: string
) {
  const monitor = ChainPerformanceMonitor.getInstance();
  const finalChainName = chainName || "unknown";

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

  // Return a chain that tries main, then fallback with monitoring
  return async (input: any) => {
    const inputText = JSON.stringify(input);
    monitor.startCall(finalChainName, inputText);

    console.log(`About to call ${finalChainName} chain...`);
    try {
      const result = await mainChain.invoke(input);
      console.log(`${finalChainName} chain succeeded:`, result);
      monitor.endCall(finalChainName, result);
      return result;
    } catch (error) {
      console.log(
        `${finalChainName} main chain failed, trying fallback...`,
        error
      );
      try {
        const result = await fallbackChain.invoke(input);
        console.log(`${finalChainName} fallback chain succeeded:`, result);
        monitor.endCall(finalChainName, result);
        return result;
      } catch (fallbackError) {
        console.log(
          `${finalChainName} fallback chain also failed:`,
          fallbackError
        );
        monitor.endCall(finalChainName, null, fallbackError as Error);
        throw fallbackError;
      }
    }
  };
}

// Export the monitor for external access
export { ChainPerformanceMonitor };
