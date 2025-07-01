import { makeExtractYearsChain } from "../chains/extractYearsFewShot.chain";

export async function runExtractYearsChain() {
  const chain = await makeExtractYearsChain();

  const jobText =
    "Looking for a UX Designer with at least 4 years in product design.";
  const result = await chain({ text: jobText });
  const { requestYears } = result;
  console.log({ requestYears });
}

runExtractYearsChain();
