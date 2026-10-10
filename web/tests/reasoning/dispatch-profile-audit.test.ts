import assert from 'node:assert/strict';
import test from 'node:test';
import { prepareWorkForDispatch } from '../../src/lib/reasoning';

const expectedMappings = [
  { assignee: 'coder', family: 'coder' },
  { assignee: 'default', family: 'default' },
  { assignee: 'planner', family: 'planner' },
  { assignee: 'researcher', family: 'researcher' },
  { assignee: 'security', family: 'security' },
  { assignee: 'security-kanban', family: 'security' },
  { assignee: 'qa', family: 'qa' },
  { assignee: 'qa-kanban', family: 'qa' },
  { assignee: 'verifier', family: 'verifier' },
  { assignee: 'synthesizer', family: 'synthesizer' },
];

for (const { assignee, family } of expectedMappings) {
  test(`profile mapping: ${assignee} maps to ${family}`, () => {
    const prepared = prepareWorkForDispatch({
      title: 'Audit Task',
      instruction: 'Do work',
      assignee,
    });
    assert.equal(prepared.protocolFamily, family);
    assert.match(prepared.body, /\[LYRA_REASONING_DIRECTIVE\]/);
    assert.match(prepared.body, /protocol_version: lyra-r1-v1/);
  });
}
