import {
  AcceptanceCriterion,
  CriticFinding,
  VerificationResult,
  JudgeDecision,
  Verdict
} from './review';
import { EvidenceRecord, ConfidenceLevel } from './evidence';

export function adjudicate(
  criteria: AcceptanceCriterion[],
  findings: CriticFinding[],
  verifications: VerificationResult[],
  evidenceMap: Record<string, EvidenceRecord>,
  solverConfidence: ConfidenceLevel
): JudgeDecision {
  const blockingFindings = findings.filter(f => f.severity === 'BLOCKER');
  const criterionResults: Record<string, string> = {};

  let finalVerdict: Verdict = 'PASS';

  // Any unresolved BLOCKER => cannot PASS (we'll mark as BLOCKED)
  if (blockingFindings.length > 0) {
    finalVerdict = 'BLOCKED';
  }

  // LOW confidence completion must not become PASS
  if (solverConfidence === 'LOW' && finalVerdict === 'PASS') {
    finalVerdict = 'NEEDS_REVISION';
  }

  for (const criterion of criteria) {
    if (!criterion.required) {
      continue; // only strict about required criteria
    }

    const verification = verifications.find(v => v.criterionId === criterion.id);

    // If a required criterion has verified FAIL
    if (verification && verification.status === 'FAIL') {
      criterionResults[criterion.id] = 'FAIL';
      if (finalVerdict === 'PASS') {
        finalVerdict = 'FAIL';
      }
      continue;
    }

    // Determine if we have enough independent evidence
    let hasIndependentEvidence = false;
    if (verification && verification.status === 'PASS' && verification.evidenceRefs.length > 0) {
      for (const ref of verification.evidenceRefs) {
        const ev = evidenceMap[ref];
        if (ev && ev.kind !== 'WORKER_CLAIM') {
          hasIndependentEvidence = true;
          break;
        }
      }
    }

    // Required criterion missing independent evidence (WORKER_CLAIM is not enough)
    if (!hasIndependentEvidence) {
      criterionResults[criterion.id] = 'BLOCKED';
      // WORKER_CLAIM alone must not independently satisfy a required criterion
      if (finalVerdict === 'PASS' || finalVerdict === 'FAIL') {
         finalVerdict = 'BLOCKED';
      }
    } else {
      criterionResults[criterion.id] = 'PASS';
    }
  }

  return {
    verdict: finalVerdict,
    criterionResults,
    blockingFindings,
    confidence: 'HIGH', // Judge decision confidence
    summary: `Adjudicated final verdict: ${finalVerdict}`
  };
}
