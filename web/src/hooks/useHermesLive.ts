import { useState, useEffect, useReducer, useRef } from 'react';

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
  payload: any;
}

export type FileChange = {
  path: string;
  type: 'changed' | 'patch';
  timestamp: number;
  diff?: string;
};

export type LiveRunState = {
  status: string;
  terminalOutput: string[];
  currentFile: string | null;
  fileContent: string | null;
  changes: FileChange[];
  currentActionKey: string;
  currentActionParams: Record<string, string>;
  connectionHealth: 'connected' | 'connecting' | 'reconnecting' | 'unavailable';
  filesChanged: number;
  files: Record<string, { path: string, content: string | null, lastTouched: number }>;
  linesAdded: number;
  linesRemoved: number;
};

type Action = 
  | { type: 'EVENT'; event: LyraAgentEvent }
  | { type: 'SET_CONNECTION'; health: LiveRunState['connectionHealth'] };

function liveReducer(state: LiveRunState, action: Action): LiveRunState {
  if (action.type === 'SET_CONNECTION') {
    return { ...state, connectionHealth: action.health };
  }

  const e = action.event;
  const payload = e.payload || {};

  switch (e.type) {
    case 'run.started':
      return { ...state, status: 'running' };
    case 'run.completed':
      return { ...state, status: payload.status || 'completed' };
    case 'command.started':
      return {
        ...state,
        currentActionKey: 'action.run_command',
        currentActionParams: { command: payload.command || payload.args?.command || '' },
        terminalOutput: [...state.terminalOutput, `
$ ${payload.command || payload.args?.command || ''}
`]
      };
    case 'terminal.stdout':
    case 'terminal.stderr':
      const chunk = payload.chunk || payload.text || '';
      return { ...state, terminalOutput: [...state.terminalOutput, chunk] };
    case 'command.finished':
      const exitCode = payload.exit_code !== undefined ? payload.exit_code : (payload.result?.exit_code);
      return { ...state, terminalOutput: [...state.terminalOutput, `
✓ exit ${exitCode || 0}
`], currentActionKey: '', currentActionParams: {} };
    case 'file.changed':
    case 'file.patch':
      const path = payload.path || payload.file || '';
      const content = payload.content !== undefined ? payload.content : state.fileContent;
      const newChange: FileChange = {
        path,
        type: e.type === 'file.patch' ? 'patch' : 'changed',
        timestamp: Date.now(),
        diff: payload.diff
      };
      const updatedFiles = { ...state.files };
      if (path) {
        updatedFiles[path] = {
          path,
          content,
          lastTouched: Date.now()
        };
      }
      return {
        ...state,
        currentFile: path,
        fileContent: content,
        changes: [...state.changes, newChange],
        files: updatedFiles,
        filesChanged: state.filesChanged + 1,
        currentActionKey: e.type === 'file.patch' ? 'action.patch_file' : 'action.write_file',
        currentActionParams: { file: path }
      };
    default:
      return state;
  }
}

export function useHermesLive(agentId: string) {
  const [state, dispatch] = useReducer(liveReducer, {
    status: 'idle',
    terminalOutput: [],
    currentFile: null,
    fileContent: null,
    changes: [],
    currentActionKey: '',
    currentActionParams: {},
    connectionHealth: 'connecting',
    filesChanged: 0,
    files: {},
    linesAdded: 0,
    linesRemoved: 0
  });

  const [sourceMode, setSourceMode] = useState<'simulation' | 'sse' | 'hermes-native'>('hermes-native');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const ls = urlParams.get('liveSource');
      if (ls === 'simulation') {
        setSourceMode('simulation');
      }
    }
  }, []);

  useEffect(() => {
    if (sourceMode !== 'hermes-native') return;

    const endpoint = `/api/live/hermes/events?agentId=${encodeURIComponent(agentId)}`;
    const eventSource = new window.EventSource(endpoint);
    
    eventSource.onopen = () => dispatch({ type: 'SET_CONNECTION', health: 'connected' });
    
    eventSource.onmessage = (e) => {
      try {
        const parsed: LyraAgentEvent = JSON.parse(e.data);
        dispatch({ type: 'EVENT', event: parsed });
      } catch (err) {
        console.error("SSE parse error", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      dispatch({ type: 'SET_CONNECTION', health: 'unavailable' });
    };

    return () => {
      eventSource.close();
    };
  }, [sourceMode]);

  return {
    ...state,
    sourceMode
  };
}
