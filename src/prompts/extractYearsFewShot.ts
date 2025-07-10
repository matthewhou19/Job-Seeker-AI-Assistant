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
    output: `{{"requestYears":0}}`,
  },
  {
    input:
      "Bachelor's degree in computer science, engineering, math, or scientific discipline with 5 years experience; OR Master's degree with 3 years of experience in software development; OR PHD with 1 year of experience in software development",
    output: `{{"requestYears":5}}`,
  },
  {
    input:
      "5 to 8 years experience in Software Quality Assurance and/or Software Testing experience",
    output: `{{"requestYears":5}}`,
  },
  {
    input:
      "qualifications: 'Delivered a working software stack for an ML accelerator', 'Managed teams of 20+', 'Expertise in ML compilers and ML kernel development",
    output: `{{"requestYears":0}}`,
  },
  {
    input:
      "qualifications: 3+ years of non-internship professional front end, web or mobile software development using JavaScript, HTML and CSS experience 3+ years of computer science fundamentals (object-oriented design, data structures, algorithm design, problem solving and complexity analysis) experience。 Experience with object-oriented design.Experience using JavaScript frameworks such as angular and react.Preferred Qualifications 1+ years of agile software development methodology experience Experience building scalable, distributed, front-end experiences",
    output: `{{"requestYears":3}}`,
  },
  {
    input:
      "4+ years of non-internship design or architecture (design patterns, reliability and scaling) of new and existing systems experience', '4+ years of non-internship professional software development experience,Preferred Qualifications 3+ years of full software development life cycle, including coding standards, code reviews, source control management, build processes, testing, and operations experience",
    output: `{{"requestYears":4}}`,
  },
  {
    input:
      "8+ years of consistent track record as a data engineer, 3+ years of experience with mobile data, 5+ years of experience with distributed data technologies, 2+ years of experience with cloud-based technologies",
    output: `{{"requestYears":8}}`,
  },
  {
    input:
      "Senior Software Engineer: 7+ years of software development experience, 3+ years of cloud experience, 2+ years of team leadership",
    output: `{{"requestYears":7}}`,
  },
  {
    input:
      "Lead Developer: 10+ years of experience required, 5+ years in Java, 3+ years in cloud technologies",
    output: `{{"requestYears":10}}`,
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
    prefix: `You are a JSON job posting analyzer. Extract the primary years of experience required from job postings.

Rules:
- If multiple years are mentioned, extract the HIGHEST number (most senior requirement)
- If no years are mentioned, return 0
- Focus on the main/primary experience requirement, not secondary or preferred qualifications
- For ranges like "3-5 years", extract the minimum (3)

For each "Input", produce exactly this schema (no extra keys, no prose):
${escapedFormatInstructions}

Here are some examples:
`,
    suffix: `Now extract from this job text:
Input: {text}
Output:`,
    inputVariables: ["text"],
  });
}
