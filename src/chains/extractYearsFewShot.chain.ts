import { makeExtractYearsFewShotPrompt } from "../prompts/extractYearsFewShot";
import { makeChain } from "../llm/clients";
import { YearsSchema } from "../schemas/years.schema";

export async function makeExtractYearsChain() {
  // 1) build your few-shot prompt
  const prompt = await makeExtractYearsFewShotPrompt();

  // 2) wire up the chain
  return makeChain(prompt as any, YearsSchema);
}
