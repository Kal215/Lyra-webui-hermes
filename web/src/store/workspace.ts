import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WorkspaceState {
  currentWorkspace: string;
  setCurrentWorkspace: (dir: string) => void;
  activeFilePath: string | null;
  openFileInWorkspace: (path: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentWorkspace: '',
      setCurrentWorkspace: (dir) => set({ currentWorkspace: dir }),
      activeFilePath: null,
      openFileInWorkspace: (path) => set({ activeFilePath: path })
    }),
    {
      name: 'lyra-workspace-storage'
    }
  )
);
