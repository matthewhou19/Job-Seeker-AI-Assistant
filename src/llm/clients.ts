import { Ollama } from "@langchain/ollama";
import {
  BaseLLM,
  BaseLLMCallOptions,
} from "@langchain/core/language_models/llms";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { z } from "zod";
import { spawnSync } from "child_process";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

// Performance monitoring class
class ChainPerformanceMonitor {
  private static instance: ChainPerformanceMonitor;
  private callHistory: Array<{
    timestamp: string;
    chainName: string;
    duration: number;
    inputTokens: number;
    outputTokens: number;
    success: boolean;
    isFromTest: boolean;
    testMatch: boolean | null; // null if not from test, true/false if from test
    testExpected?: any; // expected value for test calls
    testActual?: any; // actual value for test calls
  }> = [];

  static getInstance(): ChainPerformanceMonitor {
    if (!ChainPerformanceMonitor.instance) {
      ChainPerformanceMonitor.instance = new ChainPerformanceMonitor();
    }
    return ChainPerformanceMonitor.instance;
  }

  startCall(
    chainName: string,
    inputText: string,
    isFromTest: boolean = false
  ): string {
    const timestamp = new Date().toISOString();
    const inputTokens = Math.ceil(inputText.length / 4);

    // Store call start info
    (this as any).currentCall = {
      timestamp,
      chainName,
      inputTokens,
      isFromTest,
      startTime: Date.now(),
    };

    return chainName;
  }

  endCall(
    chainName: string,
    result: any,
    error?: Error,
    testExpected?: any,
    testActual?: any
  ): void {
    const currentCall = (this as any).currentCall;
    if (!currentCall || currentCall.chainName !== chainName) return;

    const duration = Date.now() - currentCall.startTime;
    const outputTokens = Math.ceil(JSON.stringify(result).length / 4);
    const success = !error;

    // Determine if this call matches expected result (for test calls)
    let testMatch: boolean | null = null;
    if (
      currentCall.isFromTest &&
      testExpected !== undefined &&
      testActual !== undefined
    ) {
      testMatch = JSON.stringify(testExpected) === JSON.stringify(testActual);
    }

    // Add to call history
    this.callHistory.push({
      timestamp: currentCall.timestamp,
      chainName: currentCall.chainName,
      duration,
      inputTokens: currentCall.inputTokens,
      outputTokens,
      success,
      isFromTest: currentCall.isFromTest,
      testMatch,
      testExpected,
      testActual,
    });

    // Log performance for this call
    const testInfo = currentCall.isFromTest
      ? ` (Test: ${testMatch ? "✅" : "❌"})`
      : "";
    console.log(
      `📊 ${chainName}: ${duration}ms, ${currentCall.inputTokens} input tokens, ${outputTokens} output tokens${testInfo}`
    );

    // Clear current call
    (this as any).currentCall = null;
  }

  getCallHistory() {
    return this.callHistory;
  }

  getMetrics() {
    // Calculate aggregated metrics from call history
    const metrics: { [chainName: string]: any } = {};

    this.callHistory.forEach((call) => {
      if (!metrics[call.chainName]) {
        metrics[call.chainName] = {
          totalCalls: 0,
          totalDuration: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          errors: 0,
          minDuration: Infinity,
          maxDuration: 0,
          testCalls: 0,
          testMatches: 0,
        };
      }

      const m = metrics[call.chainName];
      m.totalCalls++;
      m.totalDuration += call.duration;
      m.totalInputTokens += call.inputTokens;
      m.totalOutputTokens += call.outputTokens;
      m.minDuration = Math.min(m.minDuration, call.duration);
      m.maxDuration = Math.max(m.maxDuration, call.duration);

      if (!call.success) m.errors++;
      if (call.isFromTest) {
        m.testCalls++;
        if (call.testMatch) m.testMatches++;
      }
    });

    return metrics;
  }

  printSummary() {
    const metrics = this.getMetrics();
    console.log("\n📊 Chain Performance Summary:");
    console.log("=".repeat(50));

    let totalCalls = 0;
    let totalDuration = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalErrors = 0;

    Object.entries(metrics).forEach(([chainName, m]) => {
      const avgDuration = m.totalCalls > 0 ? m.totalDuration / m.totalCalls : 0;
      const successRate =
        m.totalCalls > 0 ? ((m.totalCalls - m.errors) / m.totalCalls) * 100 : 0;
      const testAccuracy =
        m.testCalls > 0 ? (m.testMatches / m.testCalls) * 100 : 0;

      console.log(`\n🔗 ${chainName}:`);
      console.log(`   Calls: ${m.totalCalls}`);
      console.log(`   Avg Duration: ${avgDuration.toFixed(0)}ms`);
      console.log(
        `   Min/Max Duration: ${
          m.minDuration === Infinity ? 0 : m.minDuration
        }ms / ${m.maxDuration}ms`
      );
      console.log(`   Input Tokens: ${m.totalInputTokens.toLocaleString()}`);
      console.log(`   Output Tokens: ${m.totalOutputTokens.toLocaleString()}`);
      console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
      if (m.testCalls > 0) {
        console.log(
          `   Test Accuracy: ${testAccuracy.toFixed(1)}% (${m.testMatches}/${
            m.testCalls
          })`
        );
      }

      totalCalls += m.totalCalls;
      totalDuration += m.totalDuration;
      totalInputTokens += m.totalInputTokens;
      totalOutputTokens += m.totalOutputTokens;
      totalErrors += m.errors;
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
    this.callHistory = [];
  }

  exportToCSV(
    filename?: string,
    append: boolean = true,
    clearAfterExport: boolean = false
  ): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const defaultFilename = `chain-performance.csv`;
    const finalFilename = filename || defaultFilename;

    // Create CSV header
    const csvHeader = [
      "Timestamp",
      "Chain Name",
      "Duration (ms)",
      "Input Tokens",
      "Output Tokens",
      "Success",
      "Is From Test",
      "Test Match",
      "Test Expected",
      "Test Actual",
    ].join(",");

    // Create CSV rows - one row per call
    const csvRows = this.callHistory.map((call) => {
      return [
        call.timestamp,
        call.chainName,
        call.duration,
        call.inputTokens,
        call.outputTokens,
        call.success,
        call.isFromTest,
        call.testMatch,
        call.testExpected ? JSON.stringify(call.testExpected) : "",
        call.testActual ? JSON.stringify(call.testActual) : "",
      ].join(",");
    });

    const filePath = join(process.cwd(), finalFilename);

    if (append && existsSync(filePath)) {
      // Append to existing file (without header)
      const existingContent = readFileSync(filePath, "utf8");
      const newContent = csvRows.join("\n");
      const combinedContent = existingContent + "\n" + newContent;
      writeFileSync(filePath, combinedContent, "utf8");
      console.log(`📊 Performance metrics appended to: ${filePath}`);
    } else {
      // Create new file with header
      const csvContent = [csvHeader, ...csvRows].join("\n");
      writeFileSync(filePath, csvContent, "utf8");
      console.log(`📊 Performance metrics exported to: ${filePath}`);
    }

    // Clear metrics after export if requested
    if (clearAfterExport) {
      this.reset();
      console.log(`🔄 Metrics cleared after export`);
    }

    return filePath;
  }

  getMetricsAsJSON(): object {
    return {
      timestamp: new Date().toISOString(),
      callHistory: this.callHistory,
      summary: this.getSummaryStats(),
    };
  }

  private getSummaryStats() {
    const metrics = this.getMetrics();
    let totalCalls = 0;
    let totalDuration = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalErrors = 0;

    Object.values(metrics).forEach((m) => {
      totalCalls += m.totalCalls;
      totalDuration += m.totalDuration;
      totalInputTokens += m.totalInputTokens;
      totalOutputTokens += m.totalOutputTokens;
      totalErrors += m.errors;
    });

    const overallAvgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;
    const overallSuccessRate =
      totalCalls > 0 ? ((totalCalls - totalErrors) / totalCalls) * 100 : 0;
    const totalTokens = totalInputTokens + totalOutputTokens;
    const estimatedCost = (totalTokens / 1000) * 0.0015;

    return {
      totalCalls,
      totalDuration,
      overallAvgDuration: overallAvgDuration.toFixed(2),
      totalTokens,
      overallSuccessRate: overallSuccessRate.toFixed(2),
      estimatedCost: estimatedCost.toFixed(4),
    };
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
  return async (
    input: any,
    isFromTest: boolean = false,
    testExpected?: any
  ) => {
    const inputText = JSON.stringify(input);
    monitor.startCall(finalChainName, inputText, isFromTest);

    console.log(`About to call ${finalChainName} chain...`);
    try {
      const result = await mainChain.invoke(input);
      console.log(`${finalChainName} chain succeeded:`, result);
      monitor.endCall(finalChainName, result, undefined, testExpected, result);
      return result;
    } catch (error) {
      console.log(
        `${finalChainName} main chain failed, trying fallback...`,
        error
      );
      try {
        const result = await fallbackChain.invoke(input);
        console.log(`${finalChainName} fallback chain succeeded:`, result);
        monitor.endCall(
          finalChainName,
          result,
          undefined,
          testExpected,
          result
        );
        return result;
      } catch (fallbackError) {
        console.log(
          `${finalChainName} fallback chain also failed:`,
          fallbackError
        );
        monitor.endCall(
          finalChainName,
          null,
          fallbackError as Error,
          testExpected,
          null
        );
        throw fallbackError;
      }
    }
  };
}

// Export the monitor for external access
export { ChainPerformanceMonitor };
