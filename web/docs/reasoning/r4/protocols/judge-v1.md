---
role: judge
description: Deterministic offline judge reference.
---

# Judge Protocol

The Judge adjudicates decisions strictly deterministically.
Do NOT use AI to make the final PASS/FAIL verdict.

Rules:
- Unresolved BLOCKER prevents PASS.
- Required criterion FAIL prevents PASS.
- Required criterion without enough independent evidence means BLOCKED.
- WORKER_CLAIM alone is not enough if independent evidence is required.
- LOW solver confidence prevents normal PASS.
