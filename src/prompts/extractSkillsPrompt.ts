import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { SkillsSchema } from "../schemas/skills.schema";

export const extractSkillsParser =
  StructuredOutputParser.fromZodSchema(SkillsSchema);

/**
 * Factory to create a PromptTemplate that summarizes required skills
 * from a job description. Returns a JSON array of strings.
 */
export async function makeExtractSkillsPrompt() {
  const formatInstructions = await extractSkillsParser.getFormatInstructions();
  // Escape curly braces to avoid template parsing errors
  const escapedFormatInstructions = formatInstructions
    .replace(/\{/g, "{{")
    .replace(/\}/g, "}}");
  return PromptTemplate.fromTemplate(
    `You are an expert at identifying and summarizing skills required in a job posting.  
Respond with exactly this JSON schema (no extra keys, no prose):
${escapedFormatInstructions}

Job posting:
{text}

Skills:`
  );
}
