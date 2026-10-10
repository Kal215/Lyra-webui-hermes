import assert from 'node:assert/strict';
import test from 'node:test';
import { 
  compareBenchmarkRuns, 
  decidePromotion,
  BenchmarkSuiteResult,
  runBenchmarkSuite,
  BenchmarkCase
} from '../../src/lib/reasoning/benchmark';

test('benchmark suite integrity validation - duplicate ID', async () => {
  const cases: BenchmarkCase[] = [
    { id: 'C1', category: 'CLASSIFICATION', severity: 'LOW', title: 'T1', execute: () => true },
    { id: 'C1', category: 'CLASSIFICATION', severity: 'LOW', title: 'T2', execute: () => true }
  ];
  await assert.rejects(
    runBenchmarkSuite(cases),
    /Duplicate benchmark case ID/
  );
});

test('benchmark suite integrity validation - empty suite', async () => {
  await assert.rejects(
    runBenchmarkSuite([]),
    /empty/
  );
});

function buildSyntheticSuite(overrides: Partial<BenchmarkSuiteResult>): BenchmarkSuiteResult {
  return {
    suiteVersion: 'lyra-reasoning-benchmark-v1',
    totalCases: 1,
    passed: 1,
    failed: 0,
    errors: 0,
    skipped: 0,
    criticalFailures: 0,
    passRate: 1.0,
    categoryBreakdown: { CLASSIFICATION: { passed: 1, total: 1 } } as Record<string, { passed: number; total: number }>,
    caseResults: [
      { caseId: 'C1', category: 'CLASSIFICATION', severity: 'HIGH', status: 'PASS', summary: 'ok' }
    ],
    ...overrides
  };
}

test('regression comparison: UNCHANGED', () => {
  const b = buildSyntheticSuite({});
  const c = buildSyntheticSuite({});
  const comp = compareBenchmarkRuns(b, c);
  assert.strictEqual(comp.status, 'UNCHANGED');
  
  const prom = decidePromotion(comp, c);
  assert.strictEqual(prom.status, 'PROMOTE');
});

test('regression comparison: new HIGH failure rejects promotion', () => {
  const b = buildSyntheticSuite({});
  const c = buildSyntheticSuite({
    passed: 0, failed: 1,
    caseResults: [
      { caseId: 'C1', category: 'CLASSIFICATION', severity: 'HIGH', status: 'FAIL', summary: 'bad' }
    ]
  });
  
  const comp = compareBenchmarkRuns(b, c);
  assert.strictEqual(comp.status, 'REGRESSED');
  assert.strictEqual(comp.newHighRegressions.length, 1);
  
  const prom = decidePromotion(comp, c);
  assert.strictEqual(prom.status, 'REJECT');
});

test('regression comparison: new CRITICAL failure rejects promotion', () => {
  const b = buildSyntheticSuite({
    caseResults: [
      { caseId: 'C1', category: 'CLASSIFICATION', severity: 'CRITICAL', status: 'PASS', summary: 'ok' }
    ]
  });
  const c = buildSyntheticSuite({
    criticalFailures: 1,
    caseResults: [
      { caseId: 'C1', category: 'CLASSIFICATION', severity: 'CRITICAL', status: 'FAIL', summary: 'bad' }
    ]
  });
  
  const comp = compareBenchmarkRuns(b, c);
  assert.strictEqual(comp.status, 'REGRESSED');
  
  const prom = decidePromotion(comp, c);
  assert.strictEqual(prom.status, 'REJECT');
});

test('regression comparison: missing candidate case prevents promotion', () => {
  const b = buildSyntheticSuite({});
  const c = buildSyntheticSuite({
    caseResults: []
  });
  
  const comp = compareBenchmarkRuns(b, c);
  assert.strictEqual(comp.status, 'INVALID');
  
  const prom = decidePromotion(comp, c);
  assert.strictEqual(prom.status, 'HOLD');
});

test('regression comparison: suite version mismatch prevents promotion', () => {
  const b = buildSyntheticSuite({});
  const c = buildSyntheticSuite({ suiteVersion: 'v2' });
  
  const comp = compareBenchmarkRuns(b, c);
  assert.strictEqual(comp.status, 'INVALID');
  
  const prom = decidePromotion(comp, c);
  assert.strictEqual(prom.status, 'HOLD');
});

test('regression comparison: improvement recognized', () => {
  const b = buildSyntheticSuite({
    caseResults: [
      { caseId: 'C1', category: 'CLASSIFICATION', severity: 'HIGH', status: 'FAIL', summary: 'bad' }
    ]
  });
  const c = buildSyntheticSuite({});
  
  const comp = compareBenchmarkRuns(b, c);
  assert.strictEqual(comp.status, 'IMPROVED');
  assert.strictEqual(comp.resolvedFailures.includes('C1'), true);
  
  const prom = decidePromotion(comp, c);
  assert.strictEqual(prom.status, 'PROMOTE');
});
