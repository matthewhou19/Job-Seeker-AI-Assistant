import { PromptTemplate, FewShotPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { YearsSchema } from "../schemas/years.schema";

// 1) Build a parser from your Zod schema (we'll reuse this in the chain)
export const extractYearsParser =
  StructuredOutputParser.fromZodSchema(YearsSchema);

// 2) Define a few examples to ground the model
const examples = [
  {
    input: "Senior DevOps Engineer with 3–5 years of cloud experience.",
    output: `{{"requestYears":3}}`,
  },
  {
    input: "Entry-level role: 0 to 1 year preferred.",
    output: `{{"requestYears":1}}`,
  },
];

// 3) How to format each example
const examplePrompt = PromptTemplate.fromTemplate(
  `Input: {input}
Output: {output}`
);

// 4) Factory to create a FewShotPromptTemplate (async because parser provides format_instructions)
export async function makeExtractYearsFewShotPrompt() {
  const formatInstructions = await extractYearsParser.getFormatInstructions();
  // Escape curly braces to avoid template parsing errors
  const escapedFormatInstructions = formatInstructions
    .replace(/\{/g, "{{")
    .replace(/\}/g, "}}");
  return new FewShotPromptTemplate({
    examplePrompt,
    examples,
    prefix: `You are a JSON extractor.  For each "Input", produce exactly this schema (no extra keys, no prose):
${escapedFormatInstructions}

Here are some examples:
`,
    suffix: `Now extract from this job text:
Input: {text}
Output:`,
    inputVariables: ["text"],
  });
}
