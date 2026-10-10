// DESIGN FIXTURE ONLY - DO NOT USE AS LIVE DATA
// This file isolates mock data for Lyra Phase 1

export const currentWorkFixture = [
  {
    id: '1',
    title: 'Build landing page',
    agent: 'Coder',
    state: 'Working',
    progress: 68,
  },
  {
    id: '2',
    title: 'Review API',
    agent: 'QA',
    state: 'Reviewing',
    progress: null,
  },
  {
    id: '3',
    title: 'Security audit',
    agent: 'Security',
    state: 'Running',
    progress: null,
  },
];

export const agentsFixture = [
  { id: '1', name: 'Coder', state: 'Working' },
  { id: '2', name: 'QA', state: 'Reviewing' },
  { id: '3', name: 'Security', state: 'Idle' },
];

export const systemsFixture = [
  { id: '1', name: 'Server', state: 'Healthy' },
  { id: '2', name: 'AI Provider', state: 'Healthy' },
  { id: '3', name: 'Storage', state: '55%' },
  { id: '4', name: 'Worker', state: 'Online' },
];

export const recentActivityFixture = [
  { id: '1', time: '12:48', description: 'Coder completed a task' },
  { id: '2', time: '12:45', description: 'Provider recovered' },
  { id: '3', time: '12:41', description: 'QA started review' },
  { id: '4', time: '11:30', description: 'System backup completed' },
  { id: '5', time: '10:15', description: 'Riskal logged in' },
];