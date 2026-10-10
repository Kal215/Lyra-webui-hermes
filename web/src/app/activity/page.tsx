/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Terminal, FileCode, CheckCircle, XCircle, Loader2, Clock, Search } from 'lucide-react';
import { NeoPanel } from '@/components/NeoPanel';
import { NeoButton } from '@/components/NeoButton';
import { useI18nStore } from '@/i18n';

interface ActivityItem {
  id: string;
  agentId: string;
  agentName: string;
  type: 'command' | 'file';
  operation: string;
  target: string;
  status: 'running' | 'completed' | 'failed' | 'changed' | 'patch';
  exitCode?: number;
  timestamp: string;
  runId: string;
  patchDiff?: string;
}

export default function ActivityPage() {
  const { language } = useI18nStore();
  const t = (id: string, en: string) => (language === 'id' ? id : en);

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'command' | 'file'>('all');
  const [search, setSearch] = useState('');

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activity?limit=50');
      const data = await res.json();
      if (data.activities) {
        setActivities(data.activities);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    // Refresh every 15s - lightweight polling
    const interval = setInterval(fetchActivities, 15000);
    return () => clearInterval(interval);
  }, []);

  const filtered = activities.filter(a => {
    if (filterType === 'command' && a.type !== 'command') return false;
    if (filterType === 'file' && a.type !== 'file') return false;
    if (search) {
      const s = search.toLowerCase();
      if (!a.target.toLowerCase().includes(s) && !a.agentName.toLowerCase().includes(s)) {
        return false;
      }
    }
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-rose-500" />;
      case 'changed': 
      case 'patch': return <FileCode className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4 text-lyra-text/50" />;
    }
  };

  const getStatusLabel = (status: string, type: string) => {
    if (language === 'en') {
      if (status === 'running') return 'Running';
      if (status === 'completed') return 'Completed';
      if (status === 'failed') return 'Failed';
      if (status === 'changed') return 'Changed';
      if (status === 'patch') return 'Patch';
    }
    if (status === 'running') return 'Sedang berjalan';
    if (status === 'completed') return 'Selesai';
    if (status === 'failed') return 'Gagal';
    if (status === 'changed') return 'Diubah';
    if (status === 'patch') return 'Patch';
    return status;
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-lyra-text">
          {t('Aktivitas', 'Activity')}
        </h1>
        <p className="text-sm text-lyra-text/60">
          {t('Aktivitas sesi saat ini.', 'Current session activity.')}
        </p>
      </div>

      <NeoPanel className="p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-2">
          <NeoButton 
            variant={filterType === 'all' ? 'inset' : 'flat'} 
            onClick={() => setFilterType('all')}
            className="px-3 py-1 text-sm"
          >
            {t('Semua', 'All')}
          </NeoButton>
          <NeoButton 
            variant={filterType === 'command' ? 'inset' : 'flat'} 
            onClick={() => setFilterType('command')}
            className="px-3 py-1 text-sm"
          >
            {t('Perintah', 'Command')}
          </NeoButton>
          <NeoButton 
            variant={filterType === 'file' ? 'inset' : 'flat'} 
            onClick={() => setFilterType('file')}
            className="px-3 py-1 text-sm"
          >
            {t('File', 'File')}
          </NeoButton>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lyra-text/40" />
          <input
            type="text"
            placeholder={t('Cari...', 'Search...')}
            className="w-full pl-9 pr-4 py-2 bg-lyra-surface shadow-neo rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-lyra-accent-soft transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </NeoPanel>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
        </div>
      ) : filtered.length === 0 ? (
        <NeoPanel className="p-12 flex flex-col items-center justify-center text-center gap-4">
          <Activity className="w-12 h-12 text-lyra-text/20" />
          <p className="text-lyra-text/50">
            {search ? t('Tidak ada hasil pencarian.', 'No search results.') : t('Belum ada aktivitas pada sesi ini.', 'No activity in this session yet.')}
          </p>
        </NeoPanel>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(item => (
            <NeoPanel key={item.id} className="p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 bg-lyra-surface shadow-neo-inset rounded-full">
                    {item.type === 'command' ? <Terminal className="w-4 h-4 text-primary" /> : <FileCode className="w-4 h-4 text-blue-500" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-lyra-text">
                      <span className="font-semibold text-primary">{item.agentName}</span>
                      {' '}
                      <span className="text-lyra-text/70">{t(item.operation, item.operation)}</span>
                    </span>
                    <span className="text-sm text-lyra-text/90 font-mono mt-1 break-all line-clamp-2">
                      {item.target}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-lyra-text/40 whitespace-nowrap flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              
              <div className="flex items-center gap-2 pl-12">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-lyra-surface shadow-neo text-xs font-medium">
                  {getStatusIcon(item.status)}
                  <span className="text-lyra-text/70">
                    {getStatusLabel(item.status, item.type)}
                    {item.exitCode !== undefined && ` · exit ${item.exitCode}`}
                  </span>
                </div>
              </div>
            </NeoPanel>
          ))}
        </div>
      )}
    </div>
  );
}