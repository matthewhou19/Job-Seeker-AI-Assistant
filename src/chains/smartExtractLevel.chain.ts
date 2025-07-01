import { createExtractionChain } from "langchain/chains";
import {
  extractLevelParser,
  makeExtractLevelFewShotPrompt,
} from "../prompts/extractLevelFewShot";
import {
  inferLevelParser,
  makeInferLevelPrompt,
} from "../prompts/inferLevelPrompt";
import { makeChain, OllamaClient } from "../llm/clients";
import { LevelSchema } from "../schemas/level.schema";

export async function makeSmartExtractLevelChain() {
  // 1) explicit‐mention chain (title / description)
  const explicitPrompt = await makeExtractLevelFewShotPrompt();
  const explicitChain = makeChain(explicitPrompt as any, LevelSchema);

  // 2) inference chain (when explicit = null)
  const inferPrompt = await makeInferLevelPrompt();
  const inferChain = makeChain(inferPrompt as any, LevelSchema);

  // 3) wrapper with “first do explicit, then infer if needed”
  return {
    /**
     * @param inputs.text  the combined title+description (or just description)
     */
    async call(inputs: { text: string }) {
      // try explicit
      const explicit = await explicitChain(inputs);

      if (explicit.level) {
        // found it
        return { text: explicit };
      }

      // fallback to inference
      const infer = await inferChain(inputs);
      return { text: infer };
    },
  };
}
