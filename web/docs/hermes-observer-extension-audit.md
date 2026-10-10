# Hermes Observer & Extension Point Audit

## 1. Executive Summary
This architecture audit investigates how Lyra can observe live Hermes terminal and file operations without modifying the Hermes core. The primary discovery is that **Hermes possesses a mature Plugin System** (`hermes_cli/plugins_dispatch.py`) exposing `pre_tool_call` and `post_tool_call` hooks. Because ALL tool calls (including inline file tools like `patch` and `write_file`) are routed through a central dispatcher (`agent/tool_executor.py`), a Lyra Plugin can observe the start, arguments, and full result (including unified diffs) of every tool operation without monkey-patching.

However, for **live streaming** of standard output:
- **Background terminal commands** (PTY/interactive) stream output chunk-by-chunk to `process_registry.on_output`, which a plugin can safely wrap.
- **Foreground terminal commands** (default shell commands used by Coder) do **not** stream natively. They are read synchronously by a drain thread (`tools/environments/base_output.py`) and only yield output when the command finishes.

**Recommendation:** Use a **Hermes Plugin** to observe `pre_tool_call` and `post_tool_call` for all file and terminal operations. For live streaming of foreground terminal commands, a **minimal core patch** to `base_output.py`'s `_start_drain_thread` is required, as no existing callback natively streams them.

## 2. Hermes Plugin Architecture
- **Location:** `~/.hermes/plugins/` (dynamic loading) and `hermes_cli/plugins_dispatch.py`.
- **Capabilities:** Supports tool registration, and lifecycle hooks (`pre_tool_call`, `post_tool_call`, `pre_llm_call`).
- **Context:** Hooks receive full arguments, tool results, and agent context (`effective_task_id`, `tool_call_id`).
- **Failure Isolation:** Hooks run with timeouts (`plugins.hook_callback_timeout`); however, `pre_tool_call` fails closed. We must ensure the observer is fast and non-blocking (e.g., using a bounded queue/thread).

## 3. Tool Dispatch Architecture
- **Central Choke Point:** `agent.tool_executor.py` -> `_emit_terminal_post_tool_call` -> `plugins.invoke_hook('post_tool_call')`.
- Every tool, whether an API-bound function or an internal inline executor (`write_file`, `patch`), passes through this layer.

## 4. ProcessRegistry Architecture
- **Location:** `tools/process_registry.py`
- **Output Sink:** Contains `self.on_output = None`, expecting `Callable[[Session, str], None]`.
- **Extensibility:** The TUI Gateway currently assigns this callback. A plugin can safely wrap the existing assignment (e.g., `original = process_registry.on_output; def wrapper(...)`) without modifying core code.

## 5. Foreground Command Execution
- **Path:** `tools/terminal_tool.py` (`_run_foreground`) -> `LocalEnvironment.execute` -> `base_output.py` (`_start_drain_thread`).
- **Behavior:** The process runs synchronously, its stdout is captured into a `_WaitTrace` buffer, and the final JSON string `{"output": "...", "exit_code": N}` is returned to the tool executor.
- **Streaming Support:** **None.** It is impossible to stream foreground commands without editing `base_output.py` because the drain thread does not emit chunks to any callback.

## 6. Background Command Execution
- **Path:** `tools/terminal_tool.py` (`_run_background`) -> `terminal_tool_background.py` (`spawn_background_process`) -> `ProcessRegistry.spawn_local`.
- **Behavior:** The process spawns independently and streams stdout/stderr via `ProcessRegistry.on_output`.
- **Streaming Support:** **Full**, natively supported via callback wrapping.

## 7. Stdout/Stderr Granularity
- In both `ProcessRegistry.spawn_local` and `LocalEnvironment.execute`, Hermes uses `stderr=subprocess.STDOUT`.
- **Result:** Stderr is merged into stdout. They cannot be reliably distinguished.

## 8. Command Lifecycle Data
| Metric | Availability | Source |
|---|---|---|
| Command String | NATIVE | `pre_tool_call` / `post_tool_call` args |
| CWD | NATIVE | `post_tool_call` (returns changed cwd) |
| Exit Code | NATIVE | `post_tool_call` JSON result |
| Start/End Timestamps | DERIVABLE | Timestamp when hooks fire |
| Streaming Chunks (Background) | NATIVE | `process_registry.on_output` |
| Streaming Chunks (Foreground) | NOT AVAILABLE | Requires core patch to `base_output.py` |

## 9. File Tool Architecture
- **Location:** `tools/file_operations.py` (`ShellFileOperations`)
- All file mutations eventually delegate to shell commands (e.g., via `env.execute`).
- However, because they are dispatched as Hermes tools (`write_file`, `patch`), they pass through `agent/tool_executor.py` natively.

## 10. File Mutation Paths
The central abstraction is `ShellFileOperations`. All tools use it. There are no side-channel mutations.

## 11. Patch Data Availability
- **Patch Result:** `tools/file_operations.py` returns `PatchResult(diff="...", error=None)`.
- The full unified diff is **NATIVE** and available inside `post_tool_call`.
- **Write File Result:** Returns `{"verified": True}`, no diff. Deriving a diff requires comparing against previously read content.

## 12. Run/Task/Agent Context
At tool execution, `post_tool_call` receives:
- `agent` (contains `run_id`, `session_id`, `profile_name`)
- `effective_task_id`
- `tool_call_id`
Context is completely and safely available in the same call stack.

## 13. Existing Event/Callback Facilities
| Facility | Location | Extensible without Core Edit? |
|---|---|---|
| Plugin Hooks | `hermes_cli/plugins_dispatch.py` | YES |
| Process Output | `tools/process_registry.py` | YES (via wrapping) |

## 14. Candidate Observer Strategies
1. **Hermes Plugin (Recommended):** Hooks `pre_tool_call`, `post_tool_call`, and wraps `ProcessRegistry.on_output`. Fulfills everything except foreground stdout streaming.
2. **Minimal Core Patch:** Modifying `_start_drain_thread` to emit output chunks to a callback.
3. **Log Scraping:** High latency, brittle, forbidden unless necessary.

## 15. Upgrade Compatibility
A Hermes Plugin is extremely upgrade-safe because it relies on documented `post_tool_call` APIs. Wrapping `ProcessRegistry.on_output` is slightly fragile but completely backwards-compatible. A core patch for foreground streaming is an upgrade risk.

## 16. Failure Isolation
Plugins execute synchronously. To prevent Lyra from crashing Hermes or blocking it:
- The Plugin must use a bounded queue (`queue.Queue(maxsize=1000)`).
- A background worker thread in the plugin should drain the queue via Fire-and-Forget (HTTP or Unix Socket).
- If Lyra is down, the queue blocks, drops events, and Hermes continues natively.

## 17. Security Implications
- `post_tool_call` intercepts **all** commands. 
- The Lyra bridge must redact tokens (e.g., `Authorization: Bearer ...`) *before* forwarding to the browser.
- The observer should transmit events to a local Unix domain socket or local HTTP port owned by the Lyra server.

## 18. Recommended Architecture
- **Terminal Strategy:** `PLUGIN` (for start/end/exit code) + `MINIMAL_CORE_PATCH` (for foreground stdout chunk streaming).
- **File Strategy:** `PLUGIN` (for observing `patch` diffs and `write_file` results via `post_tool_call`).
- **IPC:** `UNIX_SOCKET` or `LOCAL_HTTP` with a bounded drop-queue to ensure zero backpressure on Hermes.

## 19. Phase 3F-B Implementation Boundary
For Phase 3F-B1, the safest, narrowest first implementation is to **only** implement the `TERMINAL` observer via a Plugin (capturing start/end and background streaming), proving IPC reliability and redaction *before* attempting file events or core patches for foreground streaming.

## 20. Files/Symbols Inspected
- `hermes_cli/plugins_dispatch.py` (Plugin System, Hooks)
- `agent/tool_executor.py` (`emit_terminal_post_tool_call`)
- `tools/process_registry.py` (`on_output`)
- `tools/environments/base_output.py` (`_start_drain_thread`)
- `tools/environments/local.py` (`LocalEnvironment`)
- `tools/file_operations.py` (`PatchResult`)
- `tools/terminal_tool.py` (`_run_foreground`, `_run_background`)
