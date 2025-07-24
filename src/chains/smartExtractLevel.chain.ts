import { makeExtractLevelFewShotPrompt } from "../prompts/extractLevelFewShot";
import { makeInferLevelPrompt } from "../prompts/inferLevelPrompt";
import { makeChain } from "../llm/clients";
import { LevelSchema } from "../schemas/level.schema";
import { ChainPerformanceMonitor } from "../monitor/ChainPerformanceMonitor";
import { ValidatorFactory } from "../monitor/Validator";

export async function makeSmartExtractLevelChain() {
  // 1) explicit‐mention chain (title / description) - no monitoring
  const explicitPrompt = await makeExtractLevelFewShotPrompt();
  const explicitChain = makeChain(explicitPrompt as any, LevelSchema, ""); // Empty name = no monitoring

  // 2) inference chain (when explicit = null) - no monitoring
  const inferPrompt = await makeInferLevelPrompt();
  const inferChain = makeChain(inferPrompt as any, LevelSchema, ""); // Empty name = no monitoring

  // 3) wrapper with monitoring for the overall extractLevel chain
  return {
    /**
     * @param inputs.text  the combined title+description (or just description)
     */
    async call(inputs: { text: string }, testExpected?: any) {
      const isFromTest = testExpected !== undefined;
      const monitor = ChainPerformanceMonitor.getInstance();
      const inputText = JSON.stringify(inputs);
      monitor.startCall("extractLevel", inputText, isFromTest);

      try {
        // try explicit
        const explicitResponse = await explicitChain(inputs);
        const explicit = explicitResponse?.result;

        if (explicit?.level) {
          // found it
          const result = { text: explicit };

          // Validate if this is a test
          let validation = null;
          if (isFromTest) {
            const validator = ValidatorFactory.create("extractLevel");
            validation = validator.validate(
              "extractLevel",
              result,
              testExpected,
              true
            );
            // Pass validation data to monitor
            monitor.endCall(
              "extractLevel",
              result,
              undefined,
              testExpected,
              result,
              validation.match
            );
          } else {
            monitor.endCall("extractLevel", result);
          }

          if (isFromTest) {
            return { result, validation };
          }
          return { result };
        }

        // fallback to inference
        const inferResponse = await inferChain(inputs);
        const infer = inferResponse?.result;
        const result = { text: infer };

        // Validate if this is a test
        let validation = null;
        if (isFromTest) {
          const validator = ValidatorFactory.create("extractLevel");
          validation = validator.validate(
            "extractLevel",
            result,
            testExpected,
            true
          );
          // Pass validation data to monitor
          monitor.endCall(
            "extractLevel",
            result,
            undefined,
            testExpected,
            result,
            validation.match
          );
        } else {
          monitor.endCall("extractLevel", result);
        }

        if (isFromTest) {
          return { result, validation };
        }
        return { result };
      } catch (error) {
        monitor.endCall("extractLevel", null, error as Error);
        throw error;
      }
    },
  };
}
