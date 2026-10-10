import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyReasoning,
  type WorkReasoningInput,
} from '../../src/lib/reasoning';

function classify(
  instruction: string,
  title = 'Test Work',
): ReturnType<typeof classifyReasoning> {
  const input: WorkReasoningInput = {
    title,
    instruction,
    assignee: 'coder',
  };

  return classifyReasoning(input);
}

test('simple low-risk task is QUICK', () => {
  const result = classify(
    'Rename the dashboard label from Status to State.',
  );

  assert.equal(result.depth, 'QUICK');
  assert.equal(result.risk, 'LOW');
  assert.equal(result.reasoningBudget, 1);
  assert.equal(result.requireEvidence, false);
  assert.equal(result.requireVerification, true);
  assert.equal(result.approvalMode, 'NONE');
});

test('ordinary implementation task is STANDARD', () => {
  const result = classify(
    'Add a reusable component for the Work summary and use it on the Work page.',
  );

  assert.equal(result.depth, 'STANDARD');
  assert.equal(result.reasoningBudget, 3);
  assert.equal(result.approvalMode, 'NONE');
});

test('race-condition investigation is DEEP', () => {
  const result = classify(
    'Debug the intermittent login race condition and identify the root cause before implementing the minimal fix.',
  );

  assert.equal(result.depth, 'DEEP');
  assert.equal(result.reasoningBudget, 6);
  assert.equal(result.requireEvidence, true);
});

test('high-risk authentication work elevates reasoning depth', () => {
  const result = classify(
    'Refactor JWT authentication and token refresh handling.',
  );

  assert.equal(result.risk, 'HIGH');
  assert.equal(result.depth, 'DEEP');
  assert.equal(result.approvalMode, 'NONE');
});

test('service restart is CRITICAL even when technically simple', () => {
  const result = classify(
    'Restart the Hermes Gateway service.',
  );

  assert.equal(result.risk, 'CRITICAL');
  assert.equal(result.depth, 'CRITICAL');
  assert.equal(result.reasoningBudget, 8);
  assert.equal(
    result.approvalMode,
    'KANBAN_BLOCK_REQUIRED',
  );
});

test('production database operation is CRITICAL', () => {
  const result = classify(
    'Run the schema migration against the production database.',
  );

  assert.equal(result.risk, 'CRITICAL');
  assert.equal(result.depth, 'CRITICAL');
  assert.equal(
    result.approvalMode,
    'KANBAN_BLOCK_REQUIRED',
  );
});

test('classification is deterministic', () => {
  const input: WorkReasoningInput = {
    title: 'Investigate failure',
    instruction:
      'Debug the API integration and identify the root cause.',
    assignee: 'coder',
  };

  const first = classifyReasoning(input);
  const second = classifyReasoning(input);

  assert.deepEqual(first, second);
});
