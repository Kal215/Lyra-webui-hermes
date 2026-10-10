# Lyra Reasoning R5: Project Memory

## Purpose
Give LYRA a safe, structured, project-scoped memory layer so future workers can reuse validated project context instead of repeatedly rediscovering the same facts. 
Explicitly:
- R5 is NOT personal user memory.
- R5 does NOT store hidden reasoning.
- R5 does NOT guarantee semantic truth.
- R5 does NOT resolve arbitrary semantic contradictions.
- R5 is NOT production-activated yet.

## Memory Kinds
- `DECISION`: an accepted architectural/product/implementation choice
- `CONSTRAINT`: a rule/boundary that future work must respect
- `FACT`: validated project state
- `FAILURE`: a known failed approach or defect
- `LESSON`: reusable conclusion derived from validated outcome
- `ACCEPTANCE`: accepted test/result/checkpoint
- `RISK`: known project risk or unresolved hazard
- `ARTIFACT`: reference to a durable relevant project artifact

## Entry Schema
Version: `lyra-project-memory-v1`
Structure: `ProjectMemoryEntry`
Contains `id`, `projectId`, `kind`, `summary`, `tags`, `sourceRefs`, `confidence`, `status`, `createdAt`, `updatedAt`, `supersedes`.

## Lifecycle
- `ACTIVE`: currently valid memory.
- `SUPERSEDED`: replaced by a newer entry.
- `RETRACTED`: known invalid and must not be used as current truth.

## Project Isolation
Memory for Project A must never leak into Project B. All queries enforce `projectId` strictly. Unknown/empty projects return empty memory.

## Query Semantics
Exact structured filtering based on project ID, tags, kinds, and history inclusion. No embeddings, no semantic vector search.

## Bounded Packet
`buildMemoryPacket()` deterministically bounds output by max entry count and max character limits to prevent uncontrolled prompt growth. Prioritizes constraints and decisions.

## Supersession & Retraction
A memory entry can explicitly `supersede` older ones, marking them `SUPERSEDED`. `RETRACTED` explicitly flags false paths.

## Evidence/Confidence Eligibility
- LOW confidence accepted-memory promotion is REJECTED (unless it's a RISK or FAILURE).
- Judge Verdicts other than PASS are REJECTED for promotion.
- `WORKER_CLAIM`-only evidence is REJECTED for promotion to factual memory.

## Security Exclusions
A deterministic `isSafeMemoryEntry` guard rejects memory containing keywords like 'password', 'secret', '.env'.

## Storage Abstraction
Core interactions use `ProjectMemoryStore`. Currently backed by `InMemoryProjectMemoryStore` for offline tests. No file writes or database modifications.
