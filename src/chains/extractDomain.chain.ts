import { OllamaClient } from "../llm/clients";
import {
  extractDomainParser,
  makeExtractDomainPrompt,
} from "../prompts/extractDomainPrompt";

export async function makeExtractDomainChain() {
  // 1) build the prompt template
  const prompt = await makeExtractDomainPrompt();

  // 2) wire up the default extraction chain
  return prompt.pipe(OllamaClient).pipe(extractDomainParser);
}
