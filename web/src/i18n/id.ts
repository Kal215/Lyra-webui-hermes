export const id = {
  work: {
    title: 'Pekerjaan',
    subtitle: 'Lihat dan kelola pekerjaan yang dijalankan Lyra',
    newWork: '+ Pekerjaan Baru',
    newWorkNotice: 'Alur pembuatan Pekerjaan Baru akan diimplementasikan pada Phase 2B.',
    
    newWorkForm: {
        settings: 'Pengaturan',
        optional: 'Opsional',
        backNav: 'Pekerjaan',
        title: 'Pekerjaan Baru',
        subtitle: 'Berikan pekerjaan baru kepada Lyra',
        instruction: 'Apa yang harus Lyra kerjakan?',
        instructionPlaceholder: 'Jelaskan pekerjaan yang ingin diselesaikan...',
        instructionRequired: 'Jelaskan pekerjaan yang ingin dibuat.',
        workTitle: 'Judul',
        workTitlePlaceholder: 'Nama singkat pekerjaan',
        project: 'Proyek',
        agent: 'Agen',
        autoAssign: 'Pilih otomatis',
        create: 'Buat Pekerjaan',
        cancel: 'Batal',
        discardTitle: 'Buang pekerjaan baru?',
        discardMessage: 'Anda memiliki rincian yang belum disimpan. Yakin ingin membuangnya?',
        discardConfirm: 'Buang',
        discardKeep: 'Terus Mengedit',
        previewReady: 'Pratinjau pekerjaan siap',
        previewDisclaimer: 'Ini hanya pratinjau antarmuka.\nBelum ada pekerjaan yang dikirim ke Hermes.',
        previewEdit: 'Ubah',
        previewBack: 'Kembali ke Pekerjaan',
        projects: {
            none: 'Tidak ada proyek',
            naysCake: "Demo Store",
            lyra: 'Lyra',
            internalApi: 'Internal API'
        },
    agents: {
            auto: 'Pilih otomatis',
            coder: 'Coder',
            qa: 'QA',
            security: 'Security'
        },
    shortcutCmd: 'Cmd+Enter untuk mengirim',
        shortcutCtrl: 'Ctrl+Enter untuk mengirim',
  },
    searchPlaceholder: 'Cari pekerjaan...',
    filter: 'Filter',
    sort: 'Urutkan',
    noResult: 'Tidak ada pekerjaan yang cocok.',
    clearFilters: 'Hapus filter',
    apply: 'Terapkan',
    close: 'Tutup',
    
      detail: {
      overview: 'Ringkasan',
      activity: 'Aktivitas',
      output: 'Hasil',
      details: 'Detail',
      currentStep: 'Langkah saat ini',
      progress: 'Progres',
      recentActivity: 'Aktivitas terkini',
      viewAllActivity: 'Lihat semua aktivitas',
      noOutput: 'Belum ada hasil.',
      project: 'Proyek / Konteks',
      agent: 'Agen yang ditugaskan',
      created: 'Dibuat',
      started: 'Dimulai',
      lastUpdated: 'Terakhir diperbarui',
      instructions: 'Instruksi',
      tags: 'Label',
      back: 'Pekerjaan',
      outputTypes: {
        file: 'Berkas',
        link: 'Tautan',
        artifact: 'Artefak',
        note: 'Catatan'
      },
      actions: {
      view: 'Lihat →',
      open: 'Buka →'
    },
    statusLabel: 'Status',
    agentLabel: 'Agen',
    priorityLabel: 'Prioritas',
    priority: {
          low: 'Rendah',
          normal: 'Normal',
          high: 'Tinggi',
          urgent: 'Mendesak'
        },
    allLabel: 'Semua',

    sortLatest: 'Terbaru diperbarui',
    sortOldest: 'Terlama diperbarui',
    sortTitleAZ: 'Judul A–Z',
    updatedAt: 'Diperbarui',
    tabs: {
      all: 'Semua',
      active: 'Aktif',
      waiting: 'Menunggu',
      review: 'Meninjau',
      completed: 'Selesai'
    },
    status: {
      draft: 'Draf',
      queued: 'Antrean',
      working: 'Bekerja',
      waiting: 'Menunggu',
      review: 'Meninjau',
      completed: 'Selesai',
      failed: 'Gagal',
      cancelled: 'Dibatalkan'
    },
    attention: {
      needsDecision: 'Perlu keputusan'
    },
    detailPlaceholder: 'Detail pekerjaan akan dibuat pada Phase 2B.',
    backToWork: 'Kembali ke Pekerjaan'
  },
  },
  agents: {
    title: 'Agen',
    subtitle: 'Pantau agen yang tersedia di Lyra',
    searchPlaceholder: 'Cari agen...',
    noResult: 'Tidak ada agen yang cocok.',
    totalAgents: 'Total Agen',
    available: 'Tersedia',
    statusRuntime: 'Status runtime',
    notAvailable: 'Belum tersedia',
    unavailable: 'Tidak tersedia',
    hermesProfile: 'Profil Hermes',
    liveRegistryActive: "HERMES LIVE",
    liveRunUnavailable: "HERMES LIVE OBSERVER - Siap, menunggu aktivitas Hermes",
    dataUnavailable: 'Data agen Hermes tidak tersedia',
    retry: 'Coba lagi',
    roles: {
      hermes: 'Profil Hermes',
      coder: 'Pengembangan dan implementasi',
      qa: 'Pengujian dan quality assurance',
      security: 'Audit dan keamanan'
    },
    status: {
      Tersedia: 'Tersedia',
      working: 'Bekerja',
      reviewing: 'Meninjau',
      idle: 'Siaga',
      waiting: 'Menunggu',
      offline: 'Offline',
      error: 'Bermasalah'
    },
    activeWork: {
      zero: 'Tidak ada pekerjaan aktif',
      one: '1 pekerjaan aktif',
      other: '{count} pekerjaan aktif'
    },
    filters: {
      all: 'Semua',
      available: 'Tersedia',
      active: 'Aktif',
      idle: 'Siaga',
      issues: 'Bermasalah'
    },
    summary: {
      total: 'Total Agen',
      active: 'Aktif',
      idle: 'Siaga',
      issues: 'Perlu Perhatian'
    },
    currentWorkLabel: 'Saat ini',
    backNav: 'Agen',
    placeholderDetail: 'Detail agen akan dibuat pada Phase 3B.'
  },
  activity: {
    title: 'Aktivitas',
    placeholder: 'Area ini akan dirancang pada fase berikutnya.'
  },

  nav: {
    home: 'Beranda',
    work: 'Pekerjaan',
    agents: 'Agen',
    world: 'Dunia',
    systems: 'Sistem',
    activity: 'Aktivitas',
    settings: 'Pengaturan',
  },
  dash: {
    currentWork: 'Pekerjaan Aktif',
    recentActivity: 'Aktivitas Terbaru',
    newWork: 'Pekerjaan Baru',
    
    
    search: 'Cari di Lyra',
  },
  status: {
    activeWork: 'Pekerjaan Aktif',
    attention: 'Perlu Perhatian',
    healthy: 'Normal',
    working: 'Bekerja',
    reviewing: 'Meninjau',
    running: 'Berjalan',
    idle: 'Siaga',
    online: 'Online',
    open: 'Buka',
    allNormal: 'Semua sistem normal',
  },
  greet: {
    morning: 'Selamat pagi',
    noon: 'Selamat siang',
    afternoon: 'Selamat sore',
    night: 'Selamat malam',
  },
  fixture: {
    buildLandingPage: 'Buat halaman landing',
        setupAuthentication: 'Siapkan autentikasi',
    writeApiIntegration: 'Buat integrasi API',
    reviewApi: 'Tinjau API',
    securityAudit: 'Audit keamanan',
    coderCompleted: 'Coder menyelesaikan tugas',
    providerRecovered: 'Provider kembali normal',
    qaStarted: 'QA mulai meninjau',
  },
  settings: {
    appearance: 'Penampilan',
    mode: 'Mode',
    light: 'Terang',
    dark: 'Gelap',
    surface: 'Permukaan',
    stone: 'Stone',
    pearl: 'Pearl',
    sand: 'Sand',
    language: 'Bahasa',
    sound: 'Suara Antarmuka',
    workspaceTheme: 'Workspace coding',
        workspaceThemeDesc: 'Pilih tampilan editor dan terminal Live.',
    workspaceFollow: 'Ikuti Lyra',
    workspaceDark: 'Gelap',
    workspacePaper: 'Kertas Hangat',
    on: 'Aktif',
    off: 'Mati',
    volume: 'Volume',
    reset: 'Kembalikan Pengaturan Awal'
  },

  agentDetail: {
    currentActivity: 'Aktivitas saat ini',
    lastActivity: 'Aktivitas terakhir',
    runningCommand: 'Menjalankan',
    updatingFile: 'Memperbarui',
    completed: 'Selesai',
    waitingActivity: 'Menunggu aktivitas',

    back: 'Kembali',
    pauseBtn: 'Jeda',
    playBtn: 'Lanjutkan',
    replayBtn: 'Ulangi',
    autoScroll: 'Gulir otomatis',
        returnToLive: 'Kembali ke Live',
    terminal: 'Terminal',
    currentFile: 'File saat ini',
    metricsStatus: 'Status',
    metricsChecks: 'Pemeriksaan',
    metricsFiles: 'File',
    metricsLines: 'Baris',
    fileEmpty: '// Menunggu operasi file...',
    justNow: 'Baru saja',
    activeTasksSuffix: 'Aktif',
    currentWorkLabel: 'Pekerjaan saat ini',
    currentWork: 'Pekerjaan saat ini',
    activeWorkCount: 'Jumlah pekerjaan aktif',
    notFound: 'Agen tidak ditemukan',
    tabs: {
      overview: 'Ringkasan',
      live: 'Live',
      files: 'File',
      changes: 'Perubahan',
      history: 'Riwayat'
    },
    status: {
      working: 'Bekerja',
      idle: 'Siaga',
      completed: 'Selesai',
      completed_issue: 'Selesai dengan masalah',
      failed: 'Gagal'
    },
    actions: {
      idle: 'Siaga',
      analyze: 'Sedang menganalisis struktur proyek',
      edit: 'Sedang mengedit {file}',
      run_tsc: 'Menjalankan TypeScript',
      run_eslint: 'Menjalankan ESLint',
      run_tests: 'Menjalankan Playwright',
      completed: 'Simulasi selesai',
      paused: 'Simulasi dijeda'
}
}
};