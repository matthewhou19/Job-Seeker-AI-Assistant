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

Here are some examples:

Example 1:
Description: "Looking for a recent graduate or student to join our team. No prior experience required. Will learn on the job."
Level: Intern

Example 2:
Description: "Seeking a developer with 1-2 years of experience. Knowledge of basic programming concepts required."
Level: Junior

Example 3:
Description: "We need someone with 3-5 years of experience who can work independently and mentor junior developers."
Level: Senior

Example 4:
Description: "Leading a team of 5-10 engineers. Responsible for technical decisions and project planning."
Level: Lead

Example 5:
Description: "Managing multiple teams and departments. Strategic planning and budget responsibility."
Level: Manager

Example 6:
Description: "Overseeing all engineering operations. Reporting to CTO. 10+ years experience required."
Level: Director

Respond with exactly this JSON schema (no extra keys, no prose):
${escapedFormatInstructions}

Description:
{text}

`
  );
}
