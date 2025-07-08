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
    `You are an expert at categorizing job postings into specific technical domains.

Available domains:
- Backend: Server-side development, APIs, databases, infrastructure
- Frontend: User interface, client-side development, web technologies
- Full Stack: Both frontend and backend development
- Mobile: iOS, Android, mobile app development
- DevOps: Infrastructure, deployment, CI/CD, cloud platforms
- Embedded: Firmware, hardware interfacing, real-time systems
- AI/ML: Machine learning, artificial intelligence, data science
- Data Science: Analytics, data processing, statistical modeling
- QA: Quality assurance, testing, software validation
- Security: Cybersecurity, authentication, data protection
- Healthcare: Medical devices, healthcare software, FDA compliance
- Finance: Financial systems, trading platforms, fintech
- E-commerce: Online retail, payment systems, shopping platforms
- Gaming: Video games, game engines, interactive entertainment
- Hardware: Semiconductor, electronics, physical systems

Choose the most specific domain that best describes the primary focus of this job posting.

Respond with exactly this JSON schema (no extra keys, no prose):
${escapedFormatInstructions}

Job description:
{text}
`
  );
}
