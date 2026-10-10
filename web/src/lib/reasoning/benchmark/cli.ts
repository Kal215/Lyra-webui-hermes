import { canonicalSuite } from './suite';
import { runBenchmarkSuite } from './runner';

async function main() {
  const isJson = process.argv.includes('--json');
  try {
    const result = await runBenchmarkSuite(canonicalSuite, process.env.GITHUB_SHA || 'local');
    if (isJson) {
      const deterministicResult = {
        ...result,
        caseResults: result.caseResults.map(r => {
          const res = { ...r };
          delete res.durationMs;
          return res;
        })
      };
      console.log(JSON.stringify(deterministicResult, null, 2));
    } else {
      console.log(`\nLyra Reasoning Benchmark v1`);
      console.log(`================================`);
      console.log(`Passed: ${result.passed} / ${result.totalCases}`);
      console.log(`Failed: ${result.failed}`);
      console.log(`Errors: ${result.errors}`);
      console.log(`Critical Failures: ${result.criticalFailures}`);
      console.log(`Pass Rate: ${(result.passRate * 100).toFixed(1)}%\n`);
      
      console.log(`Category Breakdown:`);
      for (const [cat, data] of Object.entries(result.categoryBreakdown)) {
        console.log(`  ${cat}: ${data.passed}/${data.total} passed`);
      }
      
      if (result.criticalFailures > 0) {
        console.log(`\nCRITICAL FAILURES DETECTED!`);
        process.exitCode = 1;
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`Benchmark execution failed:`, err.message);
    } else {
      console.error(`Benchmark execution failed:`, String(err));
    }
    process.exitCode = 1;
  }
}

main();
