# LYRA REASONING ENGINE - R2 DESIGN

R2 = Specialized Agent Protocols.

R2 does NOT include:
- multi-agent DAG
- Solver/Skeptic/Judge
- independent judge orchestration
- memory
- benchmark engine
- evolution engine
- hard tool interception

Those belong to later phases.

## Overview
R2 expands reasoning eligibility to specialized profiles by controlling what the worker prioritizes, how it gathers evidence, and how it handles depth and verification.
The R1 directive and completion metadata schemas remain canonical and locked (`lyra-r1-v1`).

## Supported Profiles
Based on the R2 actual runtime profile audit, the following profile mappings exist:
- coder -> coder
- default -> default
- planner -> planner
- qa -> qa
- qa-kanban -> qa
- researcher -> researcher
- security -> security
- security-kanban -> security
- synthesizer -> synthesizer
- verifier -> verifier

## Unknown-Profile Fallback Behavior
Any profile not explicitly listed in the family mapping is considered unsupported.
Unsupported profiles will NOT receive the `[LYRA_REASONING_DIRECTIVE]`. Instead, they receive the original `USER_TASK` body byte-for-byte unchanged to guarantee backward compatibility.

## SOUL Activation Strategy
Candidate SOUL patches are maintained in `docs/reasoning/r2/profile-patches/` and are fully SELF_CONTAINED_SOUL blocks. They append the specialized R2 reasoning rules to be triggered when the `[LYRA_REASONING_DIRECTIVE]` is present.
Production SOUL activation is deferred and strictly excluded from the R2 development phase.

## Known Limitations
- The observer canary issue remains as non-blocking technical debt.
- Approval remains behavioral enforcement, not a hard platform interception tool.
