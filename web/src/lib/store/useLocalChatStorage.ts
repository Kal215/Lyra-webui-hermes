'use client';

export interface LocalChatSession {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
  is_pinned?: boolean;
}

export interface LocalChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  rawContent?: string;
  tools?: any[];
  reasoning?: {
    startTime: number;
    endTime: number | null;
    text: string;
  } | null;
  attachments?: any[];
  timestamp: number;
  variants?: string[];
  variantIndex?: number;
}

const STORAGE_KEY_SESSIONS = 'lyra_web_chat_sessions_v1';
const STORAGE_KEY_MESSAGES_PREFIX = 'lyra_web_chat_msgs_';

export function getLocalChatSessions(): LocalChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to load local chat sessions:', e);
    return [];
  }
}

export function saveLocalChatSession(session: LocalChatSession): void {
  if (typeof window === 'undefined') return;
  try {
    const sessions = getLocalChatSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    let updated: LocalChatSession[];
    if (existingIndex >= 0) {
      updated = [...sessions];
      updated[existingIndex] = {
        ...updated[existingIndex],
        ...session,
        updated_at: session.updated_at || Date.now()
      };
    } else {
      updated = [session, ...sessions];
    }
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save local chat session:', e);
  }
}

export function deleteLocalChatSession(sessionId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const sessions = getLocalChatSessions();
    const filtered = sessions.filter(s => s.id !== sessionId);
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(filtered));
    localStorage.removeItem(`${STORAGE_KEY_MESSAGES_PREFIX}${sessionId}`);
  } catch (e) {
    console.warn('Failed to delete local chat session:', e);
  }
}

export function renameLocalChatSession(sessionId: string, newTitle: string): void {
  if (typeof window === 'undefined') return;
  try {
    const sessions = getLocalChatSessions();
    const updated = sessions.map(s => s.id === sessionId ? { ...s, title: newTitle, updated_at: Date.now() } : s);
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to rename local chat session:', e);
  }
}

export function pinLocalChatSession(sessionId: string, pin: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const sessions = getLocalChatSessions();
    const updated = sessions.map(s => s.id === sessionId ? { ...s, is_pinned: pin, updated_at: Date.now() } : s);
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to pin local chat session:', e);
  }
}

export function getLocalChatMessages(sessionId: string): LocalChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_MESSAGES_PREFIX}${sessionId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn(`Failed to load local messages for ${sessionId}:`, e);
    return [];
  }
}

export function saveLocalChatMessages(sessionId: string, messages: LocalChatMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY_MESSAGES_PREFIX}${sessionId}`, JSON.stringify(messages));
    
    // Also update session updated_at
    const sessions = getLocalChatSessions();
    const existing = sessions.find(s => s.id === sessionId);
    if (existing) {
      saveLocalChatSession({
        ...existing,
        updated_at: Date.now()
      });
    }
  } catch (e) {
    console.warn(`Failed to save local messages for ${sessionId}:`, e);
  }
}
