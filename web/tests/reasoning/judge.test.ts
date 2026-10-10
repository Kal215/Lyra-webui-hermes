import assert from 'node:assert/strict';
import test from 'node:test';

import { adjudicate } from '../../src/lib/reasoning/judge';
import { AcceptanceCriterion, CriticFinding, VerificationResult, reviewPolicyForDirective } from '../../src/lib/reasoning/review';
import { EvidenceRecord } from '../../src/lib/reasoning/evidence';

test('Judge: all required criteria PASS -> PASS', () => {
  const criteria: AcceptanceCriterion[] = [{ id: 'c1', description: 'desc', required: true }];
  const findings: CriticFinding[] = [];
  const verifications: VerificationResult[] = [{ criterionId: 'c1', status: 'PASS', evidenceRefs: ['e1'], summary: 'ok' }];
  const evidenceMap: Record<string, EvidenceRecord> = {
    'e1': { kind: 'COMMAND_RESULT', summary: 'ran' }
  };

  const decision = adjudicate(criteria, findings, verifications, evidenceMap, 'HIGH');
  assert.equal(decision.verdict, 'PASS');
});

test('Judge: required criterion FAIL -> not PASS', () => {
  const criteria: AcceptanceCriterion[] = [{ id: 'c1', description: 'desc', required: true }];
  const findings: CriticFinding[] = [];
  const verifications: VerificationResult[] = [{ criterionId: 'c1', status: 'FAIL', evidenceRefs: ['e1'], summary: 'fail' }];
  const evidenceMap: Record<string, EvidenceRecord> = {
    'e1': { kind: 'COMMAND_RESULT', summary: 'ran' }
  };

  const decision = adjudicate(criteria, findings, verifications, evidenceMap, 'HIGH');
  assert.equal(decision.verdict, 'FAIL');
});

test('Judge: unresolved BLOCKER -> BLOCKED / not PASS', () => {
  const criteria: AcceptanceCriterion[] = [{ id: 'c1', description: 'desc', required: true }];
  const findings: CriticFinding[] = [{ severity: 'BLOCKER', summary: 'blocked', evidenceRefs: [], status: 'OPEN' }];
  const verifications: VerificationResult[] = [{ criterionId: 'c1', status: 'PASS', evidenceRefs: ['e1'], summary: 'ok' }];
  const evidenceMap: Record<string, EvidenceRecord> = {
    'e1': { kind: 'COMMAND_RESULT', summary: 'ran' }
  };

  const decision = adjudicate(criteria, findings, verifications, evidenceMap, 'HIGH');
  assert.equal(decision.verdict, 'BLOCKED');
});

test('Judge: WORKER_CLAIM-only required evidence -> not independently accepted', () => {
  const criteria: AcceptanceCriterion[] = [{ id: 'c1', description: 'desc', required: true }];
  const findings: CriticFinding[] = [];
  const verifications: VerificationResult[] = [{ criterionId: 'c1', status: 'PASS', evidenceRefs: ['e1'], summary: 'ok' }];
  const evidenceMap: Record<string, EvidenceRecord> = {
    'e1': { kind: 'WORKER_CLAIM', summary: 'i did it' } // only worker claim
  };

  const decision = adjudicate(criteria, findings, verifications, evidenceMap, 'HIGH');
  assert.equal(decision.verdict, 'BLOCKED');
});

test('Judge: LOW-confidence completion -> not PASS', () => {
  const criteria: AcceptanceCriterion[] = [{ id: 'c1', description: 'desc', required: true }];
  const findings: CriticFinding[] = [];
  const verifications: VerificationResult[] = [{ criterionId: 'c1', status: 'PASS', evidenceRefs: ['e1'], summary: 'ok' }];
  const evidenceMap: Record<string, EvidenceRecord> = {
    'e1': { kind: 'COMMAND_RESULT', summary: 'ran' }
  };

  const decision = adjudicate(criteria, findings, verifications, evidenceMap, 'LOW');
  assert.equal(decision.verdict, 'NEEDS_REVISION');
});

test('Judge: missing required evidence -> BLOCKED', () => {
  const criteria: AcceptanceCriterion[] = [{ id: 'c1', description: 'desc', required: true }];
  const findings: CriticFinding[] = [];
  const verifications: VerificationResult[] = [{ criterionId: 'c1', status: 'PASS', evidenceRefs: ['e1'], summary: 'ok' }];
  const evidenceMap: Record<string, EvidenceRecord> = {
    // e1 is missing
  };

  const decision = adjudicate(criteria, findings, verifications, evidenceMap, 'HIGH');
  assert.equal(decision.verdict, 'BLOCKED');
});

test('Judge: warnings alone do not automatically fail', () => {
  const criteria: AcceptanceCriterion[] = [{ id: 'c1', description: 'desc', required: true }];
  const findings: CriticFinding[] = [{ severity: 'WARNING', summary: 'warn', evidenceRefs: [], status: 'OPEN' }];
  const verifications: VerificationResult[] = [{ criterionId: 'c1', status: 'PASS', evidenceRefs: ['e1'], summary: 'ok' }];
  const evidenceMap: Record<string, EvidenceRecord> = {
    'e1': { kind: 'COMMAND_RESULT', summary: 'ran' }
  };

  const decision = adjudicate(criteria, findings, verifications, evidenceMap, 'HIGH');
  assert.equal(decision.verdict, 'PASS');
});

test('Review Policy: QUICK behavior', () => {
  const policy = reviewPolicyForDirective('QUICK', false);
  assert.equal(policy.requireCritic, false);
  assert.equal(policy.requireVerifier, false);
  assert.equal(policy.requireJudge, false);
});

test('Review Policy: STANDARD behavior', () => {
  const policy = reviewPolicyForDirective('STANDARD', true);
  assert.equal(policy.requireCritic, false);
  assert.equal(policy.requireVerifier, true);
  assert.equal(policy.requireJudge, false);
});

test('Review Policy: DEEP behavior', () => {
  const policy = reviewPolicyForDirective('DEEP', false);
  assert.equal(policy.requireCritic, true);
  assert.equal(policy.requireVerifier, true);
  assert.equal(policy.requireJudge, false);
});

test('Review Policy: CRITICAL behavior', () => {
  const policy = reviewPolicyForDirective('CRITICAL', true);
  assert.equal(policy.requireCritic, true);
  assert.equal(policy.requireVerifier, true);
  assert.equal(policy.requireJudge, true);
});
