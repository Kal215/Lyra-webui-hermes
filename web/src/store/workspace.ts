import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AgentLiveTyping {
  active: boolean;
  agentName: string;
  agentRole: string;
  filePath: string;
  diffOrContent?: string;
  speedMs?: number;
}

interface WorkspaceState {
  currentWorkspace: string;
  setCurrentWorkspace: (dir: string) => void;
  activeFilePath: string | null;
  openFileInWorkspace: (path: string) => void;
  liveTyping: AgentLiveTyping | null;
  setLiveTyping: (typing: AgentLiveTyping | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentWorkspace: '',
      setCurrentWorkspace: (dir) => set({ currentWorkspace: dir }),
      activeFilePath: null,
      openFileInWorkspace: (path) => set({ activeFilePath: path }),
      liveTyping: null,
      setLiveTyping: (typing) => set({ liveTyping: typing })
    }),
    {
      name: 'lyra-workspace-storage'
    }
  )
);
