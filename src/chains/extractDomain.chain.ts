import { makeExtractDomainPrompt } from "../prompts/extractDomainPrompt";
import { makeChain } from "../llm/clients";
import { DomainSchema } from "../schemas/domain.schema";

export async function makeExtractDomainChain() {
  // 1) build your prompt
  const prompt = await makeExtractDomainPrompt();

  // 2) wire up the chain with monitoring
  return makeChain(prompt as any, DomainSchema, "extractDomain");
}
