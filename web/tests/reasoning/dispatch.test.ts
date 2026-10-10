import assert from 'node:assert/strict';
import test from 'node:test';

import {
  prepareWorkForDispatch,
  supportsReasoningAssignee,
} from '../../src/lib/reasoning';

test('coder receives R1 reasoning directive', () => {
  const prepared = prepareWorkForDispatch({
    title: 'Coder test',
    instruction: 'Add a reusable component.',
    assignee: 'coder',
  });

  assert.ok(prepared.reasoning);
  assert.equal(prepared.protocolFamily, 'coder');
  assert.match(prepared.body, /\[LYRA_REASONING_DIRECTIVE\]/);
  assert.match(prepared.body, /protocol_version: lyra-r1-v1/);
});

test('default receives R1 reasoning directive', () => {
  const prepared = prepareWorkForDispatch({
    title: 'Default test',
    instruction: 'Inspect the current project status.',
    assignee: 'default',
  });

  assert.ok(prepared.reasoning);
  assert.equal(prepared.protocolFamily, 'default');
  assert.match(prepared.body, /\[LYRA_REASONING_DIRECTIVE\]/);
});

test('newly supported specialized profile receives canonical R1 directive', () => {
  const prepared = prepareWorkForDispatch({
    title: 'Research',
    instruction: 'Research the current architecture without modifying it.',
    assignee: 'researcher',
  });

  assert.ok(prepared.reasoning);
  assert.equal(prepared.protocolFamily, 'researcher');
  assert.match(prepared.body, /\[LYRA_REASONING_DIRECTIVE\]/);
  assert.match(prepared.body, /protocol_version: lyra-r1-v1/);
});

test('unsupported profile remains unsupported and receives original body unchanged', () => {
  const original = 'Do custom work in a non-standard profile.';
  const prepared = prepareWorkForDispatch({
    title: 'Custom',
    instruction: original,
    assignee: 'unknown-custom-worker',
  });

  assert.equal(prepared.reasoning, null);
  assert.equal(prepared.protocolFamily, null);
  assert.equal(prepared.body, original);
});

test('aliases qa-kanban/security-kanban map correctly if present', () => {
  const qaKanban = prepareWorkForDispatch({
    title: 'QA Task',
    instruction: 'Test it.',
    assignee: 'qa-kanban',
  });
  assert.equal(qaKanban.protocolFamily, 'qa');

  const secKanban = prepareWorkForDispatch({
    title: 'Sec Task',
    instruction: 'Secure it.',
    assignee: 'security-kanban',
  });
  assert.equal(secKanban.protocolFamily, 'security');
});

test('reasoning eligibility is deterministic and normalized', () => {
  assert.equal(supportsReasoningAssignee(' coder '), true);
  assert.equal(supportsReasoningAssignee('DEFAULT'), true);
  assert.equal(supportsReasoningAssignee('planner'), true);
  assert.equal(supportsReasoningAssignee('custom-unsupported-profile'), false);
});
