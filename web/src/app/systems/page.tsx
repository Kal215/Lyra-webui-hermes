'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Server, Shield, Clock, RotateCcw, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { NeoPanel } from '@/components/NeoPanel';
import { TerminalPanel } from '@/components/TerminalPanel';
import { NeoButton } from '@/components/NeoButton';
import { useTranslation, useI18nStore } from '@/i18n';
import { useTactileSound } from '@/hooks/use-tactile-sound';

import { Sparkline } from '@/components/Sparkline';

export default function SystemsPage() {
  const { language } = useI18nStore();
  const { playClick } = useTactileSound();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Historis data untuk grafik riwayat waktu nyata (Sparklines)
  const [cpuHistory, setCpuHistory] = useState<number[]>(Array(20).fill(0));
  const [ramHistory, setRamHistory] = useState<number[]>(Array(20).fill(0));

  const fetchData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const res = await fetch('/api/systems');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastUpdated(new Date());

        // Update riwayat grafik
        if (json.resources) {
           const currentCpu = json.resources.cpu || 0;
           const currentRamPercent = json.resources.memory ? (json.resources.memory.usedGB / json.resources.memory.totalGB) * 100 : 0;
           setCpuHistory(prev => [...prev.slice(1), currentCpu]);
           setRamHistory(prev => [...prev.slice(1), currentRamPercent]);
        }
      }
    } catch (e) {
      console.error('Failed to fetch systems', e);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    setLastUpdated(new Date());
    fetchData();
    
    const int = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchData(false);
      }
    }, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(int);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleRefresh = () => {
    playClick();
    fetchData(true);
  };

  const getStatusIcon = (status: string) => {
    if (status === 'normal') return <CheckCircle size={18} className="text-lyra-success" />;
    if (status === 'degraded') return <AlertTriangle size={18} className="text-lyra-warning" />;
    return <Activity size={18} className="text-lyra-error" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'normal') return 'text-lyra-success';
    if (status === 'degraded') return 'text-lyra-warning';
    return 'text-lyra-error';
  };

  return (
    <div className="h-full flex flex-col bg-lyra-bg text-lyra-text p-6 md:p-8 lg:p-10 overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto space-y-8">
        
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-heading text-lyra-text tracking-tight">
              {language === 'id' ? 'Kesehatan Sistem' : 'System Health'}
            </h1>
            <p className="text-sm text-lyra-text-secondary mt-1">
              {language === 'id' 
                ? 'Pemantauan real-time untuk infrastruktur Lyra.' 
                : 'Real-time monitoring for Lyra infrastructure.'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-xs text-lyra-text-muted">
                {language === 'id' ? 'Diperbarui' : 'Updated'}: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <NeoButton 
              variant="raised" 
              className="px-4 py-2 gap-2 text-xs"
              onClick={handleRefresh}
            >
              <RotateCcw size={14} className={refreshing ? 'animate-spin' : ''} />
              {language === 'id' ? 'Perbarui' : 'Refresh'}
            </NeoButton>
          </div>
        </header>

        {loading && !data ? (
          <div className="flex h-64 items-center justify-center">
            <Activity className="animate-pulse text-lyra-accent" size={32} />
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Quick Metrics & Nodes */}
            <div className="lg:col-span-2 space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NeoPanel className="p-6 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-lyra-success/10 flex items-center justify-center text-lyra-success shrink-0">
                      <Shield size={24} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-lyra-text-secondary uppercase tracking-wider mb-1">
                        {language === 'id' ? 'Status Keseluruhan' : 'Overall Status'}
                      </div>
                      <div className="text-2xl font-bold text-lyra-text">
                        {data.systems?.degradedCount === 0 ? 'Optimal' : `${data.systems?.degradedCount} Degraded`}
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 opacity-30 pointer-events-none">
                     <Sparkline data={Array(20).fill(100)} color="#22c55e" />
                  </div>
                </NeoPanel>

                <NeoPanel className="p-6 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-lyra-accent/10 flex items-center justify-center text-lyra-accent shrink-0">
                      <Cpu size={24} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-lyra-text-secondary uppercase tracking-wider mb-1">
                        {language === 'id' ? 'RAM Terpakai' : 'RAM Usage'}
                      </div>
                      <div className="text-2xl font-bold text-lyra-text">
                        {data.resources?.memory?.usedGB?.toFixed(1)} <span className="text-sm font-medium text-lyra-text-muted">/ {data.resources?.memory?.totalGB?.toFixed(1)} GB</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none opacity-40">
                     <Sparkline data={ramHistory} color="#8b5cf6" max={100} />
                  </div>
                </NeoPanel>

                <NeoPanel className="p-6 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                      <Activity size={24} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-lyra-text-secondary uppercase tracking-wider mb-1">
                        {language === 'id' ? 'CPU Load' : 'CPU Load'}
                      </div>
                      <div className="text-2xl font-bold text-lyra-text">
                        {data.resources?.cpu?.toFixed(1) || 0} <span className="text-sm font-medium text-lyra-text-muted">%</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none opacity-40">
                     <Sparkline data={cpuHistory} color="#3b82f6" max={100} />
                  </div>
                </NeoPanel>

                <NeoPanel className="p-6 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                      <HardDrive size={24} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-lyra-text-secondary uppercase tracking-wider mb-1">
                        {language === 'id' ? 'Penyimpanan (Disk)' : 'Disk Storage'}
                      </div>
                      <div className="text-2xl font-bold text-lyra-text">
                        {data.resources?.disk?.usedGB?.toFixed(0)} <span className="text-sm font-medium text-lyra-text-muted">/ {data.resources?.disk?.totalGB?.toFixed(0)} GB</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none opacity-40">
                     <Sparkline data={Array(20).fill((data.resources?.disk?.usedGB / data.resources?.disk?.totalGB) * 100)} color="#a855f7" max={100} />
                  </div>
                </NeoPanel>
              </div>

              <div>
                <h2 className="text-xl font-bold font-heading text-lyra-text mb-4 px-1">
                  {language === 'id' ? 'Layanan Aktif' : 'Active Services'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.systems?.items?.map((sys: any) => (
                    <NeoPanel key={sys.id} className="p-5 flex flex-col justify-between group h-32">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-lyra-bg`}>
                            {sys.id === 'webui' ? <Server size={18} className="text-lyra-accent" /> :
                             sys.id === 'hermes' ? <Activity size={18} className="text-lyra-text" /> :
                             <Database size={18} className="text-lyra-text-secondary" />}
                          </div>
                          <div>
                            <h3 className="font-bold text-lyra-text">{sys.name}</h3>
                          </div>
                        </div>
                        {getStatusIcon(sys.status)}
                      </div>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <div className="text-xs text-lyra-text-secondary bg-lyra-bg px-2 py-1 rounded-md font-mono truncate max-w-[150px]">
                          {sys.details}
                        </div>
                        <div className={`text-xs font-bold uppercase tracking-wider ${getStatusColor(sys.status)}`}>
                          {sys.status}
                        </div>
                      </div>
                    </NeoPanel>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Terminal Panel & Insights */}
            <div className="space-y-8">
              <NeoPanel className="p-6">
                 <h2 className="text-lg font-bold font-heading text-lyra-text mb-4 flex items-center justify-between">
                    <span>{language === 'id' ? 'Analitik Token' : 'Token Analytics'}</span>
                    <div className="flex items-center gap-2 bg-lyra-surface-inset border border-lyra-border/50 px-2 py-1 rounded text-[10px] uppercase font-bold text-lyra-accent">
                       Live Sync
                    </div>
                 </h2>

                 {/* Basic Stats Grid */}
                 <div className="grid grid-cols-2 gap-3 mb-6">
                   <div className="bg-lyra-bg rounded-lg p-3 border border-lyra-border/30">
                     <span className="text-xs font-medium text-lyra-text-secondary block mb-1">{language === 'id' ? 'Sesi' : 'Sessions'}</span>
                     <span className="text-lg font-bold text-lyra-text">{data.insights?.sessions?.toLocaleString() || 0}</span>
                   </div>
                   <div className="bg-lyra-bg rounded-lg p-3 border border-lyra-border/30">
                     <span className="text-xs font-medium text-lyra-text-secondary block mb-1">{language === 'id' ? 'Pesan' : 'Messages'}</span>
                     <span className="text-lg font-bold text-lyra-text">{data.insights?.messages?.toLocaleString() || 0}</span>
                   </div>
                   <div className="bg-lyra-bg rounded-lg p-3 border border-lyra-border/30">
                     <span className="text-xs font-medium text-lyra-text-secondary block mb-1">Total Tokens</span>
                     <span className="text-lg font-bold text-lyra-text">{data.insights?.totalTokens >= 1e6 ? (data.insights?.totalTokens / 1e6).toFixed(2) + 'M' : data.insights?.totalTokens?.toLocaleString() || 0}</span>
                   </div>
                   <div className="bg-lyra-bg rounded-lg p-3 border border-lyra-border/30">
                     <span className="text-xs font-medium text-lyra-text-secondary block mb-1">{language === 'id' ? 'Aktivasi Alat' : 'Tool Uses'}</span>
                     <span className="text-lg font-bold text-lyra-text">{data.insights?.toolCalls?.toLocaleString() || 0}</span>
                   </div>
                 </div>

                 {/* Activity Graph */}
                 {data.insights?.activity?.length > 0 && (
                   <div className="mb-6">
                     <h3 className="text-xs font-bold text-lyra-text-secondary uppercase tracking-wider mb-3">
                       {language === 'id' ? 'Aktivitas Mingguan' : 'Weekly Activity'}
                     </h3>
                     <div className="flex items-end justify-between h-32 bg-lyra-bg rounded-lg pt-6 pb-3 px-2 border border-lyra-border/30">
                       {data.insights.activity.map((act: any, i: number) => {
                         const maxCount = Math.max(...data.insights.activity.map((a:any) => a.count), 1);
                         // Berikan tinggi minimal 5% jika nilainya > 0 agar tidak hilang
                         const heightPct = act.count === 0 ? 0 : Math.max((act.count / maxCount) * 100, 5); 
                         return (
                           <div key={i} className="flex flex-col items-center flex-1 gap-2 group relative">
                             {/* Background track (siluet kosong) */}
                             <div className="w-6 sm:w-8 h-16 bg-lyra-surface-inset border border-lyra-border/20 flex items-end rounded-sm overflow-hidden">
                               <div 
                                 className="w-full bg-lyra-accent/80 transition-all duration-500 rounded-sm group-hover:bg-lyra-accent"
                                 style={{ height: `${heightPct}%` }}
                               ></div>
                             </div>
                             <span className="text-[10px] text-lyra-text-muted font-medium">{act.day}</span>
                             
                             {/* Tooltip */}
                             <div className="absolute -top-10 bg-lyra-surface shadow-neo border border-lyra-border/50 text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-lyra-text">
                               {act.count} {language === 'id' ? 'Sesi' : 'Sessions'}
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 )}

                 {/* Top Tools Bar Chart */}
                 {data.insights?.topTools?.length > 0 && (
                   <div className="mb-6">
                     <h3 className="text-xs font-bold text-lyra-text-secondary uppercase tracking-wider mb-3">
                       {language === 'id' ? 'Penggunaan Alat Terbanyak' : 'Top Tools Usage'}
                     </h3>
                     <div className="space-y-3">
                       {data.insights.topTools.map((tool: any, i: number) => (
                         <div key={i}>
                           <div className="flex items-center justify-between text-xs mb-1 font-mono">
                             <span className="text-lyra-text">{tool.name}</span>
                             <span className="text-lyra-text-secondary">{tool.calls} ({tool.percentage}%)</span>
                           </div>
                           <div className="w-full h-1.5 bg-lyra-bg rounded-full overflow-hidden">
                             <div className="h-full bg-purple-500/80 rounded-full" style={{ width: `${tool.percentage}%` }}></div>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
                 
                 <div className="mt-4 p-4 rounded-xl bg-lyra-surface-inset border border-lyra-border/50">
                   <p className="text-[11px] text-lyra-text-muted leading-relaxed">
                     {language === 'id'
                       ? 'Metrik ini diekstrak secara real-time dari riwayat memori CLI Hermes (insights) dalam 30 hari terakhir. Data sinkronisasi 100% akurat.'
                       : 'These metrics are extracted in real-time from the Hermes CLI memory history (insights) over the last 30 days. Sync is 100% accurate.'}
                   </p>
                 </div>
              </NeoPanel>
            </div>
            
          </div>
        ) : null}
      </div>
    </div>
  );
}