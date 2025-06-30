import { makeSmartExtractLevelChain } from "../chains/smartExtractLevel.chain";

async function demo() {
  const chain = await makeSmartExtractLevelChain();
  const text = `
    Title: Platform Engineer
    Description: We need someone to build and maintain our internal CI/CD pipelines...
    Experience: 4+ years preferred.
  `;

  const result = await chain.call({ text });
  console.log(result.text);
  // → { level: "Mid" }  // or whatever comes from explicit/inference
}

demo();
