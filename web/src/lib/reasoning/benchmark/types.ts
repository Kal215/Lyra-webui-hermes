export type BenchmarkCategory = 
  | 'CLASSIFICATION'
  | 'DISPATCH'
  | 'SAFETY'
  | 'EVIDENCE'
  | 'COMPLETION_CONTRACT'
  | 'PROFILE_POLICY'
  | 'REVIEW_JUDGE'
  | 'PROJECT_MEMORY';

export type BenchmarkSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type BenchmarkStatus = 'PASS' | 'FAIL' | 'ERROR' | 'SKIPPED';

export interface BenchmarkCase {
  id: string;
  category: BenchmarkCategory;
  severity: BenchmarkSeverity;
  title: string;
  description?: string;
  /** Return true for PASS, false for FAIL, throw for ERROR */
  execute: () => boolean | Promise<boolean>;
}

export interface BenchmarkCaseResult {
  caseId: string;
  category: BenchmarkCategory;
  severity: BenchmarkSeverity;
  status: BenchmarkStatus;
  durationMs?: number;
  summary: string;
}

export interface BenchmarkSuiteResult {
  suiteVersion: string;
  totalCases: number;
  passed: number;
  failed: number;
  errors: number;
  skipped: number;
  criticalFailures: number;
  passRate: number;
  categoryBreakdown: Record<BenchmarkCategory, { passed: number; total: number }>;
  caseResults: BenchmarkCaseResult[];
  referenceLabel?: string;
}

export type BenchmarkComparisonStatus = 'IMPROVED' | 'UNCHANGED' | 'REGRESSED' | 'INVALID';

export interface BenchmarkComparison {
  status: BenchmarkComparisonStatus;
  reasons: string[];
  newHighRegressions: string[];
  newCriticalRegressions: string[];
  resolvedFailures: string[];
}

export type BenchmarkPromotionStatus = 'PROMOTE' | 'HOLD' | 'REJECT';

export interface BenchmarkPromotionDecision {
  allowed: boolean;
  status: BenchmarkPromotionStatus;
  reasons: string[];
  regressions: string[];
  improvements: string[];
}
