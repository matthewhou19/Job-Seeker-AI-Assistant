import { PromptTemplate, FewShotPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { LevelSchema } from "../schemas/level.schema";

// 1) Parser from your Zod schema
export const extractLevelParser =
  StructuredOutputParser.fromZodSchema(LevelSchema);

// 2) A few in-context examples using the 9 specific levels
const examples = [
  {
    input: "Software Engineer Intern",
    output: `{"level":"Intern"}`,
  },
  {
    input: "Entry Level Data Analyst",
    output: `{"level":"Entry"}`,
  },
  {
    input: "Junior Frontend Developer",
    output: `{"level":"Junior"}`,
  },
  {
    input: "Mid Level React Developer",
    output: `{"level":"Mid"}`,
  },
  {
    input: "Mid Software Engineer",
    output: `{"level":"Mid"}`,
  },
  {
    input: "Senior Software Engineer",
    output: `{"level":"Senior"}`,
  },
  {
    input: "Senior Backend Developer",
    output: `{"level":"Senior"}`,
  },
  {
    input: "Lead UX Designer",
    output: `{"level":"Lead"}`,
  },
  {
    input: "Engineering Manager",
    output: `{"level":"Manager"}`,
  },
  {
    input: "Director of Engineering",
    output: `{"level":"Director"}`,
  },
  {
    input: "Chief Technology Officer",
    output: `{"level":"Executive"}`,
  },
  {
    input: "Platform Engineer",
    output: `{"level":null}`,
  },
  {
    input: "Front-end Engineer",
    output: `{"level":null}`,
  },
  {
    input: "Software Engineer",
    output: `{"level":null}`,
  },
];

// 3) Formatter for each example
const examplePrompt = PromptTemplate.fromTemplate(
  `Job Title: {input}
Level: {output}`
);

// 4) Factory that creates a simple prompt template
export async function makeExtractLevelFewShotPrompt() {
  const formatInstructions = await extractLevelParser.getFormatInstructions();
  // Escape curly braces to avoid template parsing errors
  const escapedFormatInstructions = formatInstructions
    .replace(/\{/g, "{{")
    .replace(/\}/g, "}}");
  return PromptTemplate.fromTemplate(`You are an expert at identifying seniority from job titles.
Based on the job title, pick the best-fit level from:
["Intern","Entry","Junior","Mid","Senior","Lead","Manager","Director","Executive"].

Level Criteria:
- Intern: Students/recent graduates, no experience required
- Entry: 0-1 years experience, basic skills
- Junior: 1-2 years experience, some independence
- Mid: 3-4 years experience, works independently, handles complex tasks
- Senior: 5-7 years experience, leads technical decisions, mentors others
- Lead: 5-8 years experience, leads small teams, technical leadership
- Manager: manages multiple teams, people management
- Director: 10+ years experience, oversees departments, strategic planning
- Executive: 15+ years experience, C-level positions, company-wide decisions

Return only a JSON object with a level property, e.g. {{"level": "Entry"}}.
Do not include any extra explanation or prose.

Respond with exactly this JSON schema (no extra keys, no prose):
${escapedFormatInstructions}

Now extract the level from this job title: (not the domain)
Job Title: {text}
Level:`);
}
