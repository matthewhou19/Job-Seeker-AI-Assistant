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

// Optimized skills validator using Set for O(1) lookups with partial matching
export class SkillsValidator implements Validator {
  validate(
    chainName: string,
    actual: any,
    expected: any,
    isFromTest: boolean
  ): ValidationResult {
    const actualSkills = actual?.skills || [];
    const expectedSkills = expected || [];

    // Pre-process actual skills once - O(n)
    const normalizedActualSkills = new Set<string>(
      actualSkills.map((skill: string) => skill.toLowerCase())
    );

    // Create a more flexible matching function
    const findMatchingSkill = (expectedSkill: string): boolean => {
      const normalizedExpected = expectedSkill.toLowerCase();

      // Exact match first
      if (normalizedActualSkills.has(normalizedExpected)) {
        return true;
      }

      // Partial match - check if any actual skill contains the expected skill
      for (const actualSkill of normalizedActualSkills) {
        if (
          actualSkill.includes(normalizedExpected) ||
          normalizedExpected.includes(actualSkill)
        ) {
          return true;
        }
      }

      return false;
    };

    // Check each expected skill - O(m) where m = expected skills
    const match = expectedSkills.every((expectedSkill: string) => {
      return findMatchingSkill(expectedSkill);
    });

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

// Optimized domain validator with static mapping
export class DomainValidator implements Validator {
  // Static mapping for better performance
  private static readonly domainMapping = new Map([
    ["ML", "ML"],
    ["AI", "ML"],
    ["Data Science", "Data Science"],
    ["Data", "Data Science"],
    ["Software Engineering", "Full Stack"],
    ["Web Development", "Full Stack"],
    ["Mobile Development", "Mobile"],
    ["Backend Development", "Backend"],
    ["Frontend Development", "Frontend"],
    ["Quality Assurance", "QA"],
    ["Testing", "QA"],
    ["Cybersecurity", "Security"],
    ["Information Security", "Security"],
    ["Medical Devices", "Healthcare"],
    ["Biotechnology", "Healthcare"],
    ["Financial Services", "Finance"],
    ["Banking", "Finance"],
    ["E-commerce", "E-commerce"],
    ["Online Retail", "E-commerce"],
    ["Video Games", "Gaming"],
    ["Game Development", "Gaming"],
    ["Semiconductor", "Hardware"],
    ["Electronics", "Hardware"],
  ]);

  validate(
    chainName: string,
    actual: any,
    expected: any,
    isFromTest: boolean
  ): ValidationResult {
    const actualDomains = actual?.domains || [];
    const expectedDomain = expected;

    // Use Map.get() for O(1) lookup
    const mappedExpected =
      DomainValidator.domainMapping.get(expectedDomain) || expectedDomain;
    
    // Check if the expected domain is in the actual domains array
    const match = actualDomains.includes(mappedExpected);

    if (isFromTest) {
      const monitor = ChainPerformanceMonitor.getInstance();
      monitor.recordValidation(chainName, actualDomains, mappedExpected, match);
    }

    return {
      success: true,
      expected: mappedExpected,
      actual: actualDomains,
      match,
      details: match ? "Domain found in domains array" : "Domain not found in domains array",
    };
  }
}

// Optimized validator factory with caching
export class ValidatorFactory {
  private static validators = new Map<string, Validator>();

  static create(chainName: string): Validator {
    // Return cached validator if it exists
    if (this.validators.has(chainName)) {
      return this.validators.get(chainName)!;
    }

    // Create new validator and cache it
    let validator: Validator;
    switch (chainName) {
      case "extractSkills":
        validator = new SkillsValidator();
        break;
      case "extractYears":
        validator = new YearsValidator();
        break;
      case "extractLevel":
        validator = new LevelValidator();
        break;
      case "extractDomain":
        validator = new DomainValidator();
        break;
      default:
        validator = new ExactMatchValidator();
    }

    // Cache the validator for future use
    this.validators.set(chainName, validator);
    return validator;
  }

  // Method to clear cache if needed
  static clearCache(): void {
    this.validators.clear();
  }
}
