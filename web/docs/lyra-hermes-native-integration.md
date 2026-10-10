# Lyra Phase 3F-A: Native Hermes Read-Only Integration

This document specifies the Read-Only Integration boundary established between the Lyra UI (Nexus Command Center) and the local Hermes agent architecture during Phase 3F-A.

## 1. Native Hermes Source
We established a strict isolation boundary. Lyra Server operates as an intermediary to securely extract status data without executing raw mutations on the local agent environment. A new Native Source Adapter (`hermes-native.ts`) bridges the application dynamically via read-only file parsers and isolated `EventSource` queries.

## 2. Agent / Profile Discovery
Profiles are parsed natively without assuming the existence of arbitrary hardcoded UI fixtures. We dynamically extract `served_profiles` by synchronously observing Hermes' `gateway_state.json`.

## 3. Normalized Registry Shape
Agent representations conform dynamically:
- **`id`**: Safely decoded registry identifier (e.g., `default`, `coder`, `qa-kanban`).
- **`name`**: Capitalized localized string.
- **`status`**: Honest idle status defaulting to 'Tersedia'.
- **`description`**: 'Native Hermes Profile' to disambiguate from static mock fixtures.

## 4. Native Lifecycle Events
During Phase 3F-A, Lyra observes natively proven SSE events (`run.started`, `run.completed`).
Because the local environment's `api_server` plugin is disabled in the tested `config.yaml` to ensure process safety, Hermes Native SSE safely isolates and defers connection, issuing `bridge.warning` ("no_active_run").

## 5. Excluded Event Types
Raw model payloads (`message.delta`) and unstructured agent reasoning steps remain completely masked. Unknown payloads are silently suppressed or converted into safely mapped `bridge.warning` outputs.

## 6. Message.delta Policy
Real-time partial model completion streams (`message.delta`) MUST NOT be represented as simulated file typing or mock shell inputs. These are deferred and structurally isolated.

## 7. Read-Only Guarantee
No POST mutations occur. Hermes Python core code, plugins, `9Router`, and configurations remained 100% untouched.

## 8. Reconnect Strategy
If `api_server` drops or refuses connection, Lyra employs an exponential binary backoff strategy: 1s, 2s, 4s, ... max 30s limit to ensure robust resilience without reconnect storms.

## 9. Failure Isolation
Unavailable Native Server endpoints dynamically fallback into UI-safe Idle presentations, retaining application layout and functionality, avoiding frontend React crashes.

## 10. Source Indicators
Clear distinguishing badges (`Data Hermes` vs `Data Desain`) correctly classify the data origins across lists and profile panels. `HERMES LIVE` securely differentiates real-time Native streams from `DEMO BRIDGE` (Fixture SSE).

## 11. Current 3F-A Limitations
- Native file content streaming requires an observer plugin.
- Terminal outputs are not hooked.
- Agent command lifecycles are functionally disconnected.

## 12. What Remains for Phase 3F-B
- Sub-process terminal observations (`terminal.stdout`, `terminal.stderr`).
- ProcessRegistry modifications via hooks.
- Extracted hooks around `file_operations.py` for file modification events.
