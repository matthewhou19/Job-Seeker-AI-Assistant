import { config } from "dotenv";
config(); // Load environment variables from .env file

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

  return {
    yearsChain,
    levelChain,
    domainChain,
    skillsChain,
  };
}

async function runLocalSmokeTest() {
  console.log("🚀 Starting local smoke test...");
  console.log(`📊 Testing ${rows.length} job descriptions\n`);

  let totalTests = 0;
  let correctYears = 0;
  let correctLevel = 0;
  let correctDomain = 0;
  let correctSkills = 0;

  const startTime = Date.now();

  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i];
    console.log(`\n--- Test ${i + 1}: ${row.job_title} ---`);

    try {
      const { yearsChain, levelChain, domainChain, skillsChain } = await target(
        { text: row.job_description }
      );
      const inputText = { text: row.job_description };

      // Years
      const yearsResponse = await yearsChain(inputText, row.years_required);
      const yearsValidation = yearsResponse.validation;
      if (yearsValidation?.match) correctYears++;
      console.log(
        `Years: ${yearsValidation?.actual} (expected: ${
          yearsValidation?.expected
        }) ${yearsValidation?.match ? "✅" : "❌"}`
      );

      // Level
      const levelResponse = await levelChain.call(inputText, row.title_level);
      const levelValidation = levelResponse.validation;
      if (levelValidation?.match) correctLevel++;
      console.log(
        `Level: ${levelValidation?.actual} (expected: ${
          levelValidation?.expected
        }) ${levelValidation?.match ? "✅" : "❌"}`
      );

      // Domain
      const domainResponse = await domainChain(inputText, row.job_domain);
      const domainValidation = domainResponse.validation;
      if (domainValidation?.match) correctDomain++;
      console.log(
        `Domain: ${domainValidation?.actual} (expected: ${
          domainValidation?.expected
        }) ${domainValidation?.match ? "✅" : "❌"}`
      );

      // Skills
      const expectedSkills = row.technologies_required || [];
      const skillsResponse = await skillsChain(inputText, expectedSkills);
      const skillsValidation = skillsResponse.validation;
      if (skillsValidation?.match) correctSkills++;
      console.log(
        `Skills: [${skillsValidation?.actual.join(
          ", "
        )}] (expected: [${skillsValidation?.expected.join(", ")}]) ${
          skillsValidation?.match ? "✅" : "❌"
        }`
      );

      totalTests++;
    } catch (error) {
      console.error(`❌ Error processing test ${i + 1}:`, error);
    }
  }

  const totalDuration = Date.now() - startTime;

  console.log(`\n📈 Results Summary:`);
  console.log(
    `Years Accuracy: ${correctYears}/${totalTests} (${(
      (correctYears / totalTests) *
      100
    ).toFixed(1)}%)`
  );
  console.log(
    `Level Accuracy: ${correctLevel}/${totalTests} (${(
      (correctLevel / totalTests) *
      100
    ).toFixed(1)}%)`
  );
  console.log(
    `Domain Accuracy: ${correctDomain}/${totalTests} (${(
      (correctDomain / totalTests) *
      100
    ).toFixed(1)}%)`
  );
  console.log(
    `Skills Accuracy: ${correctSkills}/${totalTests} (${(
      (correctSkills / totalTests) *
      100
    ).toFixed(1)}%)`
  );

  const overallAccuracy = (
    ((correctYears + correctLevel + correctDomain + correctSkills) /
      (totalTests * 4)) *
    100
  ).toFixed(1);
  console.log(`\n🎯 Overall Accuracy: ${overallAccuracy}%`);
  console.log(`⏱️  Total Test Duration: ${totalDuration}ms`);
}

// Execute the function
runLocalSmokeTest().catch(console.error);
