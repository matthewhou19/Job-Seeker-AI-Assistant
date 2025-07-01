import { makeChain } from "../llm/clients";
import { makeExtractSkillsPrompt } from "../prompts/extractSkillsPrompt";
import { SkillsSchema } from "../schemas/skills.schema";

export async function makeExtractSkillsChain() {
  // 1) build the prompt template
  const prompt = await makeExtractSkillsPrompt();

  // 2) wire up the default extraction chain
  return makeChain(prompt, SkillsSchema);
}
