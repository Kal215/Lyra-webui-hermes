# Lyra File Observer (Phase 3F-B2)

## 1. File tools observed
`write_file` and `patch`.

## 2. Hook lifecycle
- `pre_tool_call`: Captures minimal pending metadata in memory bounded map (keyed by `tool_call_id`).
- `post_tool_call`: Emits real file event upon success. Drops event on failure.

## 3. Patch semantics
Emits `file.patch` using actual native diff returned from `post_tool_call`. Resulting content is safely read server-side if authorized.

## 4. write_file semantics
Emits `file.changed` upon successful write. No fake patch is generated.

## 5. pending call correlation
Bounded dictionary, key = `tool_call_id`, max 100 entries, 5-minute TTL.

## 6. project-root policy
Paths are resolved via `realpath()` server-side to ensure they lie within the safe workspace limit, blocking arbitrary path exposure.

## 7. sensitive paths
Server drops payloads targeting `.env`, `.ssh`, `.hermes`, `/var/lib/9router`, etc.

## 8. symlink policy
Server rejects symlink escapes outside the project root using `realpath()` resolution.

## 9. size limits
MAX_FILE_SIZE = 50 KB. Larger files emit metadata-only (content truncated).

## 10. binary policy
Binary files (e.g., `.png`, `.exe`, `.so`) are rejected or emit metadata-only to prevent browser crash.

## 11. server-side file read
`file.changed` or `file.patch` payload provides safe content fetched strictly by the server. Browser never provides arbitrary read paths.

## 12. provenance
`source = hermes_observer` ensures real attribution.

## 13. current file UI behavior
Updates File panel only on valid events.

## 14. camera follow
Cursor follow tracks added/removed patch lines natively.

## 15. failure isolation
Observer hooks are wrapped in robust `try...except`, ignoring full queues or socket errors so Hermes never crashes.

## 16. rollback
Backup stored at `~/.hermes/plugins/lyra_observer.pre-file-observer/`.

## 17. limitations
`read_file` noise deferred to future phases.

## 18. scope for Phase 3F-B3
Detailed historical deletion presentation (`Changes` tab UI) will be finalized.
