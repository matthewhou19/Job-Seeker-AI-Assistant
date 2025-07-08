import { ChainPerformanceMonitor } from "./ChainPerformanceMonitor";

export interface ValidationResult {
  success: boolean;
  expected: any;
  actual: any;
  match: boolean;
  details?: string;
}

export interface Validator {
  validate(
    chainName: string,
    actual: any,
    expected: any,
    isFromTest: boolean
  ): ValidationResult;
}

// Exact match validator (JSON.stringify comparison)
export class ExactMatchValidator implements Validator {
  validate(
    chainName: string,
    actual: any,
    expected: any,
    isFromTest: boolean
  ): ValidationResult {
    const match = JSON.stringify(actual) === JSON.stringify(expected);

    if (isFromTest) {
      const monitor = ChainPerformanceMonitor.getInstance();
      monitor.recordValidation(chainName, actual, expected, match);
    }

    return {
      success: true,
      expected,
      actual,
      match,
      details: match ? "Exact match" : "Values do not match",
    };
  }
}

// Partial match validator for skills (array comparison)
export class SkillsValidator implements Validator {
  validate(
    chainName: string,
    actual: any,
    expected: any,
    isFromTest: boolean
  ): ValidationResult {
    const actualSkills = actual?.skills || [];
    const expectedSkills = expected || [];

    // Check if all expected skills are contained within actual skills
    const match = expectedSkills.every((expectedSkill: string) =>
      actualSkills.some(
        (actualSkill: string) =>
          actualSkill.toLowerCase().includes(expectedSkill.toLowerCase()) ||
          expectedSkill.toLowerCase().includes(actualSkill.toLowerCase())
      )
    );

    if (isFromTest) {
      const monitor = ChainPerformanceMonitor.getInstance();
      monitor.recordValidation(chainName, actualSkills, expectedSkills, match);
    }

    return {
      success: true,
      expected: expectedSkills,
      actual: actualSkills,
      match,
      details: match
        ? "All expected skills found"
        : "Some expected skills missing",
    };
  }
}

// Years validator (numeric comparison)
export class YearsValidator implements Validator {
  validate(
    chainName: string,
    actual: any,
    expected: any,
    isFromTest: boolean
  ): ValidationResult {
    const actualYears = actual?.requestYears;
    const expectedYears = expected;

    const match = actualYears === expectedYears;

    if (isFromTest) {
      const monitor = ChainPerformanceMonitor.getInstance();
      monitor.recordValidation(chainName, actualYears, expectedYears, match);
    }

    return {
      success: true,
      expected: expectedYears,
      actual: actualYears,
      match,
      details: match ? "Years match" : "Years do not match",
    };
  }
}

// Level validator (string comparison)
export class LevelValidator implements Validator {
  validate(
    chainName: string,
    actual: any,
    expected: any,
    isFromTest: boolean
  ): ValidationResult {
    const actualLevel = actual?.text?.level;
    const expectedLevel = expected;

    const match = actualLevel === expectedLevel;

    if (isFromTest) {
      const monitor = ChainPerformanceMonitor.getInstance();
      monitor.recordValidation(chainName, actualLevel, expectedLevel, match);
    }

    return {
      success: true,
      expected: expectedLevel,
      actual: actualLevel,
      match,
      details: match ? "Level matches" : "Level does not match",
    };
  }
}

// Domain validator (string comparison with mapping)
export class DomainValidator implements Validator {
  validate(
    chainName: string,
    actual: any,
    expected: any,
    isFromTest: boolean
  ): ValidationResult {
    const actualDomain = actual?.domain;
    const expectedDomain = expected;

    // Domain mapping for test data compatibility
    const domainMapping: { [key: string]: string } = {
      ML: "AI/ML",
      AI: "AI/ML",
      "Data Science": "Data Science",
      Data: "Data Science",
      "Software Engineering": "Full Stack",
      "Web Development": "Full Stack",
      "Mobile Development": "Mobile",
      "Backend Development": "Backend",
      "Frontend Development": "Frontend",
      "Quality Assurance": "QA",
      Testing: "QA",
      Cybersecurity: "Security",
      "Information Security": "Security",
      "Medical Devices": "Healthcare",
      Biotechnology: "Healthcare",
      "Financial Services": "Finance",
      Banking: "Finance",
      "E-commerce": "E-commerce",
      "Online Retail": "E-commerce",
      "Video Games": "Gaming",
      "Game Development": "Gaming",
      Semiconductor: "Hardware",
      Electronics: "Hardware",
    };

    // Map expected domain if it exists in mapping
    const mappedExpected = domainMapping[expectedDomain] || expectedDomain;
    const match = actualDomain === mappedExpected;

    if (isFromTest) {
      const monitor = ChainPerformanceMonitor.getInstance();
      monitor.recordValidation(chainName, actualDomain, mappedExpected, match);
    }

    return {
      success: true,
      expected: mappedExpected,
      actual: actualDomain,
      match,
      details: match ? "Domain matches" : "Domain does not match",
    };
  }
}

// Validator factory
export class ValidatorFactory {
  static create(chainName: string): Validator {
    switch (chainName) {
      case "extractSkills":
        return new SkillsValidator();
      case "extractYears":
        return new YearsValidator();
      case "extractLevel":
        return new LevelValidator();
      case "extractDomain":
        return new DomainValidator();
      default:
        return new ExactMatchValidator();
    }
  }
}
