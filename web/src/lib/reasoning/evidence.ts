export type EvidenceKind =
  | 'OBSERVED'
  | 'TEST_RESULT'
  | 'FILE_STATE'
  | 'COMMAND_RESULT'
  | 'EXTERNAL_SOURCE'
  | 'WORKER_CLAIM';

export interface EvidenceRecord {
  kind: EvidenceKind;
  summary: string;
  source?: string;
  observedAt?: string;
}

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface CompletionContract {
  protocol_version: string;
  depth: string;
  risk: string;
  confidence: string;
  verification?: string;
  reasoning_budget: number;
  evidence?: EvidenceRecord[];
  [key: string]: unknown;
}

export interface ValidationPolicy {
  require_verification: boolean;
  require_evidence: boolean;
}

export interface ContractValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateCompletionContract(
  contract: Partial<CompletionContract>,
  policy: ValidationPolicy,
  isNormalSuccess: boolean
): ContractValidationResult {
  const errors: string[] = [];

  // Required LYRA fields
  const requiredFields = [
    'protocol_version',
    'depth',
    'risk',
    'confidence',
    'reasoning_budget'
  ];

  for (const field of requiredFields) {
    if (contract[field] === undefined || contract[field] === null) {
      errors.push(`Missing required LYRA field: ${field}`);
    }
  }

  // Validate Enum Values
  const validDepths = ['QUICK', 'STANDARD', 'DEEP', 'CRITICAL'];
  if (contract.depth && !validDepths.includes(contract.depth)) {
    errors.push(`Invalid depth: ${contract.depth}`);
  }

  const validRisks = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  if (contract.risk && !validRisks.includes(contract.risk)) {
    errors.push(`Invalid risk: ${contract.risk}`);
  }

  const validConfidences = ['HIGH', 'MEDIUM', 'LOW'];
  if (contract.confidence && !validConfidences.includes(contract.confidence)) {
    errors.push(`Invalid confidence: ${contract.confidence}`);
  }

  // LOW confidence + successful completion claim => invalid
  if (contract.confidence === 'LOW' && isNormalSuccess) {
    errors.push('LOW confidence cannot result in normal success');
  }

  // require_verification = true + empty verification => invalid
  if (policy.require_verification && (!contract.verification || contract.verification.trim() === '')) {
    errors.push('Missing verification when require_verification is true');
  }

  // require_evidence = true + zero evidence records => invalid
  if (policy.require_evidence) {
    if (!contract.evidence || !Array.isArray(contract.evidence) || contract.evidence.length === 0) {
      errors.push('Missing evidence records when require_evidence is true');
    } else {
      // Validate Evidence Records
      for (const record of contract.evidence) {
        if (!record.kind || !['OBSERVED', 'TEST_RESULT', 'FILE_STATE', 'COMMAND_RESULT', 'EXTERNAL_SOURCE', 'WORKER_CLAIM'].includes(record.kind)) {
          errors.push(`Invalid evidence kind: ${record.kind}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
