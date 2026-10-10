# Lyra Live Event Bridge (Phase 3E & 3E.1)

## 1. Event Schema
Normalized internal event types follow the `LyraAgentEvent` interface:
```typescript
type LyraAgentEvent = {
  version: 1
  eventId: string
  runId: string
  agentId: string // Generic: "coder", "qa", etc.
  timestamp: string // ISO8601
  sequence: number
  type: LyraAgentEventType
  source: 'native_hermes' | 'derived' | 'future_instrumented' | 'mock_only'
  payload: any
}
```

## 2. Native vs Derived Events
- **Native (`run.started`, `run.completed`)**: Directly sourced from Hermes SSE.
- **Future Instrumented (`command.started`, `terminal.stdout`, `file.patch`)**: To be derived from Hermes `ProcessRegistry.on_output` and `file_operations` observers.
- **Mock (`mock_only`)**: Events injected by the bridge mock route for UI testing.

## 3. SSE Endpoint
The bridge uses `GET /api/live/runs/[runId]/events` as an SSE stream.
It supports:
- Bounded memory via `MAX_EVENTS_PER_RUN` (5000).
- Sequence ordering via `id` in the stream and `last-event-id` parameter.
- Reconnection via native browser EventSource behavior.
- Heartbeats (`: heartbeat\n\n`) emitted every 15s to keep connection alive, which do not buffer and do not increment Event ID sequences.

## 4. Redaction Pipeline
Implemented in `src/lib/live/redaction.ts`.
Redacts tokens, API keys, basic auth in URLs, and plaintext passwords directly on the server **prior to pushing into the SSE buffer**. Redaction is fully recursive for nested arrays and objects (`redactDeep`). 
**Guarantee:** Secrets never exist inside the memory history buffer, and the code does not log raw events prior to redaction.

## 5. Sensitive File Policy
Files like `.env`, `.pem`, `.key`, `id_rsa`, and sensitive directories (`~/.ssh`, `/var/lib/9router`, `/etc`) trigger `isSensitiveFile`. Instead of sending the content, the server omits the payload and flags it as `hidden: true, reason: 'sensitive_file'`.

## 6. Project-Root Boundary
To prevent traversal, `isWithinProjectRoot` rejects paths containing `../` or `..\` and ensures absolute paths reside within the explicitly defined `projectRoot`.

**Symlink Policy (TODO):** For actual implementations, resolved real paths must be verified to remain inside the resolved project root to avoid symlink escapes.

## 7. Buffering & Memory Retention
Handled by `LiveRunBuffer` (`src/lib/live/buffer.ts`).
- **`MAX_EVENTS_PER_RUN`**: 5000 events. The buffer correctly retains the *newest* events and evicts the *oldest*.
- **`MAX_ACTIVE_RUNS`**: 50 active runs retained in memory.
- **`RUN_TTL`**: 1 hour of inactivity (stale run TTL cleanup on every interaction).
- **Cleanup Behavior**: Lazy eviction triggered on incoming events or new subscriptions.
- **Worst-case bound**: ~250,000 structural events max across the process.

## 8. Reconnect & History Gap Semantics
- If a client requests a `last-event-id` that still exists in the buffer, streaming seamlessly resumes.
- If a client requests a `last-event-id` that has already been evicted (e.g. sequence 10, but buffer currently only holds 100-200), the server emits a safe `bridge.warning` event with `reason: "history_gap"` before resuming at the oldest available sequence (100).

## 9. Subscriber Architecture & Concurrent Clients
- Connection polling has been replaced with a direct `subscribe`/`unsubscribe` pub-sub pattern within the node process.
- Multiple viewers connecting to the same run (e.g. Desktop & Mobile) function independently.
- **Cleanup**: When a connection disconnects, `unsubscribe` is explicitly called and `isClosed` interrupts loops safely.

## 10. Authorization Boundary (TODO)
Currently, the demo/mock environment operates unauthenticated. 
For production, the route `GET /api/live/runs/[runId]/events` **must** enforce viewer authentication prior to subscribing to the event buffer. Do not expose public unauthenticated routes.

## 11. Mock Endpoint Safety
The mock endpoint (`POST /api/live/mock`) strictly only allows predefined IDs (e.g. `mock-*` or `bridge-demo-1`) and completely ignores unverified execution inputs. It can only generate deterministic dummy events.

## 12. Future Hermes Connection Boundaries (Phase 3F)
**Phase 3F-A:** Connect read-only strictly to data Hermes *already* exposes natively (run.started, run.completed, safe status, profile discovery). **No direct modification to Hermes Core.** No terminal or file observers yet.

**Phase 3F-B (Deferred):** Later, evaluate observer integration (terminal.stdout, command.started, file writes) using extension APIs or minimal maintained wrappers. **Direct core monkey-patching remains forbidden.**