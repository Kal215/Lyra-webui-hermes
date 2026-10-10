import { LyraAgentEvent } from './types';
import { startObserverServer } from './observer/socket-server';

// Start socket server in the background
import { redactText } from './redaction';

export const MAX_EVENTS_PER_RUN = 5000;
export const MAX_ACTIVE_RUNS = 50;
export const RUN_TTL_MS = 60 * 60 * 1000; // 1 hour

type RunState = {
  events: LyraAgentEvent[];
  lastAccessed: number;
  subscribers: Set<(event: LyraAgentEvent) => void>;
};

class LiveRunBuffer {
  private runs: Map<string, RunState> = new Map();

  public getStats() {
    let totalEvents = 0;
    this.runs.forEach(state => totalEvents += state.events.length);
    return {
      activeRuns: this.runs.size,
      totalBufferedEvents: totalEvents,
      maxEventsPerRun: MAX_EVENTS_PER_RUN,
      maxActiveRuns: MAX_ACTIVE_RUNS,
      runTtlMs: RUN_TTL_MS
    };
  }

  public getAllEvents(): LyraAgentEvent[] {
    const all: LyraAgentEvent[] = [];
    this.runs.forEach(state => all.push(...state.events));
    // Sort globally by timestamp, then by sequence as fallback
    all.sort((a, b) => {
      const timeDiff = Date.parse(b.timestamp as string) - Date.parse(a.timestamp as string);
      return timeDiff !== 0 ? timeDiff : b.sequence - a.sequence;
    });
    return all;
  }

  public pushEvent(runId: string, event: LyraAgentEvent) {
    this.cleanupStaleRuns();
    
    if (!this.runs.has(runId)) {
      this.enforceGlobalRunBounds();
      this.runs.set(runId, {
        events: [],
        lastAccessed: Date.now(),
        subscribers: new Set()
      });
    }

    const state = this.runs.get(runId)!;
    state.lastAccessed = Date.now();

    // REDACTION BEFORE BUFFERING (DEEP REDACTION)
    const safeEvent = this.redactDeep(event) as LyraAgentEvent;

    state.events.push(safeEvent);

    // Enforce bounds: KEEP THE NEWEST EVENTS
    if (state.events.length > MAX_EVENTS_PER_RUN) {
      // slice(-MAX) takes the latest items
      state.events = state.events.slice(-MAX_EVENTS_PER_RUN);
    }

    // Notify concurrent subscribers safely
    for (const sub of state.subscribers) {
      try {
        sub(safeEvent);
      } catch (e: unknown) {
        // Ignored
      }
    }
  }

  public getEvents(runId: string, afterSequence: number = -1): { events: LyraAgentEvent[], hasGap: boolean } {
    const state = this.runs.get(runId);
    if (!state) return { events: [], hasGap: false };
    
    state.lastAccessed = Date.now();
    
    if (afterSequence === -1) {
      return { events: state.events, hasGap: false };
    }

    const oldestSequence = state.events.length > 0 ? state.events[0].sequence : 0;
    // If the client's last event is older than our oldest retained (minus 1 to allow strictly sequential)
    const hasGap = afterSequence >= 0 && afterSequence < (oldestSequence - 1);

    return { 
      events: state.events.filter(e => e.sequence > afterSequence), 
      hasGap 
    };
  }

  public subscribe(runId: string, callback: (event: LyraAgentEvent) => void): () => void {
    this.cleanupStaleRuns();
    if (!this.runs.has(runId)) {
       this.enforceGlobalRunBounds();
       this.runs.set(runId, {
        events: [],
        lastAccessed: Date.now(),
        subscribers: new Set()
      });
    }
    const state = this.runs.get(runId)!;
    state.lastAccessed = Date.now();
    state.subscribers.add(callback);
    return () => {
      state.subscribers.delete(callback);
    };
  }

  public clear(runId: string) {
    this.runs.delete(runId);
  }

  private redactDeep(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return redactText(obj);
    if (Array.isArray(obj)) return obj.map(item => this.redactDeep(item));
    if (typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const key of Object.keys(obj)) {
        result[key] = this.redactDeep((obj as Record<string, unknown>)[key]);
      }
      return result;
    }
    return obj;
  }

  private enforceGlobalRunBounds() {
    if (this.runs.size >= MAX_ACTIVE_RUNS) {
      // Find oldest accessed run
      let oldestRunId: string | null = null;
      let oldestTime = Infinity;
      for (const [id, state] of Array.from(this.runs.entries())) {
        if (state.lastAccessed < oldestTime) {
          oldestTime = state.lastAccessed;
          oldestRunId = id;
        }
      }
      if (oldestRunId) {
        this.runs.delete(oldestRunId);
      }
    }
  }

  private cleanupStaleRuns() {
    const now = Date.now();
    for (const [id, state] of Array.from(this.runs.entries())) {
      if (now - state.lastAccessed > RUN_TTL_MS) {
        this.runs.delete(id);
      }
    }
  }
}

// Singleton for development/server context
export const runBuffer = new LiveRunBuffer();