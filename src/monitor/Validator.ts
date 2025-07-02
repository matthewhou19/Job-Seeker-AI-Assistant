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

    // Sort both arrays for comparison
    const sortedActual = [...actualSkills].sort();
    const sortedExpected = [...expectedSkills].sort();

    const match =
      JSON.stringify(sortedActual) === JSON.stringify(sortedExpected);

    if (isFromTest) {
      const monitor = ChainPerformanceMonitor.getInstance();
      monitor.recordValidation(chainName, sortedActual, sortedExpected, match);
    }

    return {
      success: true,
      expected: sortedExpected,
      actual: sortedActual,
      match,
      details: match ? "Skills match" : "Skills do not match",
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

// Domain validator (string comparison)
export class DomainValidator implements Validator {
  validate(
    chainName: string,
    actual: any,
    expected: any,
    isFromTest: boolean
  ): ValidationResult {
    const actualDomain = actual?.domain;
    const expectedDomain = expected;

    const match = actualDomain === expectedDomain;

    if (isFromTest) {
      const monitor = ChainPerformanceMonitor.getInstance();
      monitor.recordValidation(chainName, actualDomain, expectedDomain, match);
    }

    return {
      success: true,
      expected: expectedDomain,
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
