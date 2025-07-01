import { config } from "dotenv";
config(); // Load environment variables from .env file

import { Client } from "langsmith";
import { evaluate } from "langsmith/evaluation";
import { StringEvaluator } from "langsmith/evaluation";
import rows from "./smoke.json";
import { makeExtractYearsChain } from "../../src/chains/extractYearsFewShot.chain";
import { makeExtractSkillsChain } from "../../src/chains/extractSkills.chain";
import { makeSmartExtractLevelChain } from "../../src/chains/smartExtractLevel.chain";
import { makeExtractDomainChain } from "../../src/chains/extractDomain.chain";

async function target(inputs: { text: string }) {
  const yearsChain = await makeExtractYearsChain();
  const levelChain = await makeSmartExtractLevelChain();
  const domainChain = await makeExtractDomainChain();
  const skillsChain = await makeExtractSkillsChain();

  const years = await yearsChain(inputs);
  const level = await levelChain.call(inputs);
  const domain = await domainChain(inputs);
  const skills = await skillsChain(inputs);

  return {
    ...years,
    level: level.text.level,
    domain: domain.domain,
    skills: skills.skills,
  };
}

async function runSmokeTest() {
  const client = new Client({
    apiKey: process.env.LANGSMITH_API_KEY,
  });

  // programmatically create your 20-row smoke dataset
  const ds = await client.createDataset("Smoke Test", {
    description: "20-row smoke data set for LLM extraction chains",
  });

  const examples = rows.map((r: any) => ({
    inputs: { text: r.job_description },
    outputs: {
      requestYears: r.years_required,
      level: r.title_level,
      domain: r.job_domain,
      skills: r.technologies_required || [],
    },
    datasetId: ds.id,
  }));

  await client.createExamples(examples);

  console.log("Dataset created successfully with", examples.length, "examples");
  console.log("Dataset ID:", ds.id);

  // Create evaluators for exact-match fields
  const yearsEvaluator = new StringEvaluator({
    inputKey: "text",
    predictionKey: "requestYears",
    gradingFunction: async (params: any) => {
      const isCorrect =
        params.prediction.requestYears === params.reference.years;
      return {
        score: isCorrect ? 1 : 0,
        reasoning: isCorrect ? "Exact match" : "Mismatch",
      };
    },
  });

  const levelEvaluator = new StringEvaluator({
    inputKey: "text",
    predictionKey: "level",
    gradingFunction: async (params: any) => {
      const isCorrect = params.prediction.level === params.reference.level;
      return {
        score: isCorrect ? 1 : 0,
        reasoning: isCorrect ? "Exact match" : "Mismatch",
      };
    },
  });

  const domainEvaluator = new StringEvaluator({
    inputKey: "text",
    predictionKey: "domain",
    gradingFunction: async (params: any) => {
      const isCorrect = params.prediction.domain === params.reference.domain;
      return {
        score: isCorrect ? 1 : 0,
        reasoning: isCorrect ? "Exact match" : "Mismatch",
      };
    },
  });

  const skillsEvaluator = new StringEvaluator({
    inputKey: "text",
    predictionKey: "skills",
    gradingFunction: async (params: any) => {
      const isCorrect =
        JSON.stringify(params.prediction.skills) ===
        JSON.stringify(params.reference.skills);
      return {
        score: isCorrect ? 1 : 0,
        reasoning: isCorrect ? "Exact match" : "Mismatch",
      };
    },
  });

  // Run evaluation using LangSmith
  console.log("Starting evaluation...");
  await evaluate(target, {
    client,
    data: ds.id,
    evaluators: [
      yearsEvaluator,
      levelEvaluator,
      domainEvaluator,
      skillsEvaluator,
    ],
    experimentPrefix: "smoke-test-v1",
    maxConcurrency: 5,
  });

  console.log("Evaluation completed!");
}

// Execute the function
runSmokeTest().catch(console.error);
