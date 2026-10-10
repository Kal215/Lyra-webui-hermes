import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildReasonedTaskBody,
  classifyReasoning,
  serializeReasoningDirective,
  type WorkReasoningInput,
} from '../../src/lib/reasoning';

test('directive uses the locked R1 protocol format', () => {
  const input: WorkReasoningInput = {
    title: 'Debug auth',
    instruction:
      'Debug the authentication race condition.',
    assignee: 'coder',
  };

  const classification = classifyReasoning(input);
  const directive = serializeReasoningDirective(classification);

  assert.match(
    directive,
    /protocol_version: lyra-r1-v1/,
  );

  assert.match(
    directive,
    /require_verification: true/,
  );

  assert.match(
    directive,
    /approval_mode: NONE/,
  );
});

test('task builder preserves the original user instruction exactly', () => {
  const original =
    '  Keep leading whitespace.\nDo not alter this line.\nKeep trailing whitespace.  ';

  const input: WorkReasoningInput = {
    title: 'Preservation test',
    instruction: original,
    assignee: 'coder',
  };

  const classification = classifyReasoning(input);

  const body = buildReasonedTaskBody(
    input,
    classification,
  );

  const expectedUserTask =
    `[USER_TASK]\n${original}\n[/USER_TASK]`;

  assert.ok(body.includes(expectedUserTask));
});

test('critical directive exposes approval requirement', () => {
  const input: WorkReasoningInput = {
    title: 'Infrastructure change',
    instruction:
      'Restart the 9Router service.',
    assignee: 'default',
  };

  const classification = classifyReasoning(input);
  const body = buildReasonedTaskBody(
    input,
    classification,
  );

  assert.match(
    body,
    /depth: CRITICAL/,
  );

  assert.match(
    body,
    /risk: CRITICAL/,
  );

  assert.match(
    body,
    /approval_mode: KANBAN_BLOCK_REQUIRED/,
  );
});
