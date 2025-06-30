import { createExtractionChain } from "langchain/chains";
import {
  extractYearsParser,
  makeExtractYearsFewShotPrompt,
} from "../prompts/extractYearsFewShot";
import { OllamaClient } from "../llm/clients";

export async function makeExtractYearsChain() {
  // 1) build your few-shot prompt
  const prompt = await makeExtractYearsFewShotPrompt();

  // 2) wire up the chain
  return prompt.pipe(OllamaClient).pipe(extractYearsParser);
}
