'use client';

import { create } from 'zustand';
import { 
  AgentTodoItem, 
  ToolCallLog, 
  ReasoningNode, 
  DeliverableArtifact, 
  AgentStreamEvent,
  HQSimulationAgentState
} from '@/types/agent-studio';

export interface AutonomousMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  agentName?: string;
}

export interface WorkSessionState {
  sessionId: string | null;
  agentId: string;
  agentStatus: 'idle' | 'reasoning' | 'executing' | 'complete' | 'error';
  reasoningNodes: Record<string, ReasoningNode>;
  reasoningOrder: string[];
  activeReasoningId: string | null;
  todos: AgentTodoItem[];
  toolExecutions: Record<string, ToolCallLog>;
  toolOrder: string[];
  deliverable: DeliverableArtifact | null;
  terminalBuffer: string[];
  hqAgentState: HQSimulationAgentState;
  conversationMessages: AutonomousMessage[];

  // Actions
  setSessionId: (id: string) => void;
  setAgentId: (id: string) => void;
  dispatchAgentEvent: (event: AgentStreamEvent) => void;
  dispatchAgentEventsBatch: (events: AgentStreamEvent[]) => void;
  addConversationMessage: (msg: AutonomousMessage) => void;
  appendAssistantChunk: (chunk: string, agentName?: string) => void;
  initDemoSession: (prompt: string, selectedAgent?: string) => void;
  resetSession: () => void;
}

const TERMINAL_BUFFER_MAX_LINES = 500;

export const useWorkSessionStore = create<WorkSessionState>((set) => ({
  sessionId: null,
  agentId: 'coder',
  agentStatus: 'idle',
  reasoningNodes: {},
  reasoningOrder: [],
  activeReasoningId: null,
  todos: [],
  toolExecutions: {},
  toolOrder: [],
  deliverable: null,
  terminalBuffer: [],
  hqAgentState: 'idle',
  conversationMessages: [],

  setSessionId: (id: string) => set({ sessionId: id }),
  setAgentId: (id: string) => set({ agentId: id }),

  addConversationMessage: (msg: AutonomousMessage) => set((state) => ({
    conversationMessages: [...state.conversationMessages, msg]
  })),

  appendAssistantChunk: (chunk: string, agentName?: string) => set((state) => {
    const msgs = [...state.conversationMessages];
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') {
      msgs[msgs.length - 1] = {
        ...lastMsg,
        content: lastMsg.content + chunk
      };
      return { conversationMessages: msgs };
    }
    const newMsg: AutonomousMessage = {
      id: 'asst_' + Date.now().toString(36),
      role: 'assistant',
      content: chunk,
      agentName: agentName || 'Aster',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    return { conversationMessages: [...msgs, newMsg] };
  }),

  dispatchAgentEvent: (event: AgentStreamEvent) => {
    set((state) => applySingleEvent(state, event));
  },

  dispatchAgentEventsBatch: (events: AgentStreamEvent[]) => {
    set((state) => {
      let nextState = state;
      for (const ev of events) {
        nextState = applySingleEvent(nextState, ev);
      }
      return nextState;
    });
  },

  initDemoSession: (prompt: string, selectedAgent = 'coder') => {
    const sId = 'sess_' + Date.now().toString(36);
    set({
      sessionId: sId,
      agentId: selectedAgent,
      agentStatus: 'reasoning',
      hqAgentState: 'thinking',
      reasoningNodes: {
        'r-1': {
          id: 'r-1',
          timestamp: new Date().toISOString(),
          thought: `Menganalisis instruksi: "${prompt}".\nMenentukan ruang lingkup arsitektur, dependensi yang dibutuhkan, dan menyusun tahapan eksekusi otonom...`,
          isStreaming: false
        }
      },
      reasoningOrder: ['r-1'],
      activeReasoningId: null,
      todos: [],
      toolExecutions: {},
      toolOrder: [],
      deliverable: null,
      terminalBuffer: ['[Lyra Agent Engine] Initialized workspace session for ' + selectedAgent]
    });
  },

  resetSession: () => set({
    sessionId: null,
    agentStatus: 'idle',
    reasoningNodes: {},
    reasoningOrder: [],
    activeReasoningId: null,
    todos: [],
    toolExecutions: {},
    toolOrder: [],
    deliverable: null,
    terminalBuffer: [],
    hqAgentState: 'idle',
    conversationMessages: [],
  }),
}));

function applySingleEvent(state: WorkSessionState, event: AgentStreamEvent): WorkSessionState {
  switch (event.type) {
    case 'SESSION_INITIALIZED': {
      return {
        ...state,
        sessionId: event.payload.sessionId,
        agentId: event.payload.agentId || state.agentId,
        agentStatus: 'reasoning',
        hqAgentState: 'thinking'
      };
    }

    case 'REASONING_DELTA': {
      const { nodeId, chunk } = event.payload;
      const existing = state.reasoningNodes[nodeId];
      const updatedNode: ReasoningNode = existing ? {
        ...existing,
        thought: existing.thought + chunk
      } : {
        id: nodeId,
        timestamp: new Date().toISOString(),
        thought: chunk,
        isStreaming: true
      };

      const newOrder = state.reasoningOrder.includes(nodeId)
        ? state.reasoningOrder
        : [...state.reasoningOrder, nodeId];

      return {
        ...state,
        activeReasoningId: nodeId,
        agentStatus: 'reasoning',
        hqAgentState: 'thinking',
        reasoningNodes: {
          ...state.reasoningNodes,
          [nodeId]: updatedNode
        },
        reasoningOrder: newOrder
      };
    }

    case 'REASONING_COMPLETED': {
      const { nodeId } = event.payload;
      const existing = state.reasoningNodes[nodeId];
      if (!existing) return state;

      return {
        ...state,
        activeReasoningId: state.activeReasoningId === nodeId ? null : state.activeReasoningId,
        reasoningNodes: {
          ...state.reasoningNodes,
          [nodeId]: {
            ...existing,
            isStreaming: false
          }
        }
      };
    }

    case 'TODOS_MUTATED': {
      return {
        ...state,
        todos: event.payload.todos
      };
    }

    case 'TOOL_SPAWNED': {
      const tool = event.payload;
      const newOrder = state.toolOrder.includes(tool.id)
        ? state.toolOrder
        : [...state.toolOrder, tool.id];

      return {
        ...state,
        agentStatus: 'executing',
        hqAgentState: 'coding',
        toolExecutions: {
          ...state.toolExecutions,
          [tool.id]: tool
        },
        toolOrder: newOrder
      };
    }

    case 'TOOL_STREAM_STDOUT': {
      const { toolId, stdoutChunk } = event.payload;
      const existing = state.toolExecutions[toolId];
      if (!existing) return state;

      return {
        ...state,
        toolExecutions: {
          ...state.toolExecutions,
          [toolId]: {
            ...existing,
            output: (existing.output || '') + stdoutChunk
          }
        }
      };
    }

    case 'TOOL_CONCLUDED': {
      const { toolId, status, durationMs, output } = event.payload;
      const existing = state.toolExecutions[toolId];
      if (!existing) return state;

      return {
        ...state,
        agentStatus: 'reasoning',
        hqAgentState: 'thinking',
        toolExecutions: {
          ...state.toolExecutions,
          [toolId]: {
            ...existing,
            status,
            durationMs: durationMs ?? existing.durationMs,
            output: output !== undefined ? output : existing.output
          }
        }
      };
    }

    case 'DELIVERABLE_READY': {
      return {
        ...state,
        deliverable: event.payload,
        agentStatus: 'complete',
        hqAgentState: 'idle'
      };
    }

    case 'TERMINAL_RAW_STREAM': {
      const nextBuf = [...state.terminalBuffer, event.payload.chunk];
      if (nextBuf.length > TERMINAL_BUFFER_MAX_LINES) {
        nextBuf.splice(0, nextBuf.length - TERMINAL_BUFFER_MAX_LINES);
      }
      return {
        ...state,
        terminalBuffer: nextBuf
      };
    }

    case 'HQ_SIMULATION_SYNC': {
      return {
        ...state,
        hqAgentState: event.payload.agentState
      };
    }

    default:
      return state;
  }
}
