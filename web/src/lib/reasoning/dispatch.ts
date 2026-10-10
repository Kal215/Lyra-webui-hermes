import { classifyReasoning } from './classifier';
import { buildReasonedTaskBody } from './directive';
import { supportsReasoningAssignee, getProtocolFamily } from './profile-policy';

import type {
  ReasoningClassification,
  WorkReasoningInput,
} from './types';

export interface PreparedWorkDispatch {
  body: string;
  reasoning: ReasoningClassification | null;
  protocolFamily?: string | null;
}

export { supportsReasoningAssignee };

export function prepareWorkForDispatch(
  input: WorkReasoningInput,
): PreparedWorkDispatch {
  if (!supportsReasoningAssignee(input.assignee)) {
    return {
      body: input.instruction,
      reasoning: null,
      protocolFamily: null,
    };
  }

  const reasoning = classifyReasoning(input);
  const protocolFamily = getProtocolFamily(input.assignee);

  return {
    body: buildReasonedTaskBody(input, reasoning),
    reasoning,
    protocolFamily,
  };
}
