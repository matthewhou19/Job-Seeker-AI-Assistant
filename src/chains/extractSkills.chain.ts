import { makeExtractSkillsPrompt } from "../prompts/extractSkillsPrompt";
import { makeChain } from "../llm/clients";
import { SkillsSchema } from "../schemas/skills.schema";

export async function makeExtractSkillsChain() {
  // 1) build your prompt
  const prompt = await makeExtractSkillsPrompt();

  // 2) wire up the chain with monitoring and optimized validation
  return makeChain(prompt as any, SkillsSchema, "extractSkills", false);
}
