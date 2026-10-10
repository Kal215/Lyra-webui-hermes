# Lyra Reasoning Engine (R0) - Architecture & Integration Audit

## 1. Current Execution Architecture
**Observation**: The Lyra UI delegates task orchestration directly to the Hermes Kanban subsystem instead of managing an independent execution loop.
**Trace**:
1. `nexus-command-center/src/app/api/work/route.ts` executes `hermes kanban create` via shell to insert a task into the local Kanban DB (`~/.hermes/kanban.db`).
2. The Hermes Gateway (or legacy `hermes-kanban-dispatcher.service`) polls the SQLite DB for `todo`/`ready` tasks.
3. The dispatcher spawns a worker process using the assigned profile:
   `hermes -p <profile> --cli chat -q "work kanban task <task.id>"` (observed in `~/.hermes/hermes-agent/hermes_cli/kanban_db_dispatch.py`).

## 2. Work → Hermes Trace
**Observation**: The objective/task body is NOT passed directly as a CLI argument string.
**Trace**:
1. The user prompt string is literally `"work kanban task <task.id>"`.
2. Inside `agent/prompt_builder.py` and `agent/system_prompt.py`, the presence of `$HERMES_KANBAN_TASK` triggers the injection of `KANBAN_GUIDANCE`.
3. `KANBAN_GUIDANCE` explicitly instructs the LLM to call the `kanban_show()` tool to orient itself.
4. The agent executes `kanban_show()`, which reads the Kanban SQLite DB and retrieves the real task title, body, and parent handoffs.

## 3. Profile Architecture
**Observation**: Profiles exist at `~/.hermes/profiles/<profile_name>/`.
Relevant Profiles: `default`, `coder`, `planner`, `qa`, `qa-kanban`, `researcher`, `security`, `security-kanban`, `synthesizer`, `verifier`.
- **SOUL.md**: Contains the base system instruction ("identity"). Safe to extend.
- **config.yaml**: Contains guardrails (`max_tool_calls`, timeout), model definitions (`default: hermes-agent`, provider endpoints).
- **profile.yaml**: Metadata/descriptions.
- **skills/**: Profile-specific skills.
*Conclusion*: Profiles are highly customizable and reload instantly upon new runs.

## 4. Instruction Assembly
**Observation**: Located in `agent/prompt_builder.py` (`build_system_prompt_parts`).
Ordering is strict:
1. **Stable**: Profile Identity (`SOUL.md`), core guidance, pinned skills.
2. **Context**: Task prompt (`"work kanban task X"`), Workspace `.hermes.md`.
3. **Volatile**: Memory (`MEMORY.md`), User Profile, Tool hints (`KANBAN_GUIDANCE`).
*Conclusion*: Reasoning protocols can be safely injected into `SOUL.md` (Stable tier) or as a dedicated Reasoning Skill without overwriting core functionality.

## 5. Extension Points
- **Hermes profile `SOUL.md`**: Best place for custom worker reasoning protocols (requires no code changes).
- **Hermes Skills (`~/.hermes/profiles/<profile>/skills/`)**: Good for procedural reasoning steps.
- **Kanban Task Body**: Specific tasks can receive one-off reasoning depths inserted by Lyra API during `hermes kanban create`.

## 6. Context Availability
**Available during a run**:
- `task_id`: Exposed via `$HERMES_KANBAN_TASK`.
- `profile`: Implicit via `SOUL.md`.
- `working directory`: `$HERMES_KANBAN_WORKSPACE`.
- `handoffs`: Available via `kanban_show()` (parent task summaries and metadata).

## 7. Reasoning Metadata Options
**SUPPORTED_NATIVE**: 
- `kanban_complete()` accepts a `metadata` dictionary (e.g., `{"confidence": 0.9, "risk": "low"}`).
- Kanban metadata is preserved in SQLite and passed downstream to child tasks.

## 8. Structured Artifact Options
- **Native option**: Write explicit artifacts to the filesystem (e.g., `docs/reasoning/decision_X.md`) and attach them via `kanban_attach(filename, content)`. 
- **Native option 2**: Use `kanban_comment(body="<structured data>")` for intermediate explicit hypotheses. 
- *Recommendation*: Use `kanban_attach` or filesystem for explicit artifacts rather than relying on hidden LLM CoT.

## 9. Specialized Protocol Design
**Actual Recommendation**: Use **Profile Instructions (`SOUL.md`) + Skills**. 
For `Coder`, the `coder/SOUL.md` can mandate "Test-Driven Execution Protocol", while `Planner` mandates "Decomposition Protocol". This provides specialization WITHOUT cloning huge prompts unnecessarily and requires no Python edits.

## 10. Dynamic Depth Design
**Actual Recommendation**: **Inside Lyra before dispatch**. 
Lyra UI should append `<reasoning_budget: DEEP>` into the Kanban task body, or set a specific `goal_max_turns` during `hermes kanban create`. The Hermes Kanban dispatcher natively respects turn budgets.

## 11. Multi-pass Design
**Actual Recommendation**: **Separate Kanban subtasks (Native Kanban DAG)**.
- Dispatch a `Planner` task. 
- Planner uses `kanban_create` to spawn a `Coder` task and a `QA` task, then `kanban_link` to make `QA` depend on `Coder`. 
- This uses existing asynchronous infrastructure, avoids context contamination, and allows parallel verification without changing Hermes core.

## 12. Memory Reuse
**Actual**: 
- **Persistent task history**: Kanban DB (`kanban_show` shows parent metadata and retries).
- **Knowledge storage**: Built-in Memory tool (`~/.hermes/profiles/<name>/memory.json`).
- **Skills**: `.hermes/skills/` for project rules.
*Conclusion*: No vector DB is needed.

## 13. Evaluation Signals
**Actual**:
- Terminal exit codes (`exit_code` from `execute_code`/`terminal`).
- Task outcomes (`kanban_list` or `kanban_show` status).
- QA Metadata (`kanban_complete` metadata).
- `git diff` outputs.

## 14. Resource Analysis
Current Hermes Kanban is SQLite + lightweight shell dispatch. 
- Injecting reasoning via `SOUL.md` and Kanban linking adds **zero** infrastructural overhead.
- Token consumption increases, but no Kafka, Redis, or extra memory daemons are required.

## 15. Failure Modes
- **Reasoning loops**: Prevented natively by Kanban `goal_max_turns` and Hermes `max_tool_calls`.
- **Context explosion**: Mitigated by native `agent/context_compressor.py`.
- **Cross-agent context contamination**: Prevented because subtasks run in isolated `hermes` CLI processes.
- **Verification self-confirmation**: Prevented by using *different profiles* (e.g., `coder` vs `verifier`) in separate Kanban subtasks.

## 16. Recommended Architecture
**RECOMMENDED_ARCHITECTURE**: 
**Lyra Kanban Orchestrator + Profile-Specific Protocols (`SOUL.md`)**
1. Lyra UI categorizes task depth and passes it into the Kanban Task Body.
2. The task is assigned to a specialized profile (`coder`, `qa`).
3. The profile's `SOUL.md` (and Skills) dictates the explicit reasoning protocol (e.g., "Write hypotheses to a kanban_comment before coding").
4. Multi-pass reasoning is strictly handled via creating dependent Kanban tasks (`kanban_create` + `kanban_link`).
*Why*: This uses 100% existing native code, requires 0 core Hermes edits, uses SQLite natively, and supports human intervention via `kanban_block`.

## 17. R1 Proposed Scope
R1 should establish the basic Reasoning Core foundation without memory or judge orchestration.
- **Scope**: Edit `~/.hermes/profiles/coder/SOUL.md` to require outputting a `<TaskUnderstanding>` and `<Plan>` block to `kanban_comment` before taking code actions.
- **Scope**: Instruct the profile to pass `confidence` in `kanban_complete(metadata={"confidence": ...})`.
- **Files changed**: `~/.hermes/profiles/coder/SOUL.md` only. No core code changes.