export type EventSource = 'native_hermes' | 'hermes_observer' | 'derived' | 'future_instrumented' | 'mock_only';

export type LyraAgentEventType = 
  | 'run.started'
  | 'run.completed'
  | 'agent.status'
  | 'command.started'
  | 'terminal.stdout'
  | 'terminal.stderr'
  | 'command.finished'
  | 'file.opened'
  | 'file.changed'
  | 'file.patch'
  | 'check.started'
  | 'check.finished'
  | 'bridge.warning';

export interface LyraAgentEvent {
  version: 1;
  eventId: string;
  runId: string;
  agentId: string;
  workId?: string;
  timestamp: string; // ISO8601
  sequence: number;
  type: LyraAgentEventType;
  source: EventSource;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
}
