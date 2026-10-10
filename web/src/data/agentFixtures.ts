export type AgentStatus = 'working' | 'reviewing' | 'idle' | 'waiting' | 'offline' | 'error';

export interface AgentFixture {
  id: string;
  name: string;
  roleKey: 'coder' | 'qa' | 'security';
  status: AgentStatus;
  activeWorkCount: number;
  currentWorkKey: string | null; // e.g. 'buildLandingPage' 
  iconKey: 'code' | 'qa' | 'security';
}

// DESIGN FIXTURES — NOT LIVE HERMES DATA
export const AGENT_FIXTURES: AgentFixture[] = [
  {
    id: 'ag-coder',
    name: 'Coder',
    roleKey: 'coder',
    status: 'working',
    activeWorkCount: 2,
    currentWorkKey: 'buildLandingPage',
    iconKey: 'code'
  },
  {
    id: 'ag-qa',
    name: 'QA',
    roleKey: 'qa',
    status: 'reviewing',
    activeWorkCount: 1,
    currentWorkKey: 'reviewApi',
    iconKey: 'qa'
  },
  {
    id: 'ag-security',
    name: 'Security',
    roleKey: 'security',
    status: 'idle',
    activeWorkCount: 0,
    currentWorkKey: null,
    iconKey: 'security'
  }
];
