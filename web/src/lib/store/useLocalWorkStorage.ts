'use client';

export interface LocalWorkTask {
  id: string;
  title: string;
  body?: string;
  assignee: string;
  status: 'triage' | 'todo' | 'running' | 'done' | 'blocked' | 'archived';
  created_at: number;
  completed_at?: number;
  workspace_path?: string;
  is_pinned?: boolean;
}

const STORAGE_KEY_WORK_TASKS = 'lyra_web_work_tasks_v1';
const STORAGE_KEY_WORK_MSGS_PREFIX = 'lyra_web_work_msgs_';

export function getLocalWorkMessages(taskId: string): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WORK_MSGS_PREFIX + taskId);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function saveLocalWorkMessages(taskId: string, messages: any[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_WORK_MSGS_PREFIX + taskId, JSON.stringify(messages));
  } catch (e) {
    console.warn('Failed to save local work messages:', e);
  }
}

export function getLocalWorkTasks(): LocalWorkTask[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WORK_TASKS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to load local work tasks:', e);
    return [];
  }
}

export function saveLocalWorkTask(task: LocalWorkTask): void {
  if (typeof window === 'undefined') return;
  try {
    const tasks = getLocalWorkTasks();
    const existingIndex = tasks.findIndex(t => t.id === task.id);
    let updated: LocalWorkTask[];
    if (existingIndex >= 0) {
      updated = [...tasks];
      updated[existingIndex] = {
        ...updated[existingIndex],
        ...task,
      };
    } else {
      updated = [task, ...tasks];
    }
    localStorage.setItem(STORAGE_KEY_WORK_TASKS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save local work task:', e);
  }
}

export function deleteLocalWorkTask(taskId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const tasks = getLocalWorkTasks();
    const filtered = tasks.filter(t => t.id !== taskId);
    localStorage.setItem(STORAGE_KEY_WORK_TASKS, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to delete local work task:', e);
  }
}

export function updateLocalWorkTaskTitle(taskId: string, newTitle: string): void {
  if (typeof window === 'undefined') return;
  try {
    const tasks = getLocalWorkTasks();
    const updated = tasks.map(t => t.id === taskId ? { ...t, title: newTitle } : t);
    localStorage.setItem(STORAGE_KEY_WORK_TASKS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to update local work task title:', e);
  }
}

export function toggleLocalWorkTaskPin(taskId: string, isPinned: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const tasks = getLocalWorkTasks();
    const updated = tasks.map(t => t.id === taskId ? { ...t, is_pinned: isPinned } : t);
    localStorage.setItem(STORAGE_KEY_WORK_TASKS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to toggle local work task pin:', e);
  }
}
