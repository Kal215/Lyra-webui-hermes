'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation, useI18nStore } from '@/i18n';
import { formatTimeAgo } from '@/utils/time';
import { ArrowLeft, ExternalLink, Box, Terminal, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { NeoSegmentedControl } from '@/components/NeoSegmentedControl';
import { NeoPanel } from '@/components/NeoPanel';
import { NeoButton } from '@/components/NeoButton';

type Tab = 'overview' | 'activity' | 'output' | 'details';

export default function WorkDetailPage() {
  const t = useTranslation();
  const { language } = useI18nStore();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [work, setWork] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWork = async () => {
      try {
        const res = await fetch(`/api/work/${id}`);
        const json = await res.json();
        if (json.success && json.data) {
          setWork(json.data);
        } else {
          setError(json.error || 'Failed to load');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchWork();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-lyra-muted">
        <div className="w-8 h-8 rounded-full border-2 border-lyra-text/20 border-t-lyra-text animate-spin mb-4" />
        <h1 className="text-sm">{language === 'en' ? 'Loading Work...' : 'Memuat Pekerjaan...'}</h1>
      </div>
    );
  }

  if (error || !work || !work.task) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-lyra-muted">
        <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
        <h1 className="text-xl font-medium mb-4">{language === 'en' ? 'Work not found' : 'Pekerjaan tidak ditemukan'}</h1>
        <NeoButton onClick={() => router.push('/work')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === 'en' ? 'Back to Work' : 'Kembali ke Pekerjaan'}
        </NeoButton>
      </div>
    );
  }

  const task = work.task;
  const statusRaw = task.status;
  
  // Real Hermes Kanban status mapping
  // triage, todo, ready -> waiting
  // running -> working
  // done -> completed
  // blocked -> failed
  // archived -> cancelled
  let mappedStatus = 'unknown';
  if (['triage', 'todo', 'ready', 'scheduled'].includes(statusRaw)) mappedStatus = 'waiting';
  else if (statusRaw === 'running') mappedStatus = 'working';
  else if (statusRaw === 'done') mappedStatus = 'completed';
  else if (statusRaw === 'blocked') mappedStatus = 'failed';
  else if (statusRaw === 'archived') mappedStatus = 'cancelled';

  const formatStatus = (st: string) => {
    switch (st) {
      case 'waiting': return language === 'en' ? 'Waiting' : 'Menunggu';
      case 'working': return language === 'en' ? 'Running' : 'Berjalan';
      case 'completed': return language === 'en' ? 'Completed' : 'Selesai';
      case 'failed': return language === 'en' ? 'Failed' : 'Gagal';
      case 'cancelled': return language === 'en' ? 'Cancelled' : 'Dibatalkan';
      default: return language === 'en' ? 'Unknown' : 'Tidak diketahui';
    }
  };

  const getStatusColor = (st: string) => {
    switch (st) {
      case 'working': return 'bg-blue-500';
      case 'waiting': return 'bg-amber-500';
      case 'completed': return 'bg-emerald-500';
      case 'failed': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getRunId = () => {
    if (work.runs && work.runs.length > 0 && work.runs[0].metadata) {
      return work.runs[0].metadata.worker_session_id;
    }
    return null;
  };
  const runId = getRunId();

  return (
    <div className="max-w-5xl mx-auto pb-12 px-4 md:px-0">
      {/* Header */}
      <div className="mb-6">
        <button 
          onClick={() => router.push('/work')}
          className="flex items-center text-sm text-lyra-muted hover:text-lyra-text transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          {language === 'id' ? 'Kembali' : 'Back'}
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-lyra-text leading-tight mb-1">{task.title}</h1>
            <p className="text-sm text-lyra-muted mb-3">{task.id}</p>
          </div>
          <div className="flex gap-2">
            <NeoButton onClick={() => router.push(`/workspace?activeAgent=${encodeURIComponent(task.assignee || 'default')}`)} className="px-4 py-2">
              <ExternalLink className="w-4 h-4 mr-2 text-emerald-400" />
              {language === 'en' ? 'Open in Workspace' : 'Buka di Workspace'}
            </NeoButton>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-y-1 gap-x-0 text-sm">
          <div className="flex items-center gap-1.5 after:content-['•'] after:mx-2 after:text-lyra-border/30">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(mappedStatus)}`} />
            <span className="text-lyra-text">{formatStatus(mappedStatus)}</span>
          </div>
          <div className="flex items-center after:content-['•'] after:mx-2 after:text-lyra-border/30 text-lyra-muted">
            {task.assignee}
          </div>
          <div className="flex items-center text-lyra-muted">
            {task.created_at ? formatTimeAgo(task.created_at, language) : ''}
          </div>
        </div>
      </div>

            {/* Tabs */}
      <div className="flex overflow-x-auto no-scrollbar space-x-2 mb-6 p-1 bg-lyra-bg/50 backdrop-blur-md rounded-xl border border-lyra-glass-border shadow-neo-inner-light">
        <NeoSegmentedControl
          value={activeTab}
          onChange={(val: any) => setActiveTab(val)}
          options={(["overview", "activity", "output", "details"] as const).map(tab => ({
            value: tab,
            label: language === 'id' 
              ? (tab === 'overview' ? 'Ringkasan' : tab === 'activity' ? 'Aktivitas' : tab === 'output' ? 'Hasil Output' : 'Detail')
              : (tab === 'overview' ? 'Overview' : tab === 'activity' ? 'Activity' : tab === 'output' ? 'Output' : 'Details')
          }))}
        />
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'overview' && (
          <OverviewTab task={task} mappedStatus={mappedStatus} onViewActivity={() => setActiveTab('activity')} language={language} />
        )}
        {activeTab === 'activity' && <ActivityTab runId={runId} language={language} />}
        {activeTab === 'output' && <OutputTab latestSummary={work.latest_summary} language={language} />}
        {activeTab === 'details' && <DetailsTab task={task} mappedStatus={mappedStatus} runId={runId} language={language} />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lyra-lg text-sm font-medium transition-all whitespace-nowrap ${
        active 
          ? 'bg-lyra-surface shadow-neo-inset text-lyra-text' 
          : 'text-lyra-muted hover:text-lyra-text hover:bg-lyra-surface/50'
      }`}
    >
      {children}
    </button>
  );
}

function OverviewTab({ task, mappedStatus, onViewActivity, language }: any) {
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1 space-y-6">
        
        {/* State Panels */}
        {mappedStatus === 'waiting' && (
          <NeoPanel className="border-l-2 border-l-amber-500 p-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-500/90 mb-1">
                  {language === 'en' ? 'Waiting in Queue' : 'Menunggu Antrean'}
                </h3>
                <p className="text-sm text-lyra-text/80">
                  {language === 'en' ? 'This task is waiting to be dispatched.' : 'Tugas ini menunggu untuk dieksekusi.'}
                </p>
              </div>
            </div>
          </NeoPanel>
        )}

        {mappedStatus === 'failed' && (
          <NeoPanel className="border-l-2 border-l-red-500 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-500/90 mb-1">
                  {language === 'en' ? 'Failed / Blocked' : 'Gagal / Diblokir'}
                </h3>
                <p className="text-sm text-lyra-text/80">
                  {language === 'en' ? 'Task execution encountered an error.' : 'Eksekusi tugas mengalami kegagalan.'}
                </p>
              </div>
            </div>
          </NeoPanel>
        )}

        {mappedStatus === 'completed' && (
          <NeoPanel className="border-l-2 border-l-emerald-500 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-emerald-500/90 mb-1">
                  {language === 'en' ? 'Completed' : 'Selesai'}
                </h3>
                <p className="text-sm text-lyra-text/80">
                  {language === 'en' ? 'This work has been successfully completed.' : 'Pekerjaan ini telah berhasil diselesaikan.'}
                </p>
              </div>
            </div>
          </NeoPanel>
        )}

        {/* Task Body */}
        <NeoPanel className="p-5">
          <h3 className="text-xs font-medium text-lyra-muted uppercase tracking-wider mb-2">
            {language === 'en' ? 'Instructions' : 'Instruksi'}
          </h3>
          <div className="text-lyra-text text-sm whitespace-pre-wrap">{task.body}</div>
        </NeoPanel>
      </div>

      <div className="w-full md:w-64 space-y-4">
        <NeoPanel className="p-4 flex flex-col gap-3">
          <h3 className="text-sm font-medium text-lyra-text border-b border-lyra-border/10 pb-2">
            {language === 'en' ? 'Info' : 'Info'}
          </h3>
          <div className="text-sm">
            <span className="text-lyra-muted block text-xs">{language === 'id' ? 'Agen' : 'Assignee'}</span>
            <span className="text-lyra-text">{task.assignee}</span>
          </div>
          <div className="text-sm">
            <span className="text-lyra-muted block text-xs">{language === 'id' ? 'Prioritas' : 'Priority'}</span>
            <span className="text-lyra-text">{task.priority === 0 ? (language === 'id' ? 'Normal' : 'Normal') : task.priority > 0 ? (language === 'id' ? 'Tinggi' : 'High') : (language === 'id' ? 'Rendah' : 'Low')}</span>
          </div>
        </NeoPanel>
      </div>
    </div>
  );
}

function ActivityTab({ runId, language }: any) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch('/api/activity');
        const json = await res.json();
        if (json.activities) {
          // Filter by runId or session_id (approximate mapping or all recent)
          // If we have a specific runId, filter it:
          let filtered = json.activities;
          if (runId) {
            filtered = json.activities.filter((a: any) => a.runId === runId || a.runId === 'hermes-native');
          }
          setActivities(filtered);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [runId]);

  if (loading) {
    return <div className="p-8 text-center text-sm text-lyra-muted">{language === 'en' ? 'Loading activity...' : 'Memuat aktivitas...'}</div>;
  }

  if (activities.length === 0) {
    return (
      <NeoPanel className="p-8 text-center border border-dashed border-lyra-border/20">
        <Terminal className="w-8 h-8 mx-auto text-lyra-muted mb-3 opacity-50" />
        <h3 className="text-lyra-text font-medium mb-1">
          {language === 'en' ? 'No Activity Yet' : 'Belum Ada Aktivitas'}
        </h3>
        <p className="text-sm text-lyra-muted">
          {language === 'en' ? 'This task has not produced observation records yet.' : 'Tugas ini belum menghasilkan rekaman observasi.'}
        </p>
      </NeoPanel>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((act) => (
        <NeoPanel key={act.id} className="p-4 flex gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-lyra-text text-sm">{act.operation}</span>
              <span className="text-xs text-lyra-muted px-2 py-0.5 bg-lyra-surface-inset rounded-full shadow-neo-inset">
                {act.type}
              </span>
            </div>
            <div className="text-sm text-lyra-text/80 font-mono text-xs p-2 bg-lyra-background/50 rounded mt-2 overflow-x-auto">
              {act.target}
            </div>
          </div>
        </NeoPanel>
      ))}
    </div>
  );
}

function OutputTab({ latestSummary, language }: any) {
  if (!latestSummary) {
    return (
      <NeoPanel className="p-12 text-center border border-dashed border-lyra-border/20">
        <Box className="w-10 h-10 mx-auto text-lyra-muted mb-4 opacity-50" />
        <h3 className="text-lyra-text font-medium mb-1">
          {language === 'en' ? 'Output not available yet.' : 'Output belum tersedia.'}
        </h3>
        <p className="text-sm text-lyra-muted max-w-sm mx-auto">
          {language === 'en' ? 'No final deliverable recorded at this time.' : 'Tidak ada hasil akhir yang direkam pada saat ini.'}
        </p>
      </NeoPanel>
    );
  }

  return (
    <NeoPanel className="p-6">
      <h3 className="text-sm font-medium text-lyra-text mb-4">
        {language === 'en' ? 'Deliverable Output' : 'Hasil Pekerjaan'}
      </h3>
      <div className="bg-lyra-surface-inset shadow-neo-inset p-4 rounded-lg text-sm text-lyra-text font-mono whitespace-pre-wrap">
        {latestSummary}
      </div>
    </NeoPanel>
  );
}

function DetailsTab({ task, mappedStatus, runId, language }: any) {
  return (
    <NeoPanel className="p-6">
      <h3 className="text-sm font-medium text-lyra-text mb-6">
        {language === 'en' ? 'System Metadata' : 'Metadata Sistem'}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <span className="block text-xs text-lyra-muted mb-1">Lyra Work ID</span>
          <span className="text-sm text-lyra-text font-mono">{task.id}</span>
        </div>
        <div>
          <span className="block text-xs text-lyra-muted mb-1">Hermes Run Correlation</span>
          <span className="text-sm text-lyra-text font-mono">{runId || 'N/A'}</span>
        </div>
        <div>
          <span className="block text-xs text-lyra-muted mb-1">Agent</span>
          <span className="text-sm text-lyra-text font-mono">{task.assignee}</span>
        </div>
        <div>
          <span className="block text-xs text-lyra-muted mb-1">Status</span>
          <span className="text-sm text-lyra-text">{mappedStatus}</span>
        </div>
        <div>
          <span className="block text-xs text-lyra-muted mb-1">Created At</span>
          <span className="text-sm text-lyra-text">{new Date(task.created_at).toLocaleString()}</span>
        </div>
        <div>
          <span className="block text-xs text-lyra-muted mb-1">Completed At</span>
          <span className="text-sm text-lyra-text">
            {task.completed_at ? new Date(task.completed_at).toLocaleString() : '-'}
          </span>
        </div>
      </div>
    </NeoPanel>
  );
}
