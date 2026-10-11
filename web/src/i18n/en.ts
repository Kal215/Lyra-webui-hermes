export const en = {
  work: {
    title: 'Work',
    subtitle: 'View and manage work handled by Lyra',
    newWork: '+ New Work',
    newWorkNotice: 'The New Work creation flow will be implemented in Phase 2B.',
    
    newWorkForm: {
        settings: 'Settings',
        optional: 'Optional',
        backNav: 'Work',
        title: 'New Work',
        subtitle: 'Give Lyra a new piece of work',
        instruction: 'What should Lyra do?',
        instructionPlaceholder: 'Describe what you want Lyra to accomplish...',
        instructionRequired: 'Describe the work you want to create.',
        workTitle: 'Title',
        workTitlePlaceholder: 'Short work name',
        project: 'Project',
        agent: 'Agent',
        autoAssign: 'Auto assign',
        create: 'Create Work',
        cancel: 'Cancel',
        discardTitle: 'Discard new work?',
        discardMessage: 'You have unsaved details. Are you sure you want to discard them?',
        discardConfirm: 'Discard',
        discardKeep: 'Keep Editing',
        previewReady: 'Work preview ready',
        previewDisclaimer: 'This is an interface preview only.\nNo work has been sent to Hermes.',
        previewEdit: 'Edit',
        previewBack: 'Back to Work',
        projects: {
            none: 'No project',
            naysCake: "Demo Store",
            lyra: 'Lyra',
            internalApi: 'Internal API'
        },
    agents: {
            auto: 'Auto assign',
            coder: 'Coder',
            qa: 'QA',
            security: 'Security'
        },
    shortcutCmd: 'Cmd+Enter to submit',
        shortcutCtrl: 'Ctrl+Enter to submit',
  },
    searchPlaceholder: 'Search work...',
    filter: 'Filter',
    sort: 'Sort',
    noResult: 'No matching work found.',
    clearFilters: 'Clear filters',
    apply: 'Apply',
    close: 'Close',
    
      detail: {
      overview: 'Overview',
      activity: 'Activity',
      output: 'Output',
      details: 'Details',
      currentStep: 'Current step',
      progress: 'Progress',
      recentActivity: 'Recent activity',
      viewAllActivity: 'View all activity',
      noOutput: 'No output available yet.',
      project: 'Project / Context',
      agent: 'Assigned agent',
      created: 'Created',
      started: 'Started',
      lastUpdated: 'Last updated',
      instructions: 'Instructions',
      tags: 'Tags',
      back: 'Work',
      outputTypes: {
        file: 'File',
        link: 'Link',
        artifact: 'Artifact',
        note: 'Note'
      },
      actions: {
      view: 'View →',
      open: 'Open →'
    },
    statusLabel: 'Status',
    agentLabel: 'Agent',
    priorityLabel: 'Priority',
    priority: {
          low: 'Low',
          normal: 'Normal',
          high: 'High',
          urgent: 'Urgent'
        },
    allLabel: 'All',

    sortLatest: 'Latest updated',
    sortOldest: 'Oldest updated',
    sortTitleAZ: 'Title A–Z',
    updatedAt: 'Updated',
    tabs: {
      all: 'All',
      active: 'Active',
      waiting: 'Waiting',
      review: 'Review',
      completed: 'Completed'
    },
    status: {
      draft: 'Draft',
      queued: 'Queued',
      working: 'Working',
      waiting: 'Waiting',
      review: 'Review',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled'
    },
    attention: {
      needsDecision: 'Needs decision'
    },
    detailPlaceholder: 'Work details will be created in Phase 2B.',
    backToWork: 'Back to Work'

  },

  },
  agents: {
    title: 'Agents',
    subtitle: 'Monitor available agents in Lyra',
    searchPlaceholder: 'Search agents...',
    noResult: 'No matching agents.',
    totalAgents: 'Total Agents',
    available: 'Available',
    statusRuntime: 'Runtime status',
    notAvailable: 'Not available',
    unavailable: 'Unavailable',
    hermesProfile: 'Hermes Profile',
    liveRegistryActive: "HERMES LIVE",
    liveRunUnavailable: "HERMES LIVE OBSERVER - Ready, waiting for Hermes activity",
    dataUnavailable: 'Hermes agent data is unavailable',
    retry: 'Try again',
    roles: {
      hermes: 'Hermes Profile',
      coder: 'Development and implementation',
      qa: 'Testing and quality assurance',
      security: 'Audit and security'
    },
    status: {
      Tersedia: 'Available',
      working: 'Working',
      reviewing: 'Reviewing',
      idle: 'Idle',
      waiting: 'Waiting',
      offline: 'Offline',
      error: 'Issue'
    },
    activeWork: {
      zero: 'No active work',
      one: '1 active work',
      other: '{count} active work'
    },
    filters: {
      all: 'All',
      available: 'Available',
      active: 'Active',
      idle: 'Idle',
      issues: 'Issues'
    },
    summary: {
      total: 'Total Agents',
      active: 'Active',
      idle: 'Idle',
      issues: 'Needs Attention'
    },
    currentWorkLabel: 'Current',
    backNav: 'Agents',
    placeholderDetail: 'Agent details will be built in Phase 3B.'
  },
  activity: {
    title: 'Activity',
    placeholder: 'This area will be designed in the next phase.'
  },

  nav: {
    home: 'Home',
    work: 'Work',
    agents: 'Agents',
    world: 'World',
    systems: 'Systems',
    activity: 'Activity',
    settings: 'Settings',
  },
  dash: {
    currentWork: 'Current Work',
    recentActivity: 'Recent Activity',
    newWork: 'New Work',
    
    
    search: 'Search Lyra',
  },
  status: {
    activeWork: 'Active Work',
    attention: 'Attention',
    healthy: 'Healthy',
    working: 'Working',
    reviewing: 'Reviewing',
    running: 'Running',
    idle: 'Idle',
    online: 'Online',
    open: 'Open',
    allNormal: 'All systems normal',
  },
  greet: {
    morning: 'Good morning',
    noon: 'Good afternoon', // Fallback if requested
    afternoon: 'Good afternoon',
    night: 'Good evening',
  },
  fixture: {
    buildLandingPage: 'Build landing page',
        setupAuthentication: 'Set up authentication',
    writeApiIntegration: 'Build API integration',
    reviewApi: 'Review API',
    securityAudit: 'Security audit',
    coderCompleted: 'Coder completed a task',
    providerRecovered: 'Provider recovered',
    qaStarted: 'QA started reviewing',
  },
  settings: {
    appearance: 'Appearance',
    mode: 'Mode',
    light: 'Light',
    dark: 'Dark',
    surface: 'Surface',
    stone: 'Stone',
    pearl: 'Pearl',
    sand: 'Sand',
    language: 'Language',
    sound: 'Interface Sound',
    workspaceTheme: 'Coding workspace',
        workspaceThemeDesc: 'Choose the appearance of the Live editor and terminal.',
    workspaceFollow: 'Follow Lyra',
    workspaceDark: 'Dark',
    workspacePaper: 'Warm Paper',
    on: 'On',
    off: 'Off',
    volume: 'Volume',
    reset: 'Restore Defaults'
  },

  agentDetail: {
    currentActivity: 'Current activity',
    lastActivity: 'Last activity',
    runningCommand: 'Running',
    updatingFile: 'Updating',
    completed: 'Completed',
    waitingActivity: 'Waiting for activity',

    back: 'Back',
    pauseBtn: 'Pause',
    playBtn: 'Resume',
    replayBtn: 'Replay',
    autoScroll: 'Auto-scroll',
        returnToLive: 'Return to Live',
    terminal: 'Terminal',
    currentFile: 'CURRENT FILE',
    metricsStatus: 'Status',
    metricsChecks: 'Checks',
    metricsFiles: 'Files',
    metricsLines: 'Lines',
    fileEmpty: '// Waiting for file operations...',
    justNow: 'Just now',
    activeTasksSuffix: 'Active',
    currentWorkLabel: 'Current work',
    currentWork: 'Current Work',
    activeWorkCount: 'Active Work Count',
    notFound: 'Agent not found',
    tabs: {
      overview: 'Overview',
      live: 'Live',
      files: 'Files',
      changes: 'Changes',
      history: 'History'
    },
    status: {
      working: 'Working',
      idle: 'Idle',
      completed: 'Completed',
      completed_issue: 'Completed with issues',
      failed: 'Failed'
    },
    actions: {
      idle: 'Idle',
      analyze: 'Analyzing project structure',
      edit: 'Editing {file}',
      run_tsc: 'Running TypeScript',
      run_eslint: 'Running ESLint',
      run_tests: 'Running Playwright',
      completed: 'Simulation finished',
      paused: 'Simulation paused'
}
}
};