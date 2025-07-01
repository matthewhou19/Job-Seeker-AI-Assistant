import { makeChain } from "../llm/clients";
import { makeExtractDomainPrompt } from "../prompts/extractDomainPrompt";
import { DomainSchema } from "../schemas/domain.schema";

export async function makeExtractDomainChain() {
  // 1) build the prompt template
  const prompt = await makeExtractDomainPrompt();

  // 2) wire up the default extraction chain
  return makeChain(prompt, DomainSchema);
}
