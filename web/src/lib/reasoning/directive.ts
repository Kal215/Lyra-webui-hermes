import type {
  ReasoningDirective,
  WorkReasoningInput,
} from './types';

function renderBoolean(value: boolean): string {
  return value ? 'true' : 'false';
}

export function serializeReasoningDirective(
  directive: ReasoningDirective,
): string {
  return [
    '[LYRA_REASONING_DIRECTIVE]',
    `protocol_version: ${directive.protocolVersion}`,
    `depth: ${directive.depth}`,
    `risk: ${directive.risk}`,
    `reasoning_budget: ${directive.reasoningBudget}`,
    `require_evidence: ${renderBoolean(directive.requireEvidence)}`,
    `require_verification: ${renderBoolean(directive.requireVerification)}`,
    `approval_mode: ${directive.approvalMode}`,
    '[/LYRA_REASONING_DIRECTIVE]',
  ].join('\n');
}

export function buildReasonedTaskBody(
  input: Pick<WorkReasoningInput, 'instruction'>,
  directive: ReasoningDirective,
): string {
  const directiveText = serializeReasoningDirective(directive);

  return [
    directiveText,
    '',
    '[USER_TASK]',
    input.instruction,
    '[/USER_TASK]',
  ].join('\n');
}
