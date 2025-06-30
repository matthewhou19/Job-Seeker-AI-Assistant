import { makeExtractSkillsChain } from "../chains/extractSkills.chain";

async function demo() {
  const chain = await makeExtractSkillsChain();
  const sampleText =
    "We are seeking a Full-Stack Developer proficient in JavaScript, TypeScript, React, Node.js, and experience with AWS services and CI/CD pipelines.";

  const result = await chain.invoke({ text: sampleText });
  const { skills } = result;

  console.log("Extracted skills:", skills);
}

demo().catch(console.error);
