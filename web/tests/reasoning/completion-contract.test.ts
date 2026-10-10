import assert from 'node:assert/strict';
import test from 'node:test';

import { validateCompletionContract, EvidenceRecord } from '../../src/lib/reasoning';

const defaultPolicy = {
  require_verification: false,
  require_evidence: false,
};

test('valid HIGH completion contract', () => {
  const result = validateCompletionContract({
    protocol_version: 'lyra-r1-v1',
    depth: 'STANDARD',
    risk: 'LOW',
    confidence: 'HIGH',
    reasoning_budget: 3,
    verification: 'Tests passed',
    extra_field: 'allowed'
  }, defaultPolicy, true);

  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test('valid MEDIUM completion contract', () => {
  const result = validateCompletionContract({
    protocol_version: 'lyra-r1-v1',
    depth: 'STANDARD',
    risk: 'LOW',
    confidence: 'MEDIUM',
    reasoning_budget: 3,
  }, defaultPolicy, true);

  assert.equal(result.valid, true);
});

test('LOW successful completion rejected', () => {
  const result = validateCompletionContract({
    protocol_version: 'lyra-r1-v1',
    depth: 'STANDARD',
    risk: 'LOW',
    confidence: 'LOW',
    reasoning_budget: 3,
  }, defaultPolicy, true);

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('LOW confidence cannot result in normal success'));
});

test('required verification missing rejected', () => {
  const result = validateCompletionContract({
    protocol_version: 'lyra-r1-v1',
    depth: 'STANDARD',
    risk: 'LOW',
    confidence: 'HIGH',
    reasoning_budget: 3,
  }, { require_verification: true, require_evidence: false }, true);

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('Missing verification when require_verification is true'));
});

test('require_evidence with no evidence rejected', () => {
  const result = validateCompletionContract({
    protocol_version: 'lyra-r1-v1',
    depth: 'STANDARD',
    risk: 'LOW',
    confidence: 'HIGH',
    reasoning_budget: 3,
  }, { require_verification: false, require_evidence: true }, true);

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('Missing evidence records when require_evidence is true'));
});

test('extra Hermes runtime metadata accepted', () => {
  const result = validateCompletionContract({
    protocol_version: 'lyra-r1-v1',
    depth: 'STANDARD',
    risk: 'LOW',
    confidence: 'HIGH',
    reasoning_budget: 3,
    hermes_runtime_internal_state: '12345'
  }, defaultPolicy, true);

  assert.equal(result.valid, true);
});

test('missing required LYRA metadata rejected', () => {
  const result = validateCompletionContract({
    protocol_version: 'lyra-r1-v1',
    depth: 'STANDARD',
    risk: 'LOW',
    // Missing confidence
    reasoning_budget: 3,
  }, defaultPolicy, true);

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('Missing required LYRA field: confidence'));
});

test('invalid depth/risk/confidence rejected', () => {
  const result = validateCompletionContract({
    protocol_version: 'lyra-r1-v1',
    depth: 'INVALID_DEPTH',
    risk: 'EXTREME',
    confidence: 'KINDA_SURE',
    reasoning_budget: 3,
  }, defaultPolicy, true);

  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('Invalid depth')));
  assert.ok(result.errors.some(e => e.includes('Invalid risk')));
  assert.ok(result.errors.some(e => e.includes('Invalid confidence')));
});

test('evidence kind validation works', () => {
  const result = validateCompletionContract({
    protocol_version: 'lyra-r1-v1',
    depth: 'STANDARD',
    risk: 'LOW',
    confidence: 'HIGH',
    reasoning_budget: 3,
    evidence: [{ kind: 'WORKER_CLAIM', summary: 'I fixed it' }] as EvidenceRecord[]
  }, { require_verification: false, require_evidence: true }, true);

  assert.equal(result.valid, true);

  const invalidResult = validateCompletionContract({
    protocol_version: 'lyra-r1-v1',
    depth: 'STANDARD',
    risk: 'LOW',
    confidence: 'HIGH',
    reasoning_budget: 3,
    evidence: [{ kind: 'FAKE_EVIDENCE', summary: 'x' } as unknown as EvidenceRecord]
  }, { require_verification: false, require_evidence: true }, true);

  assert.equal(invalidResult.valid, false);
  assert.ok(invalidResult.errors.some(e => e.includes('Invalid evidence kind: FAKE_EVIDENCE')));
});
