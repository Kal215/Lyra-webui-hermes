# MEMORY CORE V2 — CANONICAL ARCHITECTURE STATE
# Last updated: 2026-10-02
# This file is the SINGLE SOURCE OF TRUTH for Hermes/Lyra memory architecture.
# Do NOT infer architecture from MEMORY.md, USER.md, skill listings, or defaults.

## PRIMARY LONG-TERM MEMORY

### Mem0 / Qdrant (Semantic + Episodic)
- Backend: Qdrant local (`/opt/hermes-stack/memory-core-v2/qdrant_db`)
- Embedding: `all-MiniLM-L6-v2` (384-dim, offline)
- Service: `memory-core-v2.service` on `127.0.0.1:20129`
- Role: Semantic and episodic long-term memory — facts, decisions, events

### Obsidian (Durable Verified Knowledge)
- Role: Structured documents, architecture plans, verified knowledge base
- Syncthing 1:1 replication: Azure VPS ↔ Windows PC
- Integration: Keyword-match retrieval in `do_retrieve()` at service level

### MEMORY.md
- Location: `~/.hermes/memories/MEMORY.md`
- Role: **Supplemental/bootstrap context only**
- Injected by Hermes core every turn (independent of Memory Core V2)
- NOT the primary long-term memory

### USER.md
- Location: `~/.hermes/memories/USER.md`
- Role: **User profile/bootstrap context only**
- Injected by Hermes core every turn (independent of Memory Core V2)
- NOT the primary long-term memory

### Skills
- Role: **Procedures and workflows** (on-demand loading)
- NOT primary long-term memory

### NeonDB
- Role: **Application database** (Nay's Cake products, orders, users, stock)
- **NOT used as Hermes/Lyra AI memory backend**

---

## ENVIRONMENTS (Isolated)

### LYRA CORE
- Environment key: `lyra_core`
- Collection: `lyra_core_memory_v2`
- User ID: `lyra_core_system`
- Obsidian root: `/opt/lyra/obsidian-vault/Core`

### ASSISTANT MAMAH
- Environment key: `assistant_mamah`
- Collection: `assistant_mamah_memory_v2`
- User ID: `assistant_mamah_system`
- Obsidian root: `/opt/lyra/obsidian-vault/Profiles/assistant-mamah`

These environments are **logically isolated**. Lyra Core cannot read Assistant Mamah memories and vice versa.

---

## RULES FOR AI SELF-AWARENESS

1. Do NOT conclude architecture status from MEMORY.md alone.
2. Do NOT conclude Obsidian is inactive just because Hermes built-in Obsidian skill reports no default vault. The Memory Core V2 Obsidian integration uses its own configured paths.
3. Always use THIS canonical architecture state as the authoritative reference.
4. **Configured architecture** is distinct from **current runtime health**. If the service is temporarily down, the architecture does not change — only availability does.
5. When asked about memory/brain/architecture, read this file and optionally check `GET /status` for runtime health.
