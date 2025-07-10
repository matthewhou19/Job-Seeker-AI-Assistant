import { PromptTemplate, FewShotPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { DomainSchema } from "../schemas/domain.schema";

// 1) Build a StructuredOutputParser from your Zod schema
export const extractDomainParser =
  StructuredOutputParser.fromZodSchema(DomainSchema);

// 2) Comprehensive examples covering all domains
const examples = [
  {
    input:
      "We're looking for a backend developer to build REST APIs and work with PostgreSQL databases. Experience with Node.js and microservices architecture required.",
    output: `{{"domain":"Backend"}}`,
  },
  {
    input:
      "Key job responsibilities Collaborate with experienced cross-disciplinary Amazonians to develop, design, and bring to market innovative devices and services. Design and build innovative technologies in a large distributed computing environment and help lead fundamental changes in the industry Create solutions to run predictions on distributed systems with exposure to technologies at incredible scale and speed. Build distributed storage, index, and query systems that are scalable, fault-tolerant, low cost, and easy to manage",
    output: `{{"domain":"Backend"}}`,
  },
  {
    input:
      "Frontend React developer needed to create responsive user interfaces. Experience with TypeScript, CSS, and modern web technologies required.",
    output: `{{"domain":"Frontend"}}`,
  },
  {
    input:
      "Full stack developer to work on both client and server-side code. Must know React, Node.js, and database design.",
    output: `{{"domain":"Full Stack"}}`,
  },
  {
    input:
      "Full stack engineer to build web applications from database to UI. Experience with React, Python, Django, and PostgreSQL required.",
    output: `{{"domain":"Full Stack"}}`,
  },
  {
    input:
      "Software engineer to develop complete web applications. Must work on frontend, backend, and database layers.",
    output: `{{"domain":"Full Stack"}}`,
  },
  {
    input:
      "AI startup looking for a Software Engineer to build innovative AI features with design and front-end teams. Translate user needs into scalable back-end systems. Integrate advanced AI capabilities into core products.",
    output: `{{"domain":"Full Stack"}}`,
  },
  {
    input:
      "Full stack developer to build AI-powered applications. Work on both frontend and backend while integrating machine learning APIs and AI features.",
    output: `{{"domain":"Full Stack"}}`,
  },
  {
    input:
      "Software Engineer to help drive user-facing product development and scale AI infrastructure. Build and iterate on innovative AI features with design and front-end teams. Translate user needs into scalable back-end systems.",
    output: `{{"domain":"Full Stack"}}`,
  },
  {
    input:
      "iOS developer to build mobile apps using Swift and UIKit. Experience with Core Data and iOS frameworks required.",
    output: `{{"domain":"Mobile"}}`,
  },
  {
    input:
      "DevOps engineer to manage AWS infrastructure, implement CI/CD pipelines, and ensure system reliability.",
    output: `{{"domain":"DevOps"}}`,
  },
  {
    input:
      "Embedded systems engineer to develop firmware for IoT devices. Experience with C/C++ and real-time systems required.",
    output: `{{"domain":"Embedded"}}`,
  },
  {
    input:
      "Machine learning engineer to develop and train neural networks using TensorFlow and PyTorch. Experience with deep learning model training and optimization required.",
    output: `{{"domain":"ML"}}`,
  },
  {
    input:
      "Data scientist to analyze large datasets and build predictive models. Experience with Python, R, and statistical modeling required.",
    output: `{{"domain":"Data Science"}}`,
  },
  {
    input:
      "Data analyst to perform statistical analysis and create data visualizations. Experience with SQL, Python, and business intelligence tools required.",
    output: `{{"domain":"Data Science"}}`,
  },
  {
    input:
      "QA engineer to develop automated test suites and ensure software quality. Experience with Selenium and test automation required.",
    output: `{{"domain":"QA"}}`,
  },
  {
    input:
      "Security engineer to implement authentication systems and protect against cyber threats. Experience with OAuth and encryption required.",
    output: `{{"domain":"Security"}}`,
  },
  {
    input:
      "Financial systems developer to build trading platforms and payment processing systems. Experience with fintech and compliance required.",
    output: `{{"domain":"Finance"}}`,
  },
  {
    input:
      "E-commerce developer to build online shopping platforms and payment systems. Experience with Shopify and payment gateways required.",
    output: `{{"domain":"E-commerce"}}`,
  },
  {
    input:
      "Game developer to create video games using Unity or Unreal Engine. Experience with game physics and 3D graphics required.",
    output: `{{"domain":"Gaming"}}`,
  },
  {
    input:
      "Hardware engineer to design semiconductor circuits and electronic systems. Experience with PCB design and VHDL required.",
    output: `{{"domain":"Hardware"}}`,
  },
  {
    input:
      "Software engineer to work on various projects. General programming skills required.",
    output: `{{"domain":null}}`,
  },
];

// 3) Formatter for each example
const examplePrompt = PromptTemplate.fromTemplate(
  `Job Description: {input}
Domain: {output}`
);

/**
 * Factory to create a FewShotPromptTemplate that asks the model
 * to categorize the job's domain from its description with examples.
 */
export async function makeExtractDomainPrompt() {
  const formatInstructions = await extractDomainParser.getFormatInstructions();
  // Escape curly braces to avoid template parsing errors
  const escapedFormatInstructions = formatInstructions
    .replace(/\{/g, "{{")
    .replace(/\}/g, "}}");
  return new FewShotPromptTemplate({
    examplePrompt,
    examples,
    prefix: `You are an expert at categorizing job postings into specific technical domains.

Available domains:
- Backend: Server-side development, APIs, databases, infrastructure
- Frontend: User interface, client-side development, web technologies
- Full Stack: Both frontend and backend development, complete web applications
- Mobile: iOS, Android, mobile app development
- DevOps: Infrastructure, deployment, CI/CD, cloud platforms
- Embedded: Firmware, hardware interfacing, real-time systems
- ML: Machine learning model training, neural networks, deep learning algorithms
- Data Science: Analytics, data processing, statistical modeling, business intelligence
- QA: Quality assurance, testing, software validation
- Security: Cybersecurity, authentication, data protection
- Finance: Financial systems, trading platforms, fintech
- E-commerce: Online retail, payment systems, shopping platforms
- Gaming: Video games, game engines, interactive entertainment
- Hardware: Semiconductor, electronics, physical systems

Choose the most specific domain that best describes the primary focus of this job posting.
Jobs involving AI integration (using APIs) should be classified as Frontend, Backend, or Full Stack based on their primary technical focus.

Respond with exactly this JSON schema (no extra keys, no prose):
${escapedFormatInstructions}

Here are some examples:
`,
    suffix: `Now categorize this job posting into the most appropriate domain:
Job Description: {text}
Domain:`,
    inputVariables: ["text"],
  });
}
