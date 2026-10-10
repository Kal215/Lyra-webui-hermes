import {
  DEPTH_POLICIES,
  RISK_DEPTH_FLOOR,
  approvalModeForRisk,
  maxDepth,
} from './protocols';

import {
  REASONING_PROTOCOL_VERSION,
  type ReasoningClassification,
  type ReasoningDepth,
  type RiskLevel,
  type WorkReasoningInput,
} from './types';

interface SignalRule {
  label: string;
  pattern: RegExp;
  score: number;
}

const COMPLEXITY_RULES: SignalRule[] = [
  {
    label: 'bug-investigation',
    pattern: /\b(debug|investigate|diagnose|root cause|bug)\b/i,
    score: 2,
  },
  {
    label: 'architecture',
    pattern: /\b(architecture|architectural|redesign)\b/i,
    score: 3,
  },
  {
    label: 'concurrency',
    pattern: /\b(race condition|concurrency|concurrent|deadlock)\b/i,
    score: 3,
  },
  {
    label: 'migration-refactor',
    pattern: /\b(migration|migrate|refactor|rewrite)\b/i,
    score: 2,
  },
  {
    label: 'integration',
    pattern: /\b(integration|integrate|endpoint|api|feature|component)\b/i,
    score: 2,
  },
  {
    label: 'multi-step',
    pattern: /\b(multi[- ]?step|end[- ]to[- ]end|across multiple|several modules)\b/i,
    score: 1,
  },
  {
    label: 'performance',
    pattern: /\b(performance|bottleneck|profiling|latency|optimization|optimise|optimize)\b/i,
    score: 2,
  },
];

const RISK_RULES: SignalRule[] = [
  {
    label: 'auth-secrets',
    pattern: /\b(auth|authentication|authorization|oauth|jwt|credential|credentials|secret|secrets|password|token)\b/i,
    score: 6,
  },
  {
    label: 'database-schema',
    pattern: /\b(database|schema|migration|migrate|sql)\b/i,
    score: 5,
  },
  {
    label: 'system-configuration',
    pattern: /\b(systemd|sudo|permission|permissions|firewall|service config|system config)\b/i,
    score: 4,
  },
  {
    label: 'deployment',
    pattern: /\b(deploy|deployment|release|production|prod)\b/i,
    score: 5,
  },
  {
    label: 'destructive-file-operation',
    pattern: /\b(delete|remove|erase|purge|wipe)\b/i,
    score: 3,
  },
];

const CRITICAL_RISK_RULES: Omit<SignalRule, 'score'>[] = [
  {
    label: 'recursive-delete',
    pattern: /\brm\s+-rf\b/i,
  },
  {
    label: 'destructive-database',
    pattern: /\b(drop\s+(table|database)|truncate\s+table|delete\s+database)\b/i,
  },
  {
    label: 'production-database',
    pattern: /\bproduction\s+(database|db)\b/i,
  },
  {
    label: 'service-restart',
    pattern: /\b(restart|stop|reboot)\b.{0,30}\b(service|server|gateway|9router)\b/i,
  },
  {
    label: 'systemctl-destructive',
    pattern: /\bsystemctl\s+(restart|stop|disable)\b/i,
  },
  {
    label: 'forced-process-kill',
    pattern: /\bkill\s+-9\b/i,
  },
  {
    label: 'firewall-disable',
    pattern: /\bfirewall\b.{0,30}\b(disable|flush|off)\b/i,
  },
];

function normalizedTaskText(input: WorkReasoningInput): string {
  return `${input.title ?? ''}\n${input.instruction}`.trim();
}

function applyRules(
  text: string,
  rules: SignalRule[],
): {
  score: number;
  signals: string[];
} {
  let score = 0;
  const signals: string[] = [];

  for (const rule of rules) {
    if (!rule.pattern.test(text)) {
      continue;
    }

    score += rule.score;
    signals.push(rule.label);
  }

  return { score, signals };
}

function classifyComplexity(
  text: string,
): {
  score: number;
  depth: ReasoningDepth;
  signals: string[];
} {
  const result = applyRules(text, COMPLEXITY_RULES);

  let score = result.score;
  const signals = [...result.signals];

  if (text.length >= 1500) {
    score += 2;
    signals.push('long-task');
  } else if (text.length >= 600) {
    score += 1;
    signals.push('medium-task-length');
  }

  let depth: ReasoningDepth;

  if (score >= 5) {
    depth = 'DEEP';
  } else if (score >= 2) {
    depth = 'STANDARD';
  } else {
    depth = 'QUICK';
  }

  return {
    score,
    depth,
    signals,
  };
}

function classifyRisk(
  text: string,
): {
  score: number;
  risk: RiskLevel;
  signals: string[];
} {
  const criticalSignals = CRITICAL_RISK_RULES
    .filter((rule) => rule.pattern.test(text))
    .map((rule) => rule.label);

  if (criticalSignals.length > 0) {
    return {
      score: 10,
      risk: 'CRITICAL',
      signals: criticalSignals,
    };
  }

  const result = applyRules(text, RISK_RULES);

  let risk: RiskLevel;

  if (result.score >= 8) {
    risk = 'CRITICAL';
  } else if (result.score >= 5) {
    risk = 'HIGH';
  } else if (result.score >= 2) {
    risk = 'MEDIUM';
  } else {
    risk = 'LOW';
  }

  return {
    score: result.score,
    risk,
    signals: result.signals,
  };
}

export function classifyReasoning(
  input: WorkReasoningInput,
): ReasoningClassification {
  const text = normalizedTaskText(input);

  const complexity = classifyComplexity(text);
  const risk = classifyRisk(text);

  const depth = maxDepth(
    complexity.depth,
    RISK_DEPTH_FLOOR[risk.risk],
  );

  const policy = DEPTH_POLICIES[depth];

  return {
    protocolVersion: REASONING_PROTOCOL_VERSION,
    depth,
    risk: risk.risk,
    reasoningBudget: policy.reasoningBudget,
    requireEvidence: policy.requireEvidence,
    requireVerification: policy.requireVerification,
    approvalMode: approvalModeForRisk(risk.risk),
    complexityScore: complexity.score,
    riskScore: risk.score,
    signals: {
      complexity: complexity.signals,
      risk: risk.signals,
    },
  };
}
