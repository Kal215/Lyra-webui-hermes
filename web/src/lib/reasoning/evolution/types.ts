import { Verdict as JudgeVerdict } from '../review';
import { BenchmarkPromotionStatus as PromotionDecision } from '../benchmark/types';

export const EVOLUTION_SCHEMA_VERSION = 'lyra-evolution-v1';

export const EVOLUTION_TARGETS = [
  'REASONING_POLICY',
  'PROFILE_PROTOCOL',
  'EVIDENCE_CONTRACT',
  'REVIEW_POLICY',
  'MEMORY_POLICY',
  'BENCHMARK_CASE'
] as const;

export type EvolutionTarget = typeof EVOLUTION_TARGETS[number];

export function isEvolutionTarget(value: unknown): value is EvolutionTarget {
  return typeof value === 'string' && EVOLUTION_TARGETS.includes(value as EvolutionTarget);
}

export type EvolutionStatus =
  | 'DRAFT'
  | 'PROPOSED'
  | 'SANDBOXED'
  | 'VALIDATED'
  | 'BENCHMARKED'
  | 'REVIEWED'
  | 'AWAITING_APPROVAL'
  | 'PROMOTION_ELIGIBLE'
  | 'REJECTED'
  | 'SUPERSEDED';

export type CandidateRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ProposedChange {
  target: EvolutionTarget;
  logicalPath: string;
  beforeReference?: string;
  proposedValue: string;
  rationaleSummary: string;
}

export interface EvolutionCandidate {
  id: string;
  schemaVersion: typeof EVOLUTION_SCHEMA_VERSION;
  title: string;
  objective: string;
  hypothesis: string;
  target: EvolutionTarget;
  proposedChanges: ProposedChange[];
  expectedBenefit: string;
  risks: CandidateRisk;
  requiredBenchmarks: string[];
  status: EvolutionStatus;
}

export interface EvolutionEvaluation {
  candidateId: string;
  validationPassed: boolean;
  benchmarkDecision: PromotionDecision;
  reviewDecision: JudgeVerdict;
  unresolvedRisks: string[];
}

export interface EvolutionPolicy {
  maxCandidatesPerCycle: number;
  maxIterations: number;
  protectedSeverities: ('HIGH' | 'CRITICAL')[];
  requireJudgePass: boolean;
  requireBenchmarkPromote: boolean;
  requireHumanApproval: boolean;
}

export const DEFAULT_EVOLUTION_POLICY: EvolutionPolicy = {
  maxCandidatesPerCycle: 5,
  maxIterations: 3,
  protectedSeverities: ['HIGH', 'CRITICAL'],
  requireJudgePass: true,
  requireBenchmarkPromote: true,
  requireHumanApproval: true
};

export interface HumanApproval {
  approved: boolean;
  source: 'HUMAN';
  approvalId: string;
}

export interface TrustedBenchmarkEvidence {
  trustedBaseline: boolean;
  suiteVersion: string;
  protectedCaseIdsPreserved: boolean;
}

export type EvolutionEventType =
  | 'CANDIDATE_CREATED'
  | 'VALIDATION_PASSED'
  | 'VALIDATION_FAILED'
  | 'BENCHMARK_COMPLETED'
  | 'REVIEW_COMPLETED'
  | 'PROMOTION_ELIGIBLE'
  | 'REJECTED'
  | 'SUPERSEDED'
  | 'APPROVAL_REQUIRED'
  | 'TRANSITION';

export interface EvolutionEvent {
  eventId: string;
  candidateId: string;
  type: EvolutionEventType;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface EvolutionDecisionResult {
  status: EvolutionStatus;
  promotionEligible: boolean;
  reasons: string[];
  blockers: string[];
}
