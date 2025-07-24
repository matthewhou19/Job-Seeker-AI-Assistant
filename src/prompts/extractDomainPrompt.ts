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
      "Senior Software Engineer needed to design and build high-performance, real-time backend systems for Amazon Advertising. Must have experience with large-scale distributed systems, low-latency performance, and mentoring others. Technologies include Java, Rust, Python, AWS.",
    output: `{{"domains":["Backend"]}}`,
  }, {
    input:
      "Key job responsibilities Collaborate with experienced cross-disciplinary Amazonians to develop, design, and bring to market innovative devices and services. Design and build innovative technologies in a large distributed computing environment and help lead fundamental changes in the industry Create solutions to run predictions on distributed systems with exposure to technologies at incredible scale and speed. Build distributed storage, index, and query systems that are scalable, fault-tolerant, low cost, and easy to manage",
    output: `{{"domains":["Backend"]}}`,
  },
  {
    input:
      "Amazon Advertising’s Prism team builds and manages high-performance, low-latency backend systems for Amazon DSP, handling hundreds of billions of ad requests daily. We design and operate distributed, scalable, and reliable infrastructure for ad bidding and delivery across Amazon and third-party properties. Seeking software engineers experienced in distributed systems, automation, and operational excellence. Responsibilities include designing, building, and maintaining robust backend solutions, collaborating with engineers, and driving innovation in large-scale, mission-critical environments. Experience with system architecture, reliability, and scaling required. Technologies include AWS and non-AWS stacks. Bachelor’s in CS or equivalent preferred.",
    output: `{{"domains":["Backend"]}}`,
  },
  {
    input:
      "Frontend React developer needed to create responsive user interfaces. Experience with TypeScript, CSS, and modern web technologies required.",
    output: `{{"domains":["Frontend"]}}`,
  },
  {
    input:
      "Full stack developer to work on both client and server-side code. Must know React, Node.js, and database design.",
    output: `{{"domains":["Full Stack"]}}`,
  },
  {
    input:
      "AI startup looking for a Software Engineer to build innovative AI features with design and front-end teams. Translate user needs into scalable back-end systems. Integrate advanced AI capabilities into core products.",
    output: `{{"domains":["Full Stack"]}}`,
  },

  {
    input:
      "Software Engineer to help drive user-facing product development and scale AI infrastructure. Build and iterate on innovative AI features with design and front-end teams. Translate user needs into scalable back-end systems.",
    output: `{{"domains":["Full Stack"]}}`,
  },
  {
    input:
      "iOS developer to build mobile apps using Swift and UIKit. Experience with Core Data and iOS frameworks required.",
    output: `{{"domains":["Mobile"]}}`,
  },
  {
    input:
      "DevOps engineer to manage AWS infrastructure, implement CI/CD pipelines, and ensure system reliability.",
    output: `{{"domains":["DevOps"]}}`,
  },
  {
    input:
      "Embedded systems engineer to develop firmware for IoT devices. Experience with C/C++ and real-time systems required.",
    output: `{{"domains":["Embedded"]}}`,
  },
  {
    input:
      "Machine learning engineer to develop and train neural networks using TensorFlow and PyTorch. Experience with deep learning model training and optimization required.",
    output: `{{"domains":["ML"]}}`,
  },
  {
    input:
      "Data scientist to analyze large datasets and build predictive models. Experience with Python, R, and statistical modeling required.",
    output: `{{"domains":["Data Science"]}}`,
  },
  {
    input:
      "Data analyst to perform statistical analysis and create data visualizations. Experience with SQL, Python, and business intelligence tools required.",
    output: `{{"domains":["Data Science"]}}`,
  },
  {
    input:
      "QA engineer to develop automated test suites and ensure software quality. Experience with Selenium and test automation required.",
    output: `{{"domains":["QA"]}}`,
  },
  {
    input:
      "Security engineer to implement authentication systems and protect against cyber threats. Experience with OAuth and encryption required.",
    output: `{{"domains":["Security"]}}`,
  },
  {
    input:
      "Financial systems developer to build trading platforms and payment processing systems. Experience with fintech and compliance required.",
    output: `{{"domains":["Finance"]}}`,
  },
  {
    input:
      "E-commerce developer to build online shopping platforms and payment systems. Experience with Shopify and payment gateways required.",
    output: `{{"domains":["E-commerce"]}}`,
  },
  {
    input:
      "Game developer to create video games using Unity or Unreal Engine. Experience with game physics and 3D graphics required.",
    output: `{{"domains":["Gaming"]}}`,
  },
  {
    input:
      "Hardware engineer to design semiconductor circuits and electronic systems. Experience with PCB design and VHDL required.",
    output: `{{"domains":["Hardware"]}}`,
  },
  {
    input:
      "Software engineer to work on various projects. General programming skills required.",
    output: `{{"domains":["Software Engineering"]}}`,
  },
  
];

// 3) Formatter for each example
const examplePrompt = PromptTemplate.fromTemplate(
  `Job Description: {input}
Domains: {output}`
);

// 4) Factory to create a FewShotPromptTemplate
export async function makeExtractDomainPrompt() {
  const formatInstructions = await extractDomainParser.getFormatInstructions();
  // Escape curly braces to avoid template parsing errors
  const escapedFormatInstructions = formatInstructions
    .replace(/\{/g, "{{")
    .replace(/\}/g, "}}");
  return new FewShotPromptTemplate({
    examplePrompt,
    examples,
    prefix: `You are an expert at categorizing job postings into specific professional domains.



Choose the most relevant domains (1-3) that best describe this job posting.
Jobs can span multiple domains, so select all relevant categories.
For software engineering jobs with AI/ML components, include both the primary engineering domain and ML if significant.


Return only a JSON object with a domains array.
Do not wrap the output in any extra keys or prose.

Respond with exactly this JSON schema (no extra keys, no prose):
${escapedFormatInstructions}

Here are some examples:
`,
    suffix: `Now categorize this job posting into the most appropriate domains:
Job Description: {text}
Domains:`,
    inputVariables: ["text"],
  });
}
