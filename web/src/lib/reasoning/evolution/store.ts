import { EvolutionCandidate, EvolutionStatus, EvolutionEvent } from './types';
import crypto from 'crypto';

export interface EvolutionStore {
  putCandidate(candidate: EvolutionCandidate): Promise<void>;
  getCandidate(id: string): Promise<EvolutionCandidate | null>;
  listCandidates(): Promise<EvolutionCandidate[]>;
  transition(id: string, newStatus: EvolutionStatus): Promise<void>;
}

export function isValidTransition(oldStatus: EvolutionStatus, newStatus: EvolutionStatus): boolean {
  if (oldStatus === 'DRAFT') {
    return newStatus === 'PROPOSED' || newStatus === 'REJECTED';
  }
  if (oldStatus === 'PROPOSED') {
    return newStatus === 'SANDBOXED' || newStatus === 'REJECTED';
  }
  if (oldStatus === 'SANDBOXED') {
    return newStatus === 'VALIDATED' || newStatus === 'REJECTED';
  }
  if (oldStatus === 'VALIDATED') {
    return newStatus === 'BENCHMARKED' || newStatus === 'REJECTED';
  }
  if (oldStatus === 'BENCHMARKED') {
    return newStatus === 'REVIEWED' || newStatus === 'REJECTED';
  }
  if (oldStatus === 'REVIEWED') {
    return newStatus === 'AWAITING_APPROVAL' || newStatus === 'REJECTED';
  }
  if (oldStatus === 'AWAITING_APPROVAL') {
    return newStatus === 'PROMOTION_ELIGIBLE' || newStatus === 'REJECTED';
  }
  if (oldStatus === 'PROMOTION_ELIGIBLE') {
    return newStatus === 'SUPERSEDED'; // typically after merge
  }
  return false;
}

export class InMemoryEvolutionStore implements EvolutionStore {
  private candidates: Map<string, EvolutionCandidate> = new Map();
  private events: EvolutionEvent[] = [];

  async putCandidate(candidate: EvolutionCandidate): Promise<void> {
    if (this.candidates.has(candidate.id)) {
      throw new Error(`Candidate ${candidate.id} already exists`);
    }
    this.candidates.set(candidate.id, structuredClone(candidate));
  }

  async getCandidate(id: string): Promise<EvolutionCandidate | null> {
    const c = this.candidates.get(id);
    return c ? structuredClone(c) : null;
  }

  async listCandidates(): Promise<EvolutionCandidate[]> {
    return Array.from(this.candidates.values()).map(c => structuredClone(c));
  }

  async transition(id: string, newStatus: EvolutionStatus): Promise<void> {
    const candidate = this.candidates.get(id);
    if (!candidate) {
      throw new Error(`Candidate ${id} not found`);
    }
    const oldStatus = candidate.status;
    if (!isValidTransition(oldStatus, newStatus)) {
      throw new Error(`Invalid transition from ${candidate.status} to ${newStatus}`);
    }
    candidate.status = newStatus;

    // Add to audit trail
    this.events.push({
      eventId: crypto.randomUUID(),
      candidateId: id,
      type: 'TRANSITION',
      timestamp: new Date().toISOString(),
      payload: {
        from: oldStatus,
        to: newStatus
      }
    });
  }

  // Exposed for testing
  getEvents(): EvolutionEvent[] {
    return structuredClone(this.events);
  }
}
