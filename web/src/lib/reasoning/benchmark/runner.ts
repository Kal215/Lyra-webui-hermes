import { BenchmarkCase, BenchmarkSuiteResult, BenchmarkCaseResult } from './types';

export const BENCHMARK_VERSION = 'lyra-reasoning-benchmark-v1';

export async function runBenchmarkSuite(
  cases: BenchmarkCase[], 
  referenceLabel?: string
): Promise<BenchmarkSuiteResult> {
  const caseResults: BenchmarkCaseResult[] = [];
  
  // Validation: Check for duplicate IDs
  const seenIds = new Set<string>();
  for (const c of cases) {
    if (seenIds.has(c.id)) {
      throw new Error(`Duplicate benchmark case ID detected: ${c.id}`);
    }
    seenIds.add(c.id);
  }

  if (cases.length === 0) {
    throw new Error('Benchmark suite is empty');
  }

  let passed = 0;
  let failed = 0;
  let errors = 0;
  const skipped = 0;
  let criticalFailures = 0;
  
  const categoryBreakdown: Record<string, { passed: number; total: number }> = {};

  for (const c of cases) {
    if (!categoryBreakdown[c.category]) {
      categoryBreakdown[c.category] = { passed: 0, total: 0 };
    }
    categoryBreakdown[c.category].total++;

    const start = performance.now();
    let status: BenchmarkCaseResult['status'];
    let summary = '';
    
    try {
      const result = await c.execute();
      if (result === true) {
        status = 'PASS';
        passed++;
        categoryBreakdown[c.category].passed++;
        summary = 'Execution returned true';
      } else {
        status = 'FAIL';
        failed++;
        summary = 'Execution returned false';
        if (c.severity === 'CRITICAL') criticalFailures++;
      }
    } catch (err: unknown) {
      status = 'ERROR';
      errors++;
      if (err instanceof Error) {
        summary = `Execution threw an error: ${err.message}`;
      } else {
        summary = `Execution threw an error: ${String(err)}`;
      }
      if (c.severity === 'CRITICAL') criticalFailures++;
    }
    const durationMs = performance.now() - start;
    
    caseResults.push({
      caseId: c.id,
      category: c.category,
      severity: c.severity,
      status,
      durationMs,
      summary
    });
  }

  const totalExecutable = passed + failed + errors;
  const passRate = totalExecutable > 0 ? passed / totalExecutable : 0;

  return {
    suiteVersion: BENCHMARK_VERSION,
    totalCases: cases.length,
    passed,
    failed,
    errors,
    skipped,
    criticalFailures,
    passRate,
    categoryBreakdown: categoryBreakdown as Record<string, { passed: number; total: number }>,
    caseResults,
    referenceLabel
  };
}
