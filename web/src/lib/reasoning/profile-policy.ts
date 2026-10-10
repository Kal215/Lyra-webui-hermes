export type ProtocolFamily =
  | 'coder'
  | 'default'
  | 'planner'
  | 'researcher'
  | 'security'
  | 'qa'
  | 'verifier'
  | 'synthesizer';

const PROFILE_FAMILY_MAP = new Map<string, ProtocolFamily>([
  ['coder', 'coder'],
  ['default', 'default'],
  ['planner', 'planner'],
  ['researcher', 'researcher'],
  ['security', 'security'],
  ['security-kanban', 'security'],
  ['qa', 'qa'],
  ['qa-kanban', 'qa'],
  ['verifier', 'verifier'],
  ['synthesizer', 'synthesizer'],
]);

export function getProtocolFamily(assignee: string): ProtocolFamily | null {
  return PROFILE_FAMILY_MAP.get(assignee.trim().toLowerCase()) ?? null;
}

export function supportsReasoningAssignee(assignee: string): boolean {
  return getProtocolFamily(assignee) !== null;
}
