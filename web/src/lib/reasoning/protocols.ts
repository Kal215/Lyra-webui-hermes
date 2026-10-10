import type {
  ApprovalMode,
  ReasoningDepth,
  RiskLevel,
} from './types';

export interface DepthPolicy {
  reasoningBudget: number;
  requireEvidence: boolean;
  requireVerification: boolean;
}

export const DEPTH_POLICIES = {
  QUICK: {
    reasoningBudget: 1,
    requireEvidence: false,
    requireVerification: true,
  },
  STANDARD: {
    reasoningBudget: 3,
    requireEvidence: true,
    requireVerification: true,
  },
  DEEP: {
    reasoningBudget: 6,
    requireEvidence: true,
    requireVerification: true,
  },
  CRITICAL: {
    reasoningBudget: 8,
    requireEvidence: true,
    requireVerification: true,
  },
} satisfies Record<ReasoningDepth, DepthPolicy>;

export const RISK_DEPTH_FLOOR = {
  LOW: 'QUICK',
  MEDIUM: 'STANDARD',
  HIGH: 'DEEP',
  CRITICAL: 'CRITICAL',
} satisfies Record<RiskLevel, ReasoningDepth>;

const DEPTH_RANK: Record<ReasoningDepth, number> = {
  QUICK: 0,
  STANDARD: 1,
  DEEP: 2,
  CRITICAL: 3,
};

export function maxDepth(
  left: ReasoningDepth,
  right: ReasoningDepth,
): ReasoningDepth {
  return DEPTH_RANK[left] >= DEPTH_RANK[right] ? left : right;
}

export function approvalModeForRisk(risk: RiskLevel): ApprovalMode {
  return risk === 'CRITICAL'
    ? 'KANBAN_BLOCK_REQUIRED'
    : 'NONE';
}
