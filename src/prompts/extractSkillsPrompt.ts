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
    `You are an expert at identifying specific technical skills from job postings.

Focus on extracting:
- Programming languages (Python, Java, JavaScript, Rust, Go, etc.)
- Frameworks and libraries (React, Node.js, Django, TensorFlow, etc.)
- Tools and platforms (AWS, Docker, Kubernetes, Git, etc.)
- Databases (PostgreSQL, MongoDB, Redis, etc.)
- Specific technologies mentioned in the job

Avoid general concepts like "Leadership", "Problem Solving", "Communication" unless they are specifically mentioned as technical requirements.

Extract 5-15 specific technical skills that are explicitly mentioned in the job posting.

Respond with exactly this JSON schema (no extra keys, no prose):
${escapedFormatInstructions}

Job posting:
{text}

Skills:`
  );
}
