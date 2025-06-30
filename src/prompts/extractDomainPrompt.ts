import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { DomainSchema } from "../schemas/domain.schema";

// 1) Build a StructuredOutputParser from your Zod schema
export const extractDomainParser =
  StructuredOutputParser.fromZodSchema(DomainSchema);

/**
 * Factory to create a PromptTemplate that asks the model
 * to summarize the job's domain from its description.
 */
export async function makeExtractDomainPrompt() {
  const formatInstructions = await extractDomainParser.getFormatInstructions();
  // Escape curly braces to avoid template parsing errors
  const escapedFormatInstructions = formatInstructions
    .replace(/\{/g, "{{")
    .replace(/\}/g, "}}");
  return PromptTemplate.fromTemplate(
    `You are an expert at categorizing job postings into their primary domain.
Respond with exactly this JSON schema (no extra keys, no prose):
${escapedFormatInstructions}

Job description:
{text}
`
  );
}
