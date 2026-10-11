export type TaskLifecycle = 'queued' | 'in_progress' | 'completed' | 'failed' | 'paused';
export type TodoState = 'pending' | 'in_progress' | 'completed';
export type ToolExecutionStatus = 'running' | 'success' | 'failed';

export interface AgentTodoItem {
  id: string;
  order: number;
  label: string;
  description?: string;
  state: TodoState;
  assignee?: string;
  assigneeRole?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ToolCallLog {
  id: string;
  parentStepId?: string;
  toolName: 'file_writer' | 'bash_executor' | 'ast_grep' | 'git_client' | 'web_search' | 'read_file';
  commandPreview: string;
  rawInput?: Record<string, unknown>;
  output?: string;
  status: ToolExecutionStatus;
  durationMs?: number;
  filesChanged?: Array<{
    path: string;
    additions?: number;
    deletions?: number;
    action?: 'created' | 'modified' | 'deleted';
  }>;
}

export interface ReasoningNode {
  id: string;
  timestamp: string;
  thought: string;
  isStreaming: boolean;
}

export interface DeliverableArtifact {
  title: string;
  summary: string;
  gitBranch?: string;
  changedFiles: Array<{
    path: string;
    action: 'created' | 'modified' | 'deleted';
  }>;
  nextActionableSteps: string[];
}

export type HQSimulationAgentState = 'idle' | 'thinking' | 'coding' | 'walking' | 'reviewing';

export type AgentStreamEvent =
  | { type: 'SESSION_INITIALIZED'; payload: { sessionId: string; agentId?: string } }
  | { type: 'REASONING_DELTA'; payload: { nodeId: string; chunk: string } }
  | { type: 'REASONING_COMPLETED'; payload: { nodeId: string } }
  | { type: 'TODOS_MUTATED'; payload: { todos: AgentTodoItem[] } }
  | { type: 'TOOL_SPAWNED'; payload: ToolCallLog }
  | { type: 'TOOL_STREAM_STDOUT'; payload: { toolId: string; stdoutChunk: string } }
  | { type: 'TOOL_CONCLUDED'; payload: { toolId: string; status: ToolExecutionStatus; durationMs?: number; output?: string } }
  | { type: 'DELIVERABLE_READY'; payload: DeliverableArtifact }
  | { type: 'TERMINAL_RAW_STREAM'; payload: { chunk: string } }
  | { type: 'HQ_SIMULATION_SYNC'; payload: { agentState: HQSimulationAgentState } };
