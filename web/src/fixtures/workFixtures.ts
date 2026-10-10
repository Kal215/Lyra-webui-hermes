export type WorkStatus = 'draft' | 'queued' | 'working' | 'waiting' | 'review' | 'completed' | 'failed' | 'cancelled';
export type WorkPriority = 'low' | 'normal' | 'high' | 'urgent';

export type WorkActivityType = 'started' | 'progress' | 'file' | 'review' | 'decision' | 'completed' | 'warning' | 'error';

export interface WorkActivity {
  id: string;
  type: WorkActivityType;
  timestamp: Date;
  descriptionId: string;
  descriptionEn: string;
}

export type WorkOutputType = 'file' | 'link' | 'artifact' | 'note';

export interface WorkOutput {
  id: string;
  type: WorkOutputType;
  titleId: string;
  titleEn: string;
  url?: string;
  noteId?: string;
  noteEn?: string;
}

export interface WorkItem {
  id: string;
  titleId: string;
  titleEn: string;
  project: string;
  status: WorkStatus;
  agent: string;
  priority: WorkPriority;
  updatedAt: Date;
  attentionId?: string;
  attentionEn?: string;
  
  createdAt?: Date;
  startedAt?: Date;
  currentStepId?: string;
  currentStepEn?: string;
  progress?: number;
  attentionReasonId?: string;
  attentionReasonEn?: string;
  activities?: WorkActivity[];
  outputs?: WorkOutput[];
  instructionsId?: string;
  instructionsEn?: string;
  tags?: string[];
  failureReasonId?: string;
  failureReasonEn?: string;
}

// Generate dates relative to now to match "2 minutes ago" dynamically or we can just render hardcoded strings for this fixture.
// But using real Dates lets us implement "Sort by latest" realistically.
const now = new Date();
const subtractMinutes = (mins: number) => new Date(now.getTime() - mins * 60000);
const subtractHours = (hours: number) => new Date(now.getTime() - hours * 3600000);

export const workFixtures: WorkItem[] = [
    {
    id: 'wk-1',
    titleId: 'Buat halaman landing',
    titleEn: 'Build landing page',
    project: 'Nay\'s Cake',
    status: 'working',
    agent: 'Coder',
    priority: 'normal',
    createdAt: subtractHours(24),
    startedAt: subtractHours(2),
    updatedAt: subtractMinutes(2),
    currentStepId: 'Membangun hero responsif',
    currentStepEn: 'Building responsive hero section',
    progress: 78,
    instructionsId: 'Buat halaman landing yang responsif untuk Nay\'s Cake menggunakan sistem desain yang ada.',
    instructionsEn: 'Create a responsive landing page for Nay\'s Cake using the existing design system.',
    tags: ['frontend', 'react', 'tailwind'],
    activities: [
      { id: 'a1', type: 'progress', timestamp: subtractMinutes(2), descriptionId: 'Bagian hero selesai', descriptionEn: 'Hero section completed' },
      { id: 'a2', type: 'file', timestamp: subtractMinutes(6), descriptionId: 'Mengedit landing-page.tsx', descriptionEn: 'Editing landing-page.tsx' },
      { id: 'a3', type: 'file', timestamp: subtractMinutes(11), descriptionId: 'Komponen Hero dibuat', descriptionEn: 'Component created' },
      { id: 'a4', type: 'review', timestamp: subtractMinutes(15), descriptionId: 'Menganalisis kebutuhan halaman', descriptionEn: 'Analyzed page requirements' },
      { id: 'a5', type: 'started', timestamp: subtractHours(2), descriptionId: 'Pekerjaan dimulai', descriptionEn: 'Work started' }
    ],
    outputs: [
      { id: 'o1', type: 'link', titleId: 'Pratinjau halaman landing', titleEn: 'Landing page preview', url: '/preview' },
      { id: 'o2', type: 'file', titleId: 'landing-page.tsx', titleEn: 'landing-page.tsx', url: '#' },
      { id: 'o3', type: 'note', titleId: 'Ringkasan implementasi', titleEn: 'Implementation summary', noteId: 'Komponen responsif', noteEn: 'Responsive components' }
    ]
  },
    {
    id: 'wk-2',
    titleId: 'Tinjau API',
    titleEn: 'Review API',
    project: 'Backend authentication',
    status: 'review',
    agent: 'QA',
    priority: 'normal',
    createdAt: subtractHours(48),
    startedAt: subtractHours(5),
    updatedAt: subtractMinutes(5),
    currentStepId: 'Meninjau payload JWT',
    currentStepEn: 'Reviewing JWT payload',
    instructionsId: 'Pastikan endpoint auth mematuhi spesifikasi keamanan v2.',
    instructionsEn: 'Ensure auth endpoints comply with v2 security specs.',
    activities: [
      { id: 'a21', type: 'review', timestamp: subtractMinutes(5), descriptionId: 'Mulai tinjauan keamanan', descriptionEn: 'Started security review' },
      { id: 'a22', type: 'progress', timestamp: subtractHours(1), descriptionId: 'Menjalankan test suite', descriptionEn: 'Running test suite' }
    ],
    outputs: [
      { id: 'o21', type: 'note', titleId: 'Laporan sementara', titleEn: 'Draft report' }
    ]
  },
  {
    id: 'wk-3',
    titleId: 'Audit keamanan',
    titleEn: 'Security audit',
    project: 'Lyra infrastructure',
    status: 'working',
    agent: 'Security',
    priority: 'high',
    updatedAt: subtractMinutes(8),
  },
    {
    id: 'wk-4',
    titleId: 'Perbaiki authentication',
    titleEn: 'Fix authentication',
    project: 'Internal API',
    status: 'waiting',
    agent: 'Coder',
    priority: 'high',
    createdAt: subtractHours(20),
    startedAt: subtractHours(4),
    updatedAt: subtractMinutes(12),
    attentionId: 'Perlu keputusan',
    attentionEn: 'Needs decision',
    attentionReasonId: 'Strategi autentikasi harus dipilih sebelum pekerjaan dapat dilanjutkan.',
    attentionReasonEn: 'Authentication strategy must be selected before work can continue.',
    instructionsId: 'Perbaiki masalah sesi token JWT.',
    instructionsEn: 'Fix JWT token session issues.',
    activities: [
      { id: 'a41', type: 'warning', timestamp: subtractMinutes(12), descriptionId: 'Terblokir karena kebutuhan strategi', descriptionEn: 'Blocked on strategy requirement' }
    ]
  },
  {
    id: 'wk-5',
    titleId: 'Validasi responsive mobile',
    titleEn: 'Validate responsive mobile',
    project: 'Nay\'s Cake',
    status: 'completed',
    agent: 'QA',
    priority: 'normal',
    updatedAt: subtractHours(1),
  },
  {
    id: 'wk-6',
    titleId: 'Pemeriksaan dependency',
    titleEn: 'Dependency check',
    project: 'Lyra',
    status: 'queued',
    agent: 'Security',
    priority: 'normal',
    updatedAt: subtractHours(2),
  },
  {
    id: 'wk-7',
    titleId: 'Draft halaman produk',
    titleEn: 'Draft product page',
    project: 'Nay\'s Cake',
    status: 'draft',
    agent: 'Coder',
    priority: 'normal',
    updatedAt: subtractHours(5),
  },
    {
    id: 'wk-8',
    titleId: 'Regression test',
    titleEn: 'Regression test',
    project: 'Lyra',
    status: 'failed',
    agent: 'QA',
    priority: 'normal',
    createdAt: subtractHours(40),
    startedAt: subtractHours(25),
    updatedAt: subtractHours(24),
    failureReasonId: 'Upaya terakhir gagal selama pengujian regresi.',
    failureReasonEn: 'Latest attempt failed during regression testing.',
    instructionsId: 'Jalankan suite tes penuh untuk Rilis 1.2.',
    instructionsEn: 'Run full test suite for Release 1.2.',
    activities: [
      { id: 'a81', type: 'error', timestamp: subtractHours(24), descriptionId: 'Regresi terdeteksi di modul auth', descriptionEn: 'Regression detected in auth module' }
    ]
  }
];
