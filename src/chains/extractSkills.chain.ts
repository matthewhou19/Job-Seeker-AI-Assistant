import { OllamaClient } from "../llm/clients";
import {
  extractSkillsParser,
  makeExtractSkillsPrompt,
} from "../prompts/extractSkillsPrompt";

export async function makeExtractSkillsChain() {
  // 1) build the prompt template
  const prompt = await makeExtractSkillsPrompt();

  // 2) wire up the default extraction chain
  return prompt.pipe(OllamaClient).pipe(extractSkillsParser);
}
