import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Mode = 'light' | 'dark';
export type Surface = 'stone' | 'pearl' | 'sand';
export type WorkspaceTheme = 'light' | 'dark' | 'vscode' | 'paper';

interface AppearanceStore {
  mode: Mode;
  surface: Surface;
  workspaceTheme: WorkspaceTheme;
  setMode: (mode: Mode) => void;
  setSurface: (surface: Surface) => void;
  setWorkspaceTheme: (theme: WorkspaceTheme) => void;
  reset: () => void;
}

export const useAppearanceStore = create<AppearanceStore>()(
  persist(
    (set) => ({
      mode: 'light',
      surface: 'stone',
      workspaceTheme: 'light',
      setMode: (mode) => {
        set({ mode });
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-mode', mode);
        }
      },
      setWorkspaceTheme: (workspaceTheme) => {
        set({ workspaceTheme });
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-workspace', workspaceTheme);
        }
      },
      setSurface: (surface) => {
        set({ surface });
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-surface', surface);
        }
      },
      reset: () => {
        set({ mode: 'light', surface: 'stone', workspaceTheme: 'light' });
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-mode', 'light');
          document.documentElement.setAttribute('data-surface', 'stone');
          document.documentElement.setAttribute('data-workspace', 'light');
        }
      }
    }),
    { name: 'lyra-appearance' }
  )
);
