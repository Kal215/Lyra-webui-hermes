# Lyra Reasoning R6: Benchmark Engine

## Purpose
R6 introduces a deterministic, versioned benchmark system to measure whether a future reasoning/evolution candidate is actually better, unchanged, or regressed. R6 is a prerequisite quality gate before R7 Evolution Engine can be built.

## Scope & Limitations
- R6 is OFFLINE.
- R6 measures structural reasoning invariants (e.g., classification logic, evidence verification, strict policy enforcement).
- R6 does NOT measure hidden chain-of-thought correctness.
- R6 does NOT guarantee real-world model intelligence.

## Benchmark Definitions
- Version: `lyra-reasoning-benchmark-v1`
- Categories: `CLASSIFICATION`, `DISPATCH`, `SAFETY`, `EVIDENCE`, `COMPLETION_CONTRACT`, `PROFILE_POLICY`, `REVIEW_JUDGE`, `PROJECT_MEMORY`.
- Severities: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. (This denotes case importance to the system, NOT task risk.)

## Comparison & Promotion Decision
The `compareBenchmarkRuns` tool produces a delta between a baseline and candidate result (`IMPROVED`, `UNCHANGED`, `REGRESSED`, `INVALID`).

The promotion gate allows or blocks the candidate:
- `PROMOTE`: Valid baseline/candidate comparison with zero protected regressions or critical failures.
- `HOLD`: Invalid structure, missing cases, version mismatch.
- `REJECT`: Any regression on `HIGH` or `CRITICAL` cases, or any new `CRITICAL` failure.

## Determinism
Benchmark results remove machine-specific paths and duration metrics from JSON serialization to guarantee clean bit-for-bit diffs across repeated offline runs.

## Relationship to R7
R7 will consume R6’s comparison capabilities to determine if an evolution attempt can self-promote safely. R6 provides the tools; it does NOT auto-deploy.
