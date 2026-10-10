# LYRA REASONING ENGINE - R3 DESIGN

R3 = Evidence, Confidence, and Risk Contracts.

R3 does NOT include:
- multi-agent Judge
- Solver/Skeptic/Judge orchestration
- project memory
- benchmark engine
- evolution engine
- hard tool interception

## Overview
R3 introduces strict structural validation of completion contracts. It introduces deterministic categories of evidence (`EvidenceRecord`) and formalizes rules around `confidence` and `risk`.

## Evidence Kinds
Evidence must belong to one of these deterministic categories:
- `OBSERVED`: Direct observable proof in environment.
- `TEST_RESULT`: Artifact from a test suite.
- `FILE_STATE`: Reading/checking file structure.
- `COMMAND_RESULT`: Terminal/shell command output.
- `EXTERNAL_SOURCE`: Third party documentation or API read.
- `WORKER_CLAIM`: A self-reported assertion not independently verified.

`WORKER_CLAIM` is not independently verified evidence.

## Confidence Semantics
- `HIGH`: Strongly supported by evidence and verification.
- `MEDIUM`: Task completed, meaningful uncertainty disclosed.
- `LOW`: Fails normal structural completion. Cannot result in normal successful completion.

## Structural Validation Limitations
R3 validates the *structure* of a contract (e.g., rejecting LOW confidence success, rejecting missing evidence).
It does **NOT** judge semantic truth, prove real-world correctness, or replace independent verification (R4 feature).

## Risk Implications
- `LOW`: Normal protocol
- `MEDIUM`: `STANDARD` minimum depth
- `HIGH`: `DEEP` minimum depth + evidence + verification
- `CRITICAL`: `CRITICAL` depth + evidence + verification + `KANBAN_BLOCK_REQUIRED`

## Backward Compatibility
R3 preserves the `lyra-r1-v1` protocol string. Extra Hermes runtime metadata is permitted in the completion structure. The `evidence` field, if provided, must be a list of `EvidenceRecord`s.
