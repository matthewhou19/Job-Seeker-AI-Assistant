import { createExtractionChain } from "langchain/chains";
import {
  extractLevelParser,
  makeExtractLevelFewShotPrompt,
} from "../prompts/extractLevelFewShot";
import {
  inferLevelParser,
  makeInferLevelPrompt,
} from "../prompts/inferLevelPrompt";
import { OllamaClient } from "../llm/clients";

export async function makeSmartExtractLevelChain() {
  // 1) explicit‐mention chain (title / description)
  const explicitPrompt = await makeExtractLevelFewShotPrompt();
  const explicitChain = explicitPrompt
    .pipe(OllamaClient)
    .pipe(extractLevelParser);

  // 2) inference chain (when explicit = null)
  const inferPrompt = await makeInferLevelPrompt();
  const inferChain = inferPrompt.pipe(OllamaClient).pipe(inferLevelParser);

  // 3) wrapper with “first do explicit, then infer if needed”
  return {
    /**
     * @param inputs.text  the combined title+description (or just description)
     */
    async call(inputs: { text: string }) {
      // try explicit
      const explicit = await explicitChain.invoke(inputs);

      if (explicit.level) {
        // found it
        return { text: explicit };
      }

      // fallback to inference
      const infer = await inferChain.invoke(inputs);
      return { text: infer };
    },
  };
}
