export const REASONING_PROTOCOL_VERSION = 'lyra-r1-v1' as const;

export const REASONING_DEPTHS = [
  'QUICK',
  'STANDARD',
  'DEEP',
  'CRITICAL',
] as const;

export const RISK_LEVELS = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
] as const;

export const APPROVAL_MODES = [
  'NONE',
  'KANBAN_BLOCK_REQUIRED',
] as const;

export type ReasoningDepth = (typeof REASONING_DEPTHS)[number];
export type RiskLevel = (typeof RISK_LEVELS)[number];
export type ApprovalMode = (typeof APPROVAL_MODES)[number];

export interface WorkReasoningInput {
  title?: string | null;
  instruction: string;
  assignee: string;
  priority?: string | number | null;
}

export interface ClassificationSignals {
  complexity: string[];
  risk: string[];
}

export interface ReasoningDirective {
  protocolVersion: typeof REASONING_PROTOCOL_VERSION;
  depth: ReasoningDepth;
  risk: RiskLevel;
  reasoningBudget: number;
  requireEvidence: boolean;
  requireVerification: boolean;
  approvalMode: ApprovalMode;
}

export interface ReasoningClassification extends ReasoningDirective {
  complexityScore: number;
  riskScore: number;
  signals: ClassificationSignals;
}
