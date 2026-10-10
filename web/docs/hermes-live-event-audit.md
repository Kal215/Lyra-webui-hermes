# Lyra Phase 3D: Hermes Live Event Bridge Audit
**Status:** Read-only Discovery Complete

## 1. Executive Summary
This audit investigated the internal Hermes architecture to determine how the Lyra UI can truthfully observe real-time agent execution without faking visual data. 
Hermes currently possesses a native Server-Sent Events (SSE) stream (`/v1/runs/{run_id}/events`), which streams model tokens (`message.delta`) and run lifecycle status (`run.running`, `run.completed`).
However, Hermes **does not natively emit granular tool execution events** (like `terminal.stdout` or `file.changed`) into this SSE stream. File edits execute as monolithic patches, and foreground terminal commands block until completion. To achieve truthful visualization, Lyra will require an architectural bridge (Option B or C) that instruments tool invocations to emit structured events.

## 2. Hermes Execution Flow
- **Execution Path:** User input → `gateway/run_turn.py` → `_step_callback_sync` → `agent/conversation_loop.py` → Tool Dispatch → `tools/environments/base.py`
- **Native Hooks:** Hermes has a `gateway/hooks.py` system that emits `agent:start`, `agent:step`, and `agent:end`, but these represent turn-level state rather than live streaming tool granularity.

## 3. Agent Registry Findings
- **Concept Mapping:** What Lyra calls "Agents" (Coder, QA, Security) actually map to Hermes **Profiles** (`~/.hermes/profiles/<name>`).
- **Discovery:** Hermes supports dynamic discovery via `hermes_cli.profiles.profiles_to_serve(multiplex=True)` and config `gateway.multiplex_profiles`. 
- **Dynamic Creation:** Profiles can be hot-reloaded dynamically using the `rescan-profiles` control socket command.

## 4. Run/Task Identifier Findings
- **Run ID:** `run_id` exists natively and forms the basis of the `/v1/runs/` API.
- **Agent ID:** Mapped cleanly as the Hermes `profile` name.
- **Task ID:** Available via Kanban watcher metadata (`board` and `task_id`).

## 5. Shell Execution Findings
- **Foreground Terminal:** `tools/environments/base.py` executes synchronously and buffers output.
- **Background Terminal:** `tools/process_registry.py` runs a background thread.
- **Streaming Output:** `ProcessRegistry.on_output(session, chunk)` exists as a designated sink for live terminal stdout streaming, explicitly designed for desktop gateways. It is present but currently uninjected.

## 6. File Edit/Patch Findings
- **File Edits:** Handled in `tools/file_operations.py` via `write_file` and patch mechanics.
- **Streaming:** File operations execute as atomic full-file or patch writes. The model streams tokens, but the file is not written character-by-character on disk. 

## 7. Live Writing Granularity
- **Max Truthful Granularity:** **LEVEL 2 (File complete / Patch delta)**. 
- **Constraint:** Hermes buffers the model's tool-call string and applies the file modification once. Faking character-by-character editing in Lyra is strongly discouraged as it would misrepresent real disk operations. Token streaming only exists for the model's reasoning (`message.delta`).

## 8. Existing Event System & Logs
- **Event Bus:** Natively, Hermes uses `asyncio.Queue` mapped by `run_id` (`self._run_streams`) for SSE.
- **Network Surface:** `gateway/platforms/api_server_runs.py` exposes `GET /v1/runs/{run_id}/events`.
- **Hooks:** Internal `gateway/hooks.py` engine exists but currently ignores tool internals.

## 9. Security Boundaries
- **Credentials:** Found references to `os.environ` secret scoping per profile, token caching, and `.env` boundary scopes.
- **Redaction:** `_redact_api_error_text` exists in `api_server.py`. Future Lyra Bridge must intercept terminal output and `file.read` payloads at the server to redact `Authorization: Bearer` and `.env` paths before hitting the browser.

## 10. Architecture Options
- **Option A:** Existing structured events. (Available for runs, but inadequate for tools).
- **Option B (Recommended):** Non-invasive Observer/Hook. Injecting `ProcessRegistry.on_output` for terminal output, and wrapping `tools/file_operations.py` dynamically to emit `file.changed` into `_run_streams`.
- **Option C:** Tool Wrapper. 
- **Option D/E:** Log tailing. (Brittle, not recommended).

## 11. Recommended Architecture: OPTION B (Injected Observers)
Hermes already exposes the `/v1/runs/{run_id}/events` SSE endpoint. The safest, most performant approach is to inject observer callbacks (e.g., `on_output`) and wire them to `run.put_event(run_id, ...)` within the Gateway process, utilizing the existing SSE transport.

## 12. Proposed Event Schema
```json
{
  "runId": "run-abc",
  "type": "command.started | terminal.stdout | file.changed | agent.status",
  "timestamp": 1690000000.0,
  "payload": {}
}
```

## 13. Source Evidence Table

| Capability | Source File | Symbol | Evidence | Availability |
|---|---|---|---|---|
| Model Stream | `api_server_runs.py` | `message.delta` | Yields token deltas natively | YES |
| Agent Identity | `hermes_cli/profiles.py` | `get_profile_dir` | Hermes multiplexing uses profiles | YES |
| Run Identity | `api_server_runs.py` | `run_id` | Core identifier for SSE streams | YES |
| Task Identity | `kanban_watchers_notifier.py`| `task_id` | Native Kanban task tracking | YES |
| Status Updates | `api_server_runs.py` | `_set_run_status` | Emits `run.started`, `run.completed` | YES |
| Stdout Stream | `process_registry.py`| `on_output` | Designated sink for driver injection | PARTIAL |
| File Writes | `file_operations.py` | `write_file` | Fully synchronous atomic writes | NO (Requires Hook) |
| Event Server | `api_server_runs.py` | `/v1/runs/{}/events` | Native SSE endpoint | YES |
