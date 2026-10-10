import assert from 'node:assert/strict';
import test from 'node:test';
import { 
  InMemoryProjectMemoryStore, 
  buildMemoryPacket, 
  canPromoteToProjectMemory, 
  isSafeMemoryEntry 
} from '../../src/lib/reasoning/memory';

test('Project memory isolation: project A never appears in project B', async () => {
  const store = new InMemoryProjectMemoryStore();
  await store.put({ projectId: 'proj-A', kind: 'FACT', summary: 'A memory' });
  await store.put({ projectId: 'proj-B', kind: 'FACT', summary: 'B memory' });
  
  const resultsA = await store.query({ projectId: 'proj-A' });
  assert.equal(resultsA.length, 1);
  assert.equal(resultsA[0].projectId, 'proj-A');
  
  const resultsB = await store.query({ projectId: 'proj-B' });
  assert.equal(resultsB.length, 1);
  assert.equal(resultsB[0].projectId, 'proj-B');
});

test('Supersession and active retrieval', async () => {
  const store = new InMemoryProjectMemoryStore();
  const entry1 = await store.put({ projectId: 'p1', kind: 'FACT', summary: 'old fact' });
  
  const entry2 = await store.supersede(
    { projectId: 'p1', kind: 'FACT', summary: 'new fact' },
    [entry1.id]
  );
  
  // Default query should only return active
  const active = await store.query({ projectId: 'p1' });
  assert.equal(active.length, 1);
  assert.equal(active[0].id, entry2.id);
  
  // Historical query should return both
  const historical = await store.query({ projectId: 'p1', includeHistorical: true });
  assert.equal(historical.length, 2);
});

test('Retraction excludes from current query', async () => {
  const store = new InMemoryProjectMemoryStore();
  const entry = await store.put({ projectId: 'p1', kind: 'DECISION', summary: 'bad decision' });
  
  await store.retract(entry.id);
  const active = await store.query({ projectId: 'p1' });
  assert.equal(active.length, 0);
});

test('Duplicate detection avoids repeated entries', async () => {
  const store = new InMemoryProjectMemoryStore();
  const e1 = await store.put({ projectId: 'p1', kind: 'FACT', summary: 'same summary' });
  const e2 = await store.put({ projectId: 'p1', kind: 'FACT', summary: 'same summary' });
  
  assert.equal(e1.id, e2.id); // should return same instance
  const all = await store.query({ projectId: 'p1' });
  assert.equal(all.length, 1);
});

test('Tag and kind filtering', async () => {
  const store = new InMemoryProjectMemoryStore();
  await store.put({ projectId: 'p1', kind: 'FACT', summary: 't1', tags: ['ui'] });
  await store.put({ projectId: 'p1', kind: 'CONSTRAINT', summary: 't2', tags: ['db'] });
  
  const uiOnly = await store.query({ projectId: 'p1', tags: ['ui'] });
  assert.equal(uiOnly.length, 1);
  assert.equal(uiOnly[0].kind, 'FACT');
  
  const constraintOnly = await store.query({ projectId: 'p1', kinds: ['CONSTRAINT'] });
  assert.equal(constraintOnly.length, 1);
  assert.equal(constraintOnly[0].tags?.[0], 'db');
});

test('Deterministic memory priority and packet bounds', async () => {
  const store = new InMemoryProjectMemoryStore();
  await store.put({ projectId: 'p1', kind: 'FACT', summary: 'fact' }); // Priority 5
  await store.put({ projectId: 'p1', kind: 'CONSTRAINT', summary: 'constraint' }); // Priority 1
  await store.put({ projectId: 'p1', kind: 'ARTIFACT', summary: 'artifact' }); // Priority 8
  
  const entries = await store.query({ projectId: 'p1' });
  
  // Bounded by 2 entries max
  const packet = buildMemoryPacket(entries, 2, 4000);
  assert.match(packet, /CONSTRAINT/);
  assert.match(packet, /FACT/);
  assert.doesNotMatch(packet, /ARTIFACT/);
  
  // Bounded by character length
  const tightPacket = buildMemoryPacket(entries, 50, 50); // 50 chars is very small
  // Should at least contain the first one if it fits, but let's check it doesn't exceed length wildly 
  // (the function allows 1 entry minimum if > maxChars, unless it was already above max)
  assert.ok(tightPacket.length > 0);
  assert.doesNotMatch(tightPacket, /ARTIFACT/);
});

test('Unknown project -> empty', async () => {
  const store = new InMemoryProjectMemoryStore();
  await store.put({ projectId: 'p1', kind: 'FACT', summary: 'fact' });
  
  const results = await store.query({ projectId: '' });
  assert.equal(results.length, 0);
});

test('Promotion eligibility logic', () => {
  // LOW confidence rejected unless RISK/FAILURE
  assert.equal(canPromoteToProjectMemory('PASS', 'LOW', true, 'FACT'), false);
  assert.equal(canPromoteToProjectMemory('PASS', 'LOW', true, 'RISK'), true);
  
  // Non-PASS rejected
  assert.equal(canPromoteToProjectMemory('FAIL', 'HIGH', true, 'DECISION'), false);
  assert.equal(canPromoteToProjectMemory('BLOCKED', 'HIGH', true, 'DECISION'), false);
  assert.equal(canPromoteToProjectMemory('NEEDS_REVISION', 'HIGH', true, 'DECISION'), false);
  
  // WORKER_CLAIM alone (hasIndependentEvidence = false) rejected for DECISION
  assert.equal(canPromoteToProjectMemory('PASS', 'HIGH', false, 'DECISION'), false);
  // but OK for RISK
  assert.equal(canPromoteToProjectMemory('PASS', 'HIGH', false, 'RISK'), true);
});

test('Security check on forbidden tokens', () => {
  assert.equal(isSafeMemoryEntry('here is my password'), false);
  assert.equal(isSafeMemoryEntry('safe fact'), true);
});
