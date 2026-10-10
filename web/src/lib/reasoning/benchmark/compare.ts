import { 
  BenchmarkSuiteResult, 
  BenchmarkComparison, 
  BenchmarkPromotionDecision,
  BenchmarkCaseResult 
} from './types';

export function compareBenchmarkRuns(baseline: BenchmarkSuiteResult, candidate: BenchmarkSuiteResult): BenchmarkComparison {
  if (baseline.suiteVersion !== candidate.suiteVersion) {
    return {
      status: 'INVALID',
      reasons: [`Suite version mismatch: ${baseline.suiteVersion} vs ${candidate.suiteVersion}`],
      newHighRegressions: [],
      newCriticalRegressions: [],
      resolvedFailures: []
    };
  }

  const baselineMap = new Map<string, BenchmarkCaseResult>();
  baseline.caseResults.forEach(r => baselineMap.set(r.caseId, r));

  const candidateMap = new Map<string, BenchmarkCaseResult>();
  candidate.caseResults.forEach(r => candidateMap.set(r.caseId, r));

  const reasons: string[] = [];
  const newHighRegressions: string[] = [];
  const newCriticalRegressions: string[] = [];
  const resolvedFailures: string[] = [];
  
  let hasRegression = false;
  let hasImprovement = false;
  let invalid = false;

  // Check for missing cases
  for (const [caseId, bCase] of baselineMap.entries()) {
    const cCase = candidateMap.get(caseId);
    if (!cCase) {
      reasons.push(`Candidate is missing case: ${caseId}`);
      invalid = true;
      continue;
    }

    const bPass = bCase.status === 'PASS';
    const cPass = cCase.status === 'PASS';

    if (bPass && !cPass) {
      // Regression
      hasRegression = true;
      const msg = `Regression on ${caseId} (${bCase.severity}): ${bCase.status} -> ${cCase.status}`;
      reasons.push(msg);
      
      if (bCase.severity === 'HIGH') newHighRegressions.push(caseId);
      if (bCase.severity === 'CRITICAL') newCriticalRegressions.push(caseId);
    } else if (!bPass && cPass) {
      // Improvement
      hasImprovement = true;
      resolvedFailures.push(caseId);
      reasons.push(`Improvement on ${caseId}: ${bCase.status} -> ${cCase.status}`);
    } else if (!bPass && !cPass && bCase.status !== cCase.status) {
      // Status changed but still failing
      reasons.push(`Status changed on ${caseId}: ${bCase.status} -> ${cCase.status}`);
    }
  }

  // Check for unexpected new cases (not technically invalid, but worth noting)
  for (const caseId of candidateMap.keys()) {
    if (!baselineMap.has(caseId)) {
      reasons.push(`Candidate introduced new case: ${caseId}`);
    }
  }

  if (invalid) {
    return { status: 'INVALID', reasons, newHighRegressions, newCriticalRegressions, resolvedFailures };
  }
  
  if (hasRegression) {
    return { status: 'REGRESSED', reasons, newHighRegressions, newCriticalRegressions, resolvedFailures };
  }

  if (hasImprovement) {
    return { status: 'IMPROVED', reasons, newHighRegressions, newCriticalRegressions, resolvedFailures };
  }

  return { status: 'UNCHANGED', reasons, newHighRegressions, newCriticalRegressions, resolvedFailures };
}

export function decidePromotion(comparison: BenchmarkComparison, candidate: BenchmarkSuiteResult): BenchmarkPromotionDecision {
  if (comparison.status === 'INVALID') {
    return {
      allowed: false,
      status: 'HOLD',
      reasons: comparison.reasons,
      regressions: [],
      improvements: comparison.resolvedFailures
    };
  }

  const criticalFailures = candidate.criticalFailures;
  const reasons = [...comparison.reasons];
  const regressions = [...comparison.newHighRegressions, ...comparison.newCriticalRegressions];

  if (criticalFailures > 0) {
    reasons.push(`Candidate has ${criticalFailures} CRITICAL failure(s)`);
    return {
      allowed: false,
      status: 'REJECT',
      reasons,
      regressions,
      improvements: comparison.resolvedFailures
    };
  }

  if (comparison.newHighRegressions.length > 0 || comparison.newCriticalRegressions.length > 0) {
    reasons.push('Candidate introduces protected severity regressions');
    return {
      allowed: false,
      status: 'REJECT',
      reasons,
      regressions,
      improvements: comparison.resolvedFailures
    };
  }

  return {
    allowed: true,
    status: 'PROMOTE',
    reasons: ['No protected regressions or critical failures found. Policy satisfied.'],
    regressions: [],
    improvements: comparison.resolvedFailures
  };
}
