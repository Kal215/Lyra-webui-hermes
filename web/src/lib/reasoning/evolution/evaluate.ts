import {
  EvolutionCandidate,
  EvolutionEvaluation,
  EvolutionPolicy,
  EvolutionDecisionResult,
  DEFAULT_EVOLUTION_POLICY,
  EVOLUTION_SCHEMA_VERSION,
  isEvolutionTarget,
  HumanApproval,
  TrustedBenchmarkEvidence
} from './types';
import { isValidTransition } from './store';
import { BENCHMARK_VERSION } from '../benchmark/runner';

export function validateEvolutionPolicy(policy: EvolutionPolicy): void {
  if (policy.requireHumanApproval !== true) {
    throw new Error("EvolutionPolicy must strictly requireHumanApproval for v1");
  }
  if (policy.requireJudgePass !== true) {
    throw new Error("EvolutionPolicy must strictly requireJudgePass for v1");
  }
  if (policy.requireBenchmarkPromote !== true) {
    throw new Error("EvolutionPolicy must strictly requireBenchmarkPromote for v1");
  }
  if (!Number.isInteger(policy.maxCandidatesPerCycle) || policy.maxCandidatesPerCycle <= 0 || policy.maxCandidatesPerCycle > 20) {
    throw new Error("EvolutionPolicy maxCandidatesPerCycle must be a finite integer between 1 and 20");
  }
  if (!Number.isInteger(policy.maxIterations) || policy.maxIterations <= 0 || policy.maxIterations > 10) {
    throw new Error("EvolutionPolicy maxIterations must be a finite integer between 1 and 10");
  }
}

export interface EvaluationOptions {
  humanApproval?: HumanApproval;
  trustedBenchmarkEvidence?: TrustedBenchmarkEvidence;
}

export function evaluateEvolutionCandidate(
  candidate: unknown,
  evaluation: EvolutionEvaluation,
  policy: EvolutionPolicy = DEFAULT_EVOLUTION_POLICY,
  options?: EvaluationOptions
): EvolutionDecisionResult {
  validateEvolutionPolicy(policy);

  let nextStatus: EvolutionCandidate['status'] = 'REJECTED';
  const reasons: string[] = [];
  const blockers: string[] = [];
  let promotionEligible = false;

  if (!candidate || typeof candidate !== 'object') {
    return { status: 'REJECTED', promotionEligible: false, reasons: [], blockers: ['Invalid candidate object'] };
  }
  const c = candidate as EvolutionCandidate;
  const currentStatus = c.status || 'DRAFT';

  if (c.schemaVersion !== EVOLUTION_SCHEMA_VERSION) {
    blockers.push(`Invalid schema version: ${c.schemaVersion}`);
  }
  if (evaluation.candidateId !== c.id) {
    blockers.push(`Evaluation candidateId mismatch: ${evaluation.candidateId} !== ${c.id}`);
  }

  if (!isEvolutionTarget(c.target)) {
    blockers.push(`Unknown candidate target: ${c.target}`);
  }
  if (Array.isArray(c.proposedChanges)) {
    for (const change of c.proposedChanges) {
      if (!isEvolutionTarget(change.target)) {
        blockers.push(`Unknown proposed change target: ${change.target}`);
      } else if (change.target !== c.target) {
        blockers.push(`Proposed change target ${change.target} does not match candidate target ${c.target}`);
      }
    }
  } else {
    blockers.push("proposedChanges must be an array");
  }

  if (c.risks === 'CRITICAL') {
    blockers.push('CRITICAL risk candidate cannot be auto-promotion eligible in v1');
  }

  if (!evaluation.validationPassed) {
    blockers.push('Candidate validation failed');
  }

  if (c.target === 'BENCHMARK_CASE') {
    if (!options?.trustedBenchmarkEvidence) {
      blockers.push("BENCHMARK_CASE mutation lacks trusted pre-change evidence");
    } else {
      const ev = options.trustedBenchmarkEvidence;
      if (!ev.trustedBaseline) {
        blockers.push("Benchmark was not evaluated against trusted baseline");
      }
      if (!ev.protectedCaseIdsPreserved) {
        blockers.push("Benchmark case modification failed to preserve protected cases");
      }
      if (ev.suiteVersion !== BENCHMARK_VERSION) {
        blockers.push(`Benchmark suite version mismatch: expected ${BENCHMARK_VERSION}, got ${ev.suiteVersion}`);
      }
    }
  }

  if (policy.requireBenchmarkPromote && evaluation.benchmarkDecision !== 'PROMOTE') {
    blockers.push(`Benchmark decision is not PROMOTE (got ${evaluation.benchmarkDecision})`);
  }

  if (policy.requireJudgePass && evaluation.reviewDecision !== 'PASS') {
    blockers.push(`Judge decision is not PASS (got ${evaluation.reviewDecision})`);
  }

  if (evaluation.unresolvedRisks && evaluation.unresolvedRisks.length > 0) {
    blockers.push(`Unresolved risks: ${evaluation.unresolvedRisks.join(', ')}`);
  }

  if (blockers.length > 0) {
    nextStatus = 'REJECTED';
    reasons.push('Candidate rejected due to blockers');
  } else {
    nextStatus = currentStatus;
    if (currentStatus === 'REVIEWED') {
      nextStatus = 'AWAITING_APPROVAL';
      reasons.push('All automated gates passed, awaiting human approval');
    } else if (currentStatus === 'AWAITING_APPROVAL') {
      if (!options?.humanApproval) {
        nextStatus = 'AWAITING_APPROVAL';
        reasons.push('Awaiting explicit human approval payload');
      } else {
        const ha = options.humanApproval;
        if (ha.source !== 'HUMAN' || !ha.approvalId) {
           nextStatus = 'REJECTED';
           blockers.push('Invalid human approval artifact');
        } else if (ha.approved === true) {
           nextStatus = 'PROMOTION_ELIGIBLE';
           promotionEligible = true;
           reasons.push('Explicit human approval granted, candidate is PROMOTION_ELIGIBLE');
        } else {
           nextStatus = 'REJECTED';
           reasons.push('Human approval explicitly denied');
        }
      }
    }
  }

  if (!isValidTransition(currentStatus, nextStatus) && nextStatus !== currentStatus) {
    return {
      status: 'REJECTED',
      promotionEligible: false,
      reasons: ['Invalid state transition attempted'],
      blockers: [...blockers, `Cannot jump from ${currentStatus} to ${nextStatus}`]
    };
  }

  return {
    status: nextStatus,
    promotionEligible,
    reasons,
    blockers
  };
}
