/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Bell, Clock, ChevronRight, Activity, Cpu, Code, Shield } from 'lucide-react';
import { NeoPanel } from '@/components/NeoPanel';
import { NeoButton } from '@/components/NeoButton';
import { NeoInput } from '@/components/NeoInput';
import { Sparkline } from '@/components/Sparkline';

import { useTranslation, useI18nStore } from '@/i18n';
import { useTactileSound } from '@/hooks/use-tactile-sound';
import { ClientGreeting } from "@/components/ClientGreeting";
import { useRouter } from 'next/navigation';

export default function Home() {
  const t = useTranslation();
  const { playClick, playPress } = useTactileSound();
  const { language } = useI18nStore();
  const router = useRouter();
  
  const [homeData, setHomeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchHome = async () => {
      try {
        const res = await fetch('/api/home');
        if (res.ok) {
          const data = await res.json();
          if (mounted) setHomeData(data);
        }
      } catch (e) {
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchHome();
    return () => { mounted = false; };
  }, []);

  const mapFixtureText = (title: string, fullMsg?: string) => {
    // Jika log Hermes asli, format agar enak dibaca
    if (fullMsg) {
      if (fullMsg.includes('API call')) return 'Inference & Generation';
      if (fullMsg.includes('tools.')) return `Tool Execution: ${fullMsg.split('tools.')[1]?.split(':')[0] || 'Unknown'}`;
      if (fullMsg.includes('Agent task:')) return 'Task Dispatched';
      return fullMsg.substring(0, 40) + (fullMsg.length > 40 ? '...' : '');
    }

    const map: Record<string, string> = {
      'Build landing page': 'buildLandingPage',
      'Review API': 'reviewApi',
      'Security audit': 'securityAudit',
      'Coder completed a task': 'coderCompleted',
      'Provider recovered': 'providerRecovered',
      'QA started review': 'qaStarted'
    };
    
    if (map[title]) {
      return t(`fixture.${map[title]}`);
    }
    return title;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Working': return t('status.working');
      case 'Reviewing': return t('status.reviewing');
      case 'Running': return t('status.running');
      case 'Idle': return t('status.idle');
      case 'Online': return t('status.online');
      default: return status;
    }
  };

  const handleNavigation = (path: string) => {
    playClick();
    router.push(path);
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      playClick();
      router.push('/chat');
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-10">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-lyra-text">
            <ClientGreeting />, Riskal
          </h1>
          <p className="text-lyra-text-secondary mt-1">{t('status.allNormal')}</p>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lyra-text-muted" />
            <NeoInput 
              type="text" 
              placeholder={t('dash.search')}
              className="w-full pl-10"
              onKeyDown={handleSearch}
            />
          </div>
          <NeoButton 
            className="w-10 h-10 flex items-center justify-center rounded-full shrink-0"
            onClick={() => handleNavigation('/activity')}
          >
            <Bell className="w-4 h-4 text-lyra-text" />
          </NeoButton>
        </div>
      </header>

      {/* Status Strip */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
        <NeoPanel depth={1} className="flex items-center gap-3 px-6 py-4 rounded-2xl min-w-[200px] flex-1">
          <div className="w-2 h-2 rounded-full bg-lyra-success" />
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-lyra-text-secondary">{t('status.activeWork')}</div>
            <div className="font-medium mt-1">{homeData?.stats?.activeWork || 0}</div>
          </div>
        </NeoPanel>
        
        <NeoPanel depth={1} className="flex items-center gap-3 px-6 py-4 rounded-2xl min-w-[200px] flex-1">
          <div className={`w-2 h-2 rounded-full ${homeData?.stats?.attention > 0 ? 'bg-lyra-warning animate-pulse' : 'bg-lyra-text-muted'}`} />
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-lyra-text-secondary">{t('status.attention')}</div>
            <div className="font-medium mt-1">{homeData?.stats?.attention || 0} Issue</div>
          </div>
        </NeoPanel>
        
        <NeoPanel depth={1} className="flex items-center gap-3 px-6 py-4 rounded-2xl min-w-[200px] flex-1">
          <div className={`w-2 h-2 rounded-full ${homeData?.stats?.attention === 0 ? 'bg-lyra-success shadow-[0_0_10px_rgba(74,222,128,0.2)]' : 'bg-lyra-warning'}`} />
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-lyra-text-secondary">{t('status.healthy')}</div>
            <div className="font-medium mt-1">{homeData?.stats?.healthy || 'Checking'}</div>
          </div>
        </NeoPanel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Current Work */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">{t('dash.currentWork')}</h2>
              <NeoButton 
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
                onClick={() => handleNavigation('/work')}
              >
                <Plus className="w-4 h-4" />
                {t('dash.newWork')}
              </NeoButton>
            </div>
            
            <div className="space-y-4">
              {(homeData?.work?.data || []).slice(0, 3).map((work: any, idx: number) => (
                <NeoPanel 
                  key={work.id || idx} 
                  depth={1} 
                  className="p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center hover:bg-lyra-surface-raised transition-colors cursor-pointer"
                  onClick={() => handleNavigation('/work')}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-lyra-bg flex items-center justify-center shrink-0  shadow-neo-inset">
                      <Code className="w-5 h-5 text-lyra-accent" />
                    </div>
                    <div>
                      <h3 className="font-medium">{work.title || work.id || 'Untitled Work'}</h3>
                      <div className="flex items-center gap-3 mt-2 text-sm text-lyra-text-secondary">
                        <span className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5" />
                          {work.status || 'Todo'}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-lyra-text-muted" />
                        <span>{work.assignee || 'Unassigned'}</span>
                      </div>
                    </div>
                  </div>
                  <NeoButton variant="inset" className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </NeoButton>
                </NeoPanel>
              ))}
              
              {(!homeData?.work?.data || homeData?.work?.data?.length === 0) && (
                 <div className="p-8 text-center text-sm text-lyra-text-muted border border-dashed border-lyra-border rounded-xl">
                    {language === 'id' ? 'Belum ada tiket tugas.' : 'No active tasks yet.'}
                 </div>
              )}
            </div>
          </section>

          {/* Activity */}
          <section>
            <h2 
              className="text-lg font-semibold mb-6 cursor-pointer hover:text-lyra-accent transition-colors flex items-center gap-2"
              onClick={() => handleNavigation('/activity')}
            >
              {language === 'id' ? 'Aktivitas Log Terkini' : 'Recent Log Activity'} <ChevronRight className="w-4 h-4" />
            </h2>
            <NeoPanel 
              depth={1} 
              className="p-6 cursor-pointer hover:bg-lyra-surface-raised transition-colors"
              onClick={() => handleNavigation('/activity')}
            >
              <div className="space-y-6">
                {(homeData?.activity?.data || []).slice(0, 4).map((activity: any, i: any) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-lyra-bg shadow-neo-inset flex items-center justify-center z-10 ">
                        <Clock className="w-3.5 h-3.5 text-lyra-text-muted" />
                      </div>
                      {i !== (homeData?.activity?.data || []).length - 1 && (
                        <div className="w-[1px] h-full bg-lyra-border my-2" />
                      )}
                    </div>
                    <div className="pb-6">
                      <div className="text-sm font-medium leading-relaxed">{mapFixtureText(activity.message || activity.id, activity.message)}</div>
                      <div className="text-xs text-lyra-text-secondary mt-1 font-mono">{activity.timestamp ? activity.timestamp : new Date().toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
                
                {(!homeData?.activity?.data || homeData?.activity?.data?.length === 0) && (
                   <div className="text-center text-sm text-lyra-text-muted">
                      {language === 'id' ? 'Tidak ada riwayat.' : 'No activity logged.'}
                   </div>
                )}
              </div>
            </NeoPanel>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          
          {/* Profiles */}
          <section>
            <h2 
              className="text-lg font-semibold mb-6 cursor-pointer hover:text-lyra-accent transition-colors flex items-center gap-2"
              onClick={() => handleNavigation('/profiles')}
            >
              {language === 'id' ? 'Profil Agen' : 'Profiles'} <ChevronRight className="w-4 h-4" />
            </h2>
            <NeoPanel depth={1} className="p-2 space-y-1">
              {(homeData?.profiles?.data || []).slice(0, 4).map((agent: any) => (
                <div 
                  key={agent.id} 
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-lyra-surface-raised transition-colors cursor-pointer"
                  onClick={() => handleNavigation('/profiles')}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-lg bg-lyra-bg shadow-neo-inset flex items-center justify-center ">
                        <Cpu className="w-4 h-4 text-lyra-text-secondary" />
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${agent.status === 'Active' ? 'bg-lyra-success animate-pulse' : 'bg-lyra-text-muted'} rounded-full border-2 border-lyra-surface`} />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{agent.id}</div>
                      <div className="text-xs text-lyra-text-secondary">{agent.status}</div>
                    </div>
                  </div>
                  <NeoButton variant="flat" className="w-8 h-8 rounded-lg flex items-center justify-center">
                    <ChevronRight className="w-4 h-4" />
                  </NeoButton>
                </div>
              ))}
              
              {(homeData?.profiles?.data?.length === 0) && (
                 <div className="p-4 text-center text-sm text-lyra-text-muted">
                    No profiles active.
                 </div>
              )}
            </NeoPanel>
          </section>

          {/* Systems */}
          <section>
            <h2 
              className="text-lg font-semibold mb-6 cursor-pointer hover:text-lyra-accent transition-colors flex items-center gap-2"
              onClick={() => handleNavigation('/systems')}
            >
              {language === 'id' ? 'Sistem' : 'Systems'} <ChevronRight className="w-4 h-4" />
            </h2>
            <NeoPanel depth={1} className="p-2 space-y-1">
              {(homeData?.systems?.items || []).slice(0, 4).map((sys: any) => (
                <div 
                  key={sys.id} 
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-lyra-surface-raised transition-colors cursor-pointer"
                  onClick={() => handleNavigation('/systems')}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-lg bg-lyra-bg shadow-neo-inset flex items-center justify-center ">
                        <Shield className="w-4 h-4 text-lyra-text-secondary" />
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${sys.status === 'normal' ? 'bg-lyra-success animate-pulse' : sys.status === 'degraded' ? 'bg-lyra-warning' : 'bg-lyra-error'} rounded-full border-2 border-lyra-surface`} />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{sys.id}</div>
                      <div className="text-xs text-lyra-text-secondary capitalize">{sys.status}</div>
                    </div>
                  </div>
                </div>
              ))}
            </NeoPanel>
          </section>

        </div>
      </div>
    </div>
  );
}
