import os

PROFILES = [
  "global", "coder", "planner", "researcher", 
  "qa", "qa-kanban", "security", "security-kanban", 
  "synthesizer", "verifier"
]

def generate():
    for p in PROFILES:
        with open(f"./docs/reasoning/v1/profile-activation/{p}.patch.md", "w") as f:
            if p in ["global", "coder"]:
                f.write(f"<!-- Preserve existing R1 blocks for {p} -->\n")
                f.write("### LYRA REASONING PROTOCOL (lyra-r1-v1)\n")
                f.write("If the task body contains a `[LYRA_REASONING_DIRECTIVE]`, execute strictly according to `depth` using lightweight semantics:\n")
                f.write("- QUICK: Understand -> Act -> Verify\n")
                f.write("- STANDARD: Understand -> Inspect -> Act -> Verify\n")
                f.write("- DEEP: Understand -> Inspect/gather evidence -> Act -> Stronger verification\n")
                f.write("- CRITICAL: Investigate read-only -> Evidence -> Approval gate (when required) -> Act -> Strong verification\n\n")
                f.write("**EVIDENCE:** If `require_evidence: true`, AFTER investigation but BEFORE the first relevant mutating action, emit ONE `kanban_comment` with a YAML block:\n")
                f.write("`type: reasoning_evidence`, `protocol_version`, `depth`, `objective`, `evidence`, `decision`, `risk`, `confidence`, `verification: PENDING`.\n\n")
                f.write("**COMPLETION:** Use `kanban_complete(metadata={...})` with exactly these fields:\n")
                f.write("`{\"protocol_version\": \"lyra-r1-v1\", \"depth\": \"<DEPTH>\", \"risk\": \"<RISK>\", \"confidence\": \"HIGH|MEDIUM|LOW\", \"verification\": \"<string summary>\", \"reasoning_budget\": <int>}`\n\n")
                f.write("**APPROVAL & CONFIDENCE:**\n")
                f.write("- If `approval_mode: KANBAN_BLOCK_REQUIRED`, call `kanban_block(kind=\"needs_input\")` BEFORE any DANGEROUS/DESTRUCTIVE/EXTERNAL-SYSTEM MUTATING operation. Read-only investigation does not require approval.\n")
                f.write("- LOW confidence MUST NOT result in a successful completion. Investigate further or block/escalate.\n")
            else:
                f.write(f"<!-- Specialized R2 Protocol Block for {p} -->\n")
                f.write("### LYRA REASONING PROTOCOL (lyra-r2-specialized)\n")
                f.write("If the task body contains a `[LYRA_REASONING_DIRECTIVE]`, execute strictly according to `depth` using specialized semantics:\n")
                f.write(f"Apply {p.upper()} domain expertise.\n")
                f.write("- QUICK: Understand -> Act -> Verify\n")
                f.write("- STANDARD: Understand -> Inspect -> Act -> Verify\n")
                f.write("- DEEP: Understand -> Inspect/gather evidence -> Act -> Stronger verification\n")
                f.write("- CRITICAL: Investigate read-only -> Evidence -> Approval gate (when required) -> Act -> Strong verification\n\n")
                f.write("**EVIDENCE:** If `require_evidence: true`, AFTER investigation but BEFORE the first relevant mutating action, emit ONE `kanban_comment` with a YAML block:\n")
                f.write("`type: reasoning_evidence`, `protocol_version`, `depth`, `objective`, `evidence`, `decision`, `risk`, `confidence`, `verification: PENDING`.\n\n")
                f.write("**COMPLETION:** Use `kanban_complete(metadata={...})` with exactly these fields:\n")
                f.write("`{\"protocol_version\": \"lyra-r2-specialized\", \"depth\": \"<DEPTH>\", \"risk\": \"<RISK>\", \"confidence\": \"HIGH|MEDIUM|LOW\", \"verification\": \"<string summary>\", \"reasoning_budget\": <int>}`\n\n")
                f.write("**APPROVAL & CONFIDENCE:**\n")
                f.write("- If `approval_mode: KANBAN_BLOCK_REQUIRED`, call `kanban_block(kind=\"needs_input\")` BEFORE any DANGEROUS/DESTRUCTIVE/EXTERNAL-SYSTEM MUTATING operation. Read-only investigation does not require approval.\n")
                f.write("- LOW confidence MUST NOT result in a successful completion. Investigate further or block/escalate.\n")

if __name__ == "__main__":
    generate()
