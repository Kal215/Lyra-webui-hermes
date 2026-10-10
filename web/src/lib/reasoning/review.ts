import { ConfidenceLevel } from './evidence';

export type Verdict = 'PASS' | 'FAIL' | 'BLOCKED' | 'NEEDS_REVISION';
export type FindingSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'BLOCKER';

export interface AcceptanceCriterion {
  id: string;
  description: string;
  required: boolean;
}

export interface CriticFinding {
  criterionId?: string;
  severity: FindingSeverity;
  summary: string;
  evidenceRefs: string[];
  status: string;
}

export interface VerificationResult {
  criterionId: string;
  status: 'PASS' | 'FAIL' | 'INCONCLUSIVE';
  evidenceRefs: string[];
  summary: string;
}

export interface JudgeDecision {
  verdict: Verdict;
  criterionResults: Record<string, string>;
  blockingFindings: CriticFinding[];
  confidence: ConfidenceLevel;
  summary: string;
}

export interface ReviewPolicy {
  requireCritic: boolean;
  requireVerifier: boolean;
  requireJudge: boolean;
}

export function reviewPolicyForDirective(depth: string, requireVerification: boolean): ReviewPolicy {
  switch (depth) {
    case 'QUICK':
      return { requireCritic: false, requireVerifier: false, requireJudge: false };
    case 'STANDARD':
      return { requireCritic: false, requireVerifier: requireVerification, requireJudge: false };
    case 'DEEP':
      return { requireCritic: true, requireVerifier: true, requireJudge: false };
    case 'CRITICAL':
      return { requireCritic: true, requireVerifier: true, requireJudge: true };
    default:
      return { requireCritic: false, requireVerifier: false, requireJudge: false };
  }
}
