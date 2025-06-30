import { makeExtractYearsChain } from "../chains/extractYearsFewShot.chain";

async function main() {
  const chain = await makeExtractYearsChain();

  const jobText =
    "Looking for a UX Designer with at least 4 years in product design.";
  const result = await chain.invoke({ text: jobText });
  const { requestYears } = result;
  console.log({ requestYears });
}

main();
