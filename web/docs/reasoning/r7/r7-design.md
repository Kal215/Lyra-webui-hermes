# R7 Evolution Engine

## Purpose
The R7 Evolution Engine is the final reasoning-architecture phase. It provides a **control plane** to evaluate proposed reasoning-system improvements through a safe, explicit lifecycle WITHOUT autonomously modifying or deploying production. 
R7 v1 is NOT an unrestricted self-modifying agent. It cannot push, merge, deploy, or execute sandbox commands. It determines if a candidate reasoning change is `PROMOTION_ELIGIBLE`.

## Allowed Targets
- `REASONING_POLICY`
- `PROFILE_PROTOCOL`
- `EVIDENCE_CONTRACT`
- `REVIEW_POLICY`
- `MEMORY_POLICY`
- `BENCHMARK_CASE`

## Forbidden Targets
- Credentials, tokens, keys
- System services (gateway, router, PM2)
- Network ports (3000, 3002, 20128)
- Live project memory
- Main production branches
- Hermes core

## Lifecycle
`DRAFT` -> `PROPOSED` -> `SANDBOXED` -> `VALIDATED` -> `BENCHMARKED` -> `REVIEWED` -> `AWAITING_APPROVAL` -> `PROMOTION_ELIGIBLE` -> `SUPERSEDED`.
Transitions must be deterministic and sequential.
Failed transitions go to `REJECTED`.

## Gates
- **Benchmark Gate**: Must result in `PROMOTE` against R6 standards.
- **Review/Judge Gate**: Must result in `PASS`.
- **Risk Gate**: Cannot be `CRITICAL` risk and auto-eligible.
- **Human Approval**: Still strictly required. `PROMOTION_ELIGIBLE` != `DEPLOYED`.

## Anti-Gaming
Candidates proposing `BENCHMARK_CASE` changes must still be evaluated against the trusted baseline suite. Changing a failing case to force a pass is prevented.

## Boundaries
- Reads and evaluates purely via offline memory structures.
- Automatic File/Git/Production Mutation: **NO**
- Bounded Evolution Loop limits iteration counts.
