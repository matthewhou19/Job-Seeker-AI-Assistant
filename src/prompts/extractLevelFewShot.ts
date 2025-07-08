import { PromptTemplate, FewShotPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { LevelSchema } from "../schemas/level.schema";

// 1) Parser from your Zod schema
export const extractLevelParser =
  StructuredOutputParser.fromZodSchema(LevelSchema);

// 2) A few in-context examples
const examples = [
  {
    input: "Senior Software Engineer",
    output: `{{"level":"Senior"}}`,
  },
  {
    input: "Junior Frontend Developer",
    output: `{{"level":"Junior"}}`,
  },
  {
    input: "Lead UX Designer",
    output: `{{"level":"Lead"}}`,
  },
  {
    input: "Platform Engineer",
    output: `{{"level":null}}`,
  },
  {
    input: "Front-end Engineer",
    output: `{{"level":null}}`,
  },
];

// 3) Formatter for each example
const examplePrompt = PromptTemplate.fromTemplate(
  `Job Title: {input}
Level: {output}`
);

// 4) Factory that injects the schema's format instructions + examples
export async function makeExtractLevelFewShotPrompt() {
  const formatInstructions = await extractLevelParser.getFormatInstructions();
  // Escape curly braces to avoid template parsing errors
  const escapedFormatInstructions = formatInstructions
    .replace(/\{/g, "{{")
    .replace(/\}/g, "}}");
  return new FewShotPromptTemplate({
    examplePrompt,
    examples,
    prefix: `You are an expert at identifying seniority from job titles.  
Respond with exactly this JSON schema (no extra keys, no prose):
${escapedFormatInstructions}

Here are some examples:
`,
    suffix: `Now extract the level from this job title: (not the domain)
Job Title: {text}
Level:`,
    inputVariables: ["text"],
  });
}
