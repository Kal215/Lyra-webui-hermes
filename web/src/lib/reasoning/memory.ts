import { ConfidenceLevel } from './evidence';
import { Verdict } from './review';

export const MEMORY_SCHEMA_VERSION = 'lyra-project-memory-v1';

export type MemoryKind = 
  | 'DECISION'
  | 'CONSTRAINT'
  | 'FACT'
  | 'FAILURE'
  | 'LESSON'
  | 'ACCEPTANCE'
  | 'RISK'
  | 'ARTIFACT';

export type MemoryStatus = 'ACTIVE' | 'SUPERSEDED' | 'RETRACTED';

export interface ProjectMemoryEntry {
  id: string;
  projectId: string;
  kind: MemoryKind;
  summary: string;
  tags?: string[];
  sourceRefs?: string[];
  confidence?: ConfidenceLevel;
  status: MemoryStatus;
  createdAt: number;
  updatedAt?: number;
  supersedes?: string[];
}

export interface MemoryQueryOptions {
  projectId: string;
  kinds?: MemoryKind[];
  tags?: string[];
  limit?: number;
  includeHistorical?: boolean; // If false, returns only ACTIVE
}

export interface ProjectMemoryStore {
  put(entry: Omit<ProjectMemoryEntry, 'id' | 'createdAt' | 'status'>): Promise<ProjectMemoryEntry>;
  get(id: string): Promise<ProjectMemoryEntry | null>;
  query(options: MemoryQueryOptions): Promise<ProjectMemoryEntry[]>;
  supersede(newEntry: Omit<ProjectMemoryEntry, 'id' | 'createdAt' | 'status'>, targetIds: string[]): Promise<ProjectMemoryEntry>;
  retract(id: string): Promise<boolean>;
}

// Security guard against obvious secrets
const FORBIDDEN_TOKENS = ['api_key', 'token=', 'password', 'secret', 'credential', '.env'];
export function isSafeMemoryEntry(summary: string, tags?: string[]): boolean {
  const content = (summary + ' ' + (tags || []).join(' ')).toLowerCase();
  for (const token of FORBIDDEN_TOKENS) {
    if (content.includes(token)) return false;
  }
  return true;
}

// Promotion eligibility
export function canPromoteToProjectMemory(
  verdict: Verdict,
  confidence: ConfidenceLevel,
  hasIndependentEvidence: boolean,
  kind: MemoryKind
): boolean {
  if (!['PASS'].includes(verdict)) return false;
  
  if (confidence === 'LOW') {
    // Only risk/failure can be promoted if confidence is low
    if (!['RISK', 'FAILURE'].includes(kind)) return false;
  }
  
  // Need independent evidence for durable project truth unless it's just a risk/failure
  if (!hasIndependentEvidence && ['DECISION', 'FACT', 'ACCEPTANCE', 'CONSTRAINT'].includes(kind)) {
    return false;
  }
  
  return true;
}

// Priorities: lower index = higher priority
const KIND_PRIORITY: Record<MemoryKind, number> = {
  CONSTRAINT: 1,
  DECISION: 2,
  RISK: 3,
  ACCEPTANCE: 4,
  FACT: 5,
  FAILURE: 6,
  LESSON: 7,
  ARTIFACT: 8
};

// Builder for packet
export function buildMemoryPacket(
  entries: ProjectMemoryEntry[],
  maxEntries = 50,
  maxChars = 4000
): string {
  // Sort by priority first, then recency
  const sorted = [...entries].sort((a, b) => {
    const pA = KIND_PRIORITY[a.kind];
    const pB = KIND_PRIORITY[b.kind];
    if (pA !== pB) return pA - pB;
    return b.createdAt - a.createdAt;
  });

  const selected = sorted.slice(0, maxEntries);
  
  let packet = '[LYRA_PROJECT_MEMORY]\n';
  for (const entry of selected) {
    const line = `- ${entry.kind}: ${entry.summary}\n`;
    if (packet.length + line.length > maxChars && packet !== '[LYRA_PROJECT_MEMORY]\n') {
      break; // Stop if we exceed maxChars, unless it's empty
    }
    packet += line;
  }
  packet += '[/LYRA_PROJECT_MEMORY]';
  return packet;
}

export class InMemoryProjectMemoryStore implements ProjectMemoryStore {
  private entries: Map<string, ProjectMemoryEntry> = new Map();
  private idCounter = 1;

  async put(entryData: Omit<ProjectMemoryEntry, 'id' | 'createdAt' | 'status'>): Promise<ProjectMemoryEntry> {
    if (!isSafeMemoryEntry(entryData.summary, entryData.tags)) {
      throw new Error('Memory entry rejected: contains forbidden secret patterns.');
    }

    // Deduplication check
    for (const existing of this.entries.values()) {
      if (
        existing.projectId === entryData.projectId &&
        existing.kind === entryData.kind &&
        existing.summary === entryData.summary &&
        existing.status === 'ACTIVE'
      ) {
        return existing; // Return existing identical entry without duplicating
      }
    }

    const id = `mem-${this.idCounter++}-${Date.now()}`;
    const entry: ProjectMemoryEntry = {
      ...entryData,
      id,
      status: 'ACTIVE',
      createdAt: Date.now()
    };
    this.entries.set(id, entry);
    return entry;
  }

  async get(id: string): Promise<ProjectMemoryEntry | null> {
    return this.entries.get(id) || null;
  }

  async query(options: MemoryQueryOptions): Promise<ProjectMemoryEntry[]> {
    if (!options.projectId) return [];
    
    let results = Array.from(this.entries.values()).filter(e => e.projectId === options.projectId);

    if (!options.includeHistorical) {
      results = results.filter(e => e.status === 'ACTIVE');
    }

    if (options.kinds && options.kinds.length > 0) {
      results = results.filter(e => options.kinds!.includes(e.kind));
    }

    if (options.tags && options.tags.length > 0) {
      results = results.filter(e => {
        if (!e.tags) return false;
        return options.tags!.some(t => e.tags!.includes(t));
      });
    }

    results.sort((a, b) => b.createdAt - a.createdAt); // Newest first

    if (options.limit && options.limit > 0) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  async supersede(
    newEntryData: Omit<ProjectMemoryEntry, 'id' | 'createdAt' | 'status'>,
    targetIds: string[]
  ): Promise<ProjectMemoryEntry> {
    // Conflict detection: are there any OTHER active entries that already supersede these targets?
    // In a simple model, we just allow the new one to supersede and mark targets SUPERSEDED.
    
    for (const targetId of targetIds) {
      const target = this.entries.get(targetId);
      if (target && target.status === 'ACTIVE') {
        target.status = 'SUPERSEDED';
        target.updatedAt = Date.now();
      }
    }

    const newEntry = await this.put({ ...newEntryData, supersedes: targetIds });
    return newEntry;
  }

  async retract(id: string): Promise<boolean> {
    const target = this.entries.get(id);
    if (!target) return false;
    
    target.status = 'RETRACTED';
    target.updatedAt = Date.now();
    return true;
  }
}
