import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { LevelSchema } from "../schemas/level.schema";

// Parser reusable in chain wiring
export const inferLevelParser =
  StructuredOutputParser.fromZodSchema(LevelSchema);

/**
 * Builds a PromptTemplate that asks the model to *infer* the level
 * when it's not stated explicitly.
 */
export async function makeInferLevelPrompt() {
  const formatInstructions = await inferLevelParser.getFormatInstructions();
  // Escape curly braces to avoid template parsing errors
  const escapedFormatInstructions = formatInstructions
    .replace(/\{/g, "{{")
    .replace(/\}/g, "}}");
  return PromptTemplate.fromTemplate(
    `Sometimes a job posting doesn't state "Senior" or "Junior" explicitly.
Based on the following job **description**, pick the best-fit level from:
["Intern","Entry","Junior","Mid","Senior","Lead","Manager","Director","Executive"].

Respond with exactly this JSON schema (no extra keys, no prose):
${escapedFormatInstructions}

Description:
{text}

`
  );
}
