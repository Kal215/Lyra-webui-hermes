# Lyra R1 Reasoning Engine - Worker Contract

## 1. Protocol Location Strategy
Based on an audit of the Hermes profile architecture, this protocol utilizes a **SELF_CONTAINED_SOUL** extension. Instead of loading an external repository-relative document, a concise, self-contained set of rules is embedded directly into the worker's `SOUL.md` (for Coder) and the global `SOUL.md` (for Default). This guarantees correct protocol execution regardless of the runtime working directory.

## 2. Directive Format
Workers must parse the `[LYRA_REASONING_DIRECTIVE]` block if it appears in the Kanban task body. The format is:
```text
[LYRA_REASONING_DIRECTIVE]
protocol_version: lyra-r1-v1
depth: QUICK | STANDARD | DEEP | CRITICAL
risk: LOW | MEDIUM | HIGH | CRITICAL
reasoning_budget: 1 | 3 | 6 | 8
require_evidence: true | false
require_verification: true | false
approval_mode: NONE | KANBAN_BLOCK_REQUIRED
[/LYRA_REASONING_DIRECTIVE]
```

## 3. Execution Depth
The worker must adjust its execution loop based on the `depth` parameter without altering the original `[USER_TASK]`.
**Coder Profile Depth:**
- QUICK: Understand → Execute minimal change → Verify
- STANDARD: Understand → Inspect relevant context → Plan → Implement → Verify
- DEEP: Understand → Broad repository inspect → Decompose/Hypothesize → Gather evidence → Select minimal approach → Implement → Test → Regression check
- CRITICAL: All DEEP steps + Explicit risk review + Explicit approval gate (if required) BEFORE action + Strong verification

**Default Profile Depth (Lightweight):**
- QUICK: Understand → Act → Verify
- STANDARD: Understand → Inspect → Act → Verify
- DEEP: Understand → Inspect/gather evidence → Act → Stronger verification
- CRITICAL: Investigate read-only → Evidence → Approval gate (when required) → Act → Strong verification

## 4. Evidence Contract (PRE-ACTION)
If `require_evidence: true`, the worker must produce ONE structured `kanban_comment` **AFTER investigation but BEFORE the first relevant mutating action**.
**Format (YAML block inside the comment body):**
```yaml
type: reasoning_evidence
protocol_version: lyra-r1-v1
depth: <DEPTH>
objective: <short factual objective>
evidence: <observed facts only>
decision: <selected action>
risk: <Risk level>
confidence: HIGH | MEDIUM | LOW
verification: PENDING
```
Note: Final verification is primarily communicated via `kanban_complete`. Hidden chain-of-thought is prohibited.

## 5. Completion Metadata Contract
When finishing the task, the worker must use `kanban_complete(metadata={...})` to supply at least these required LYRA fields in the JSON dictionary:
```json
{
  "protocol_version": "lyra-r1-v1",
  "depth": "<DEPTH>",
  "risk": "<RISK>",
  "confidence": "HIGH|MEDIUM|LOW",
  "verification": "<string summary of verification>",
  "reasoning_budget": <Integer>
}
```

## 6. Human Approval Semantics
If `approval_mode: KANBAN_BLOCK_REQUIRED`, the worker may perform read-only investigation first. However, **BEFORE the first DANGEROUS, DESTRUCTIVE, OR EXTERNAL-SYSTEM MUTATING operation** (e.g., production database mutation, service restart, destructive filesystem operation), the worker MUST call `kanban_block(kind="needs_input", reason="...")`. Harmless read-only inspection does not require approval.

## 7. Confidence Semantics & Low Confidence Rule
Workers must classify their completion confidence strictly:
- **HIGH**: Evidence strongly supports execution/result.
- **MEDIUM**: Important uncertainty remains; investigate more when practical.
- **LOW**: Do not claim successful completion. When confidence is LOW, investigate further. If missing evidence cannot be obtained, escalate via `kanban_block`.
