# LYRA REASONING ENGINE - R4 DESIGN

R4 introduces Critic, Judge, and Verifier for independent review of worker output.

## Overview
R4 improves independent review structure by splitting tasks logically among roles:
- **Solver**: Executing worker.
- **Critic**: Searches for contradictions, missing evidence, scope deviations, and safety violations.
- **Verifier**: Evaluates explicit acceptance criteria.
- **Judge**: Adjudicates the results deterministically based on critic findings, verifier results, and solver claims.

R4 offline implementation does **NOT** yet dispatch multi-agent DAGs. It implements the deterministic types and pure helpers.

## Limitations
- **R4 does NOT guarantee truth.** It's a structural review of the assertions and evidence.
- **R4 offline implementation does NOT yet dispatch multi-agent DAGs.**
- **R4 Judge is deterministic structured adjudication.** It does not call an AI model.
- **Real Critic/Verifier quality will still depend on worker/model quality.**
- **Hard tool enforcement still does not exist.**
- **Production activation requires separate acceptance.**
