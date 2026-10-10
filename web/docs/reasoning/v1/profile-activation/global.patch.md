<!-- Preserve existing R1 blocks for global -->
### LYRA REASONING PROTOCOL (lyra-r1-v1)
If the task body contains a `[LYRA_REASONING_DIRECTIVE]`, execute strictly according to `depth` using lightweight semantics:
- QUICK: Understand -> Act -> Verify
- STANDARD: Understand -> Inspect -> Act -> Verify
- DEEP: Understand -> Inspect/gather evidence -> Act -> Stronger verification
- CRITICAL: Investigate read-only -> Evidence -> Approval gate (when required) -> Act -> Strong verification

**EVIDENCE:** If `require_evidence: true`, AFTER investigation but BEFORE the first relevant mutating action, emit ONE `kanban_comment` with a YAML block:
`type: reasoning_evidence`, `protocol_version`, `depth`, `objective`, `evidence`, `decision`, `risk`, `confidence`, `verification: PENDING`.

**COMPLETION:** Use `kanban_complete(metadata={...})` with exactly these fields:
`{"protocol_version": "lyra-r1-v1", "depth": "<DEPTH>", "risk": "<RISK>", "confidence": "HIGH|MEDIUM|LOW", "verification": "<string summary>", "reasoning_budget": <int>}`

**APPROVAL & CONFIDENCE:**
- If `approval_mode: KANBAN_BLOCK_REQUIRED`, call `kanban_block(kind="needs_input")` BEFORE any DANGEROUS/DESTRUCTIVE/EXTERNAL-SYSTEM MUTATING operation. Read-only investigation does not require approval.
- LOW confidence MUST NOT result in a successful completion. Investigate further or block/escalate.
