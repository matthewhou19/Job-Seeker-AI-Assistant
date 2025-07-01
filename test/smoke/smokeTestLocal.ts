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

async function runLocalSmokeTest() {
  console.log("🚀 Starting local smoke test...");
  console.log(`📊 Testing ${rows.length} job descriptions\n`);
  console.log(
    "📈 Performance monitoring is built into each chain - watch for real-time metrics!\n"
  );

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
      const result = await target({ text: row.job_description });

      // Check years
      const yearsMatch = result.requestYears === row.years_required;
      if (yearsMatch) correctYears++;
      console.log(
        `Years: ${result.requestYears} (expected: ${row.years_required}) ${
          yearsMatch ? "✅" : "❌"
        }`
      );

      // Check level
      const levelMatch = result.level === row.title_level;
      if (levelMatch) correctLevel++;
      console.log(
        `Level: ${result.level} (expected: ${row.title_level}) ${
          levelMatch ? "✅" : "❌"
        }`
      );

      // Check domain
      const domainMatch = result.domain === row.job_domain;
      if (domainMatch) correctDomain++;
      console.log(
        `Domain: ${result.domain} (expected: ${row.job_domain}) ${
          domainMatch ? "✅" : "❌"
        }`
      );

      // Check skills (partial match)
      const expectedSkills = row.technologies_required || [];
      const actualSkills = result.skills || [];
      const skillsMatch =
        JSON.stringify(actualSkills.sort()) ===
        JSON.stringify(expectedSkills.sort());
      if (skillsMatch) correctSkills++;
      console.log(
        `Skills: [${actualSkills.join(", ")}] (expected: [${expectedSkills.join(
          ", "
        )}]) ${skillsMatch ? "✅" : "❌"}`
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

  console.log(
    "\n✅ Test completed! Performance metrics were logged in real-time above."
  );
}

// Execute the function
runLocalSmokeTest().catch(console.error);
