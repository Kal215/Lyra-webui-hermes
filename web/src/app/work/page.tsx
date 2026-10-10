'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation, useI18nStore } from '@/i18n';
import { NeoPanel } from '@/components/NeoPanel';
import { NeoSegmentedControl } from '@/components/NeoSegmentedControl';
import { NeoButton } from '@/components/NeoButton';
import { NeoInput } from '@/components/NeoInput';
import { Search, Code, Filter, ArrowDownUp, ChevronRight, AlertCircle, Plus, X, Check, Archive, Info, Sparkles, Bot, Layers } from 'lucide-react';
import { formatTimeAgo } from '@/utils/time';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export interface RealWorkItem {
  id: string;
  title: string;
  assignee: string;
  status: string; // triage, todo, ready, running, blocked, done, archived
  priority: number;
  created_at: number; // unix timestamp
  completed_at: number | null;
  tenant: string | null;
}

export default function WorkPage() {
  const t = useTranslation();
  const { language } = useI18nStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'waiting' | 'review' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterAgent, setFilterAgent] = useState<string>('');
  
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'title'>('latest');

  const [realTasks, setRealTasks] = useState<RealWorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskBody, setNewTaskBody] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('default');
  const [newTaskPriority, setNewTaskPriority] = useState('0');
  const [creating, setCreating] = useState(false);

  const fetchWork = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/work');
      if (!res.ok) throw new Error('Failed to fetch work');
      const json = await res.json();
      if (json.success) {
        setRealTasks(json.data);
      } else {
        throw new Error(json.error || 'Unknown error');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowFilter(false);
        setShowSort(false);
        setShowCreateModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    fetchWork();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          body: newTaskBody,
          assignee: newTaskAssignee,
          priority: parseInt(newTaskPriority, 10)
        })
      });
      if (!res.ok) throw new Error('Failed to create task');
      setShowCreateModal(false);
      setNewTaskTitle('');
      setNewTaskBody('');
      fetchWork();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (id: string, action: string) => {
    try {
      await fetch(`/api/work/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      fetchWork();
    } catch (err) {
      console.error(err);
    }
  };

  // Derived filtered & sorted data
  const processedData = useMemo(() => {
    let data = [...realTasks];

    // Tab filter
    if (activeTab === 'active') data = data.filter(d => ['running', 'todo', 'ready'].includes(d.status));
    else if (activeTab === 'waiting') data = data.filter(d => ['todo', 'ready', 'triage'].includes(d.status));
    else if (activeTab === 'review') data = data.filter(d => ['review'].includes(d.status));
    else if (activeTab === 'completed') data = data.filter(d => ['done', 'archived', 'blocked'].includes(d.status));

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(d => 
        (d.title || '').toLowerCase().includes(q) || 
        (d.assignee || '').toLowerCase().includes(q)
      );
    }

    // Advanced filters
    if (filterStatus) data = data.filter(d => d.status === filterStatus);
    if (filterAgent) data = data.filter(d => d.assignee.toLowerCase() === filterAgent.toLowerCase());

    // Sort
    data.sort((a, b) => {
      if (sortBy === 'latest') return b.created_at - a.created_at;
      if (sortBy === 'oldest') return a.created_at - b.created_at;
      if (sortBy === 'title') {
        const titleA = a.title || '';
        const titleB = b.title || '';
        return titleA.localeCompare(titleB);
      }
      return 0;
    });

    return data;
  }, [realTasks, activeTab, searchQuery, filterStatus, filterAgent, sortBy]);

  const uniqueAgents = Array.from(new Set(realTasks.map(w => w.assignee).filter(Boolean)));

  const handleClearFilters = () => {
    setFilterStatus('');
    setFilterAgent('');
    setSearchQuery('');
  };

  const hasActiveFilters = filterStatus !== '' || filterAgent !== '';

  const getMappedStatus = (status: string) => {
    switch (status) {
      case 'triage': return language === 'id' ? 'Draft' : 'Draft';
      case 'todo':
      case 'ready': return language === 'id' ? 'Menunggu' : 'Waiting';
      case 'running': return language === 'id' ? 'Berjalan' : 'Running';
      case 'review': return language === 'id' ? 'Menunggu Review' : 'Review';
      case 'done': return language === 'id' ? 'Selesai' : 'Completed';
      case 'blocked': return language === 'id' ? 'Gagal' : 'Failed';
      case 'archived': return language === 'id' ? 'Dibatalkan' : 'Cancelled';
      default: return language === 'id' ? 'Tidak diketahui' : 'Unknown';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-6 sm:px-8 max-w-7xl mx-auto w-full">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-lyra-text tracking-tight">{t('work.title')}</h1>
          <p className="text-lyra-text-secondary text-sm mt-1">{t('work.subtitle')}</p>
        </div>
        
        {/* BUAT TUGAS BUTTON STYLED LIKE A SEGMENTED TAB */}
        <div className="inline-flex p-1 rounded-lyra-xl bg-lyra-surface shadow-neo shrink-0 self-start sm:self-auto">
          <button 
            className="flex items-center gap-2 relative px-5 py-2 rounded-lyra-lg text-sm font-medium transition-all duration-300 outline-none bg-lyra-surface shadow-neo-low text-lyra-text-muted hover:text-lyra-accent hover:shadow-neo-shallow-inset hover:bg-lyra-surface-inset active:shadow-neo-active-inset active:translate-y-[1px]"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} />
            {language === 'id' ? 'Buat Tugas' : 'New Task'}
          </button>
        </div>
      </div>

      {/* EXPLANATION BANNER */}
      <div className="mb-8 p-5 rounded-2xl bg-lyra-accent/10 border border-lyra-accent/20 flex gap-4 items-start">
        <div className="w-10 h-10 rounded-full bg-lyra-accent/20 flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5 text-lyra-accent" />
        </div>
        <div className="flex-1">
          <h3 className="text-lyra-text font-semibold mb-1">
            {language === 'id' ? 'Apa itu Papan Kanban AI?' : 'What is the AI Kanban Board?'}
          </h3>
          <p className="text-sm text-lyra-text-secondary leading-relaxed max-w-3xl">
            {language === 'id' 
              ? 'Delegasikan pekerjaan rumit yang memakan waktu (seperti riset mendalam, menulis artikel, atau koding) ke Agen AI. Buat tugas baru, dan AI akan mengerjakannya secara otonom di latar belakang tanpa Anda harus menunggu di layar obrolan.' 
              : 'Delegate time-consuming work (like deep research, writing, or coding) to AI Agents. Create a task, and the AI will work on it autonomously in the background without you having to wait in the chat screen.'}
          </p>
        </div>
      </div>

      {/* TOOLBAR */}
      
            {/* TABS */}
      <div className="flex overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 mb-6 no-scrollbar shrink-0">
        <NeoSegmentedControl
          value={activeTab}
          onChange={(val: string) => setActiveTab(val as 'all'|'active'|'waiting'|'review'|'completed')}
          options={[
            { value: 'all', label: language === 'id' ? 'Semua' : 'All' },
            { value: 'active', label: language === 'id' ? 'Aktif' : 'Active' },
            { value: 'waiting', label: language === 'id' ? 'Menunggu' : 'Waiting' },
            { value: 'review', label: language === 'id' ? 'Tinjauan' : 'Review' },
            { value: 'completed', label: language === 'id' ? 'Selesai' : 'Completed' }
          ]}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6 relative">
        <NeoInput 
          icon={<Search size={18} />}
          placeholder={language === 'id' ? 'Cari pekerjaan...' : 'Search work...'}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        
        <div className="flex gap-3 relative">
          <NeoButton 
            variant={showFilter || hasActiveFilters ? 'inset' : 'raised'}
            className="px-4 py-2 flex-1 sm:flex-none justify-center gap-2 text-sm h-10"
            onClick={() => { setShowFilter(!showFilter); setShowSort(false); }}
          >
            <Filter size={16} />
            {language === 'id' ? 'Filter' : 'Filter'}
          </NeoButton>
          
          <NeoButton 
            variant={showSort ? 'inset' : 'raised'}
            className="px-4 py-2 flex-1 sm:flex-none justify-center gap-2 text-sm h-10"
            onClick={() => { setShowSort(!showSort); setShowFilter(false); }}
          >
            <ArrowDownUp size={16} />
            {t('work.sort')}
          </NeoButton>
        </div>

        {/* FILTER POPOVER */}
        {showFilter && (
          <>
            <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm sm:hidden" onClick={() => setShowFilter(false)} />
            <div className="fixed bottom-0 left-0 right-0 z-50 p-6 pb-8 bg-lyra-surface/95 backdrop-blur-md border-t border-white/10 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:z-20 sm:w-64 sm:p-4 sm:bg-lyra-surface sm:rounded-lyra-xl sm:border sm:border-lyra-border/10 sm:shadow-neo-deep sm:backdrop-blur-none">
              <div className="flex justify-between items-center mb-4 sm:hidden">
                <h3 className="font-semibold text-lyra-text">{language === 'id' ? 'Filter' : 'Filter'}</h3>
                <button onClick={() => setShowFilter(false)} className="p-1 rounded-full bg-lyra-surface-inset text-lyra-text-secondary"><X size={18} /></button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-lyra-text-secondary font-medium mb-1 block">{t('work.statusLabel')}</label>
                  <select 
                    className="w-full bg-lyra-surface-inset rounded-lg p-3 sm:p-2 text-sm text-lyra-text outline-none"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                  >
                    <option value="">{language === 'id' ? 'Semua' : 'All'}</option>
                    {(['triage', 'todo', 'ready', 'running', 'review', 'done', 'blocked', 'archived']).map(s => (
                      <option key={s} value={s}>{getMappedStatus(s)}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-xs text-lyra-text-secondary font-medium mb-1 block">{t('work.agentLabel')}</label>
                  <select 
                    className="w-full bg-lyra-surface-inset rounded-lg p-3 sm:p-2 text-sm text-lyra-text outline-none"
                    value={filterAgent}
                    onChange={e => setFilterAgent(e.target.value)}
                  >
                    <option value="">{language === 'id' ? 'Semua' : 'All'}</option>
                    {uniqueAgents.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-between items-center mt-4 sm:mt-2">
                  <button onClick={handleClearFilters} className="text-sm sm:text-xs text-lyra-text-muted hover:text-lyra-text transition-colors">
                    {t('work.clearFilters')}
                  </button>
                  <NeoButton onClick={() => setShowFilter(false)} className="px-5 py-2 sm:px-3 sm:py-1.5 text-sm sm:text-xs rounded-lg">
                    {t('work.apply')}
                  </NeoButton>
                </div>
              </div>
            </div>
          </>
        )}

        {/* SORT POPOVER */}
        {showSort && (
          <div className="absolute right-0 top-full mt-2 z-20 w-full sm:w-48 p-2 bg-lyra-surface shadow-neo-deep rounded-lyra-xl border border-lyra-border/10 flex flex-col gap-1">
            {(['latest', 'oldest', 'title'] as const).map(s => (
              <button
                key={s}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${sortBy === s ? 'bg-lyra-surface-inset text-lyra-text' : 'text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-surface-raised/30'}`}
                onClick={() => { setSortBy(s); setShowSort(false); }}
              >
                {t(`work.sort${s.charAt(0).toUpperCase() + s.slice(1)}`)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* LIST */}
      <div className="flex flex-col gap-4 pb-12">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 mx-auto border-2 border-lyra-accent border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lyra-text-secondary">Loading...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-red-400">
            <AlertCircle size={24} className="mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : processedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-lyra-border/20 rounded-3xl bg-lyra-bg/30">
            <div className="w-16 h-16 rounded-full bg-lyra-surface shadow-neo-deep flex items-center justify-center mb-6">
              <Layers className="w-8 h-8 text-lyra-accent/60" />
            </div>
            <h3 className="text-xl font-bold text-lyra-text mb-2">
              {language === 'id' ? 'Belum Ada Pekerjaan' : 'No Tasks Yet'}
            </h3>
            <p className="text-lyra-text-secondary max-w-sm mb-8">
              {language === 'id' 
                ? 'Buat tiket pekerjaan pertama Anda untuk mendelegasikan tugas kepada Agen AI.' 
                : 'Create your first work ticket to delegate tasks to an AI Agent.'}
            </p>
            <NeoButton variant="raised" className="gap-2 bg-lyra-accent text-white px-6 py-3" onClick={() => setShowCreateModal(true)}>
              <Plus size={18} />
              {language === 'id' ? 'Mulai Delegasi' : 'Start Delegating'}
            </NeoButton>
          </div>
        ) : (
          processedData.map(item => (
            <NeoPanel
              key={item.id}
              depth={1}
              className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-lyra-xl bg-lyra-surface transition-all duration-300 hover:shadow-neo-hover cursor-pointer"
              onClick={() => router.push(`/work/${item.id}`)}
            >
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-lyra-bg flex items-center justify-center shrink-0 shadow-neo-inset">
                  <Code className="w-5 h-5 text-lyra-accent" />
                </div>
                <div className="flex flex-col gap-1 pr-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-semibold text-lyra-text line-clamp-1">
                    {item.title || item.id}
                  </span>
                </div>
                <div className="text-sm text-lyra-text-secondary font-mono text-[10px]">
                  {item.id}
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 sm:mt-2 text-xs text-lyra-text-muted">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(item.status)}`}></span>
                    <span className="capitalize font-medium">{getMappedStatus(item.status)}</span>
                  </span>
                  <span className="w-1 h-1 rounded-full bg-lyra-border/20"></span>
                  <span>{item.assignee || 'Unassigned'}</span>
                  <span className="w-1 h-1 rounded-full bg-lyra-border/20"></span>
                  <span>{t('work.updatedAt')} {formatTimeAgo(item.created_at, language)}</span>
                </div>
              </div>

              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 sm:relative sm:top-0 sm:-translate-y-0 text-lyra-text-muted group-hover:text-lyra-text transition-colors flex gap-2 items-center">
                {item.status !== 'done' && item.status !== 'archived' && (
                  <button 
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-green-500/10 text-lyra-text-muted hover:text-green-400 transition-colors"
                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(item.id, 'complete'); }}
                    title="Mark as Done"
                  >
                    <Check size={16} />
                  </button>
                )}
                {item.status === 'done' && (
                  <button 
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/10 text-lyra-text-muted hover:text-red-400 transition-colors"
                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(item.id, 'archive'); }}
                    title="Archive Task"
                  >
                    <Archive size={16} />
                  </button>
                )}
                <div className="w-[1px] h-4 bg-lyra-border/30 mx-1 hidden sm:block"></div>
                <NeoButton variant="raised" className="w-8 h-8 rounded-full sm:bg-transparent sm:shadow-none sm:group-hover:shadow-neo-shallow-inset">
                  <ChevronRight size={16} />
                </NeoButton>
              </div>
            </NeoPanel>
          ))
        )}
      </div>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div key="work-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></motion.div>
            
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-lyra-surface border border-lyra-accent/30 rounded-3xl w-full max-w-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-lyra-accent/10 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-lyra-text">{language === 'id' ? 'Buat Tugas Baru' : 'Create New Task'}</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/5 rounded-full text-lyra-text-secondary"><X size={20} /></button>
              </div>

              <form onSubmit={handleCreateTask} className="flex flex-col h-full overflow-hidden">
                <div className="p-6 overflow-y-auto flex-1 space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-lyra-text-secondary uppercase tracking-wider mb-2">Judul Pekerjaan</label>
                    <input 
                      required 
                      type="text" 
                      value={newTaskTitle} 
                      onChange={e => setNewTaskTitle(e.target.value)} 
                      className="w-full bg-black/20 border border-lyra-accent/20 rounded-xl p-3 text-lyra-text focus:border-lyra-accent outline-none" 
                      placeholder="Misal: Lakukan web-scraping..." 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-lyra-text-secondary uppercase tracking-wider mb-2">Instruksi Khusus (Body)</label>
                    <textarea 
                      required
                      value={newTaskBody} 
                      onChange={e => setNewTaskBody(e.target.value)} 
                      rows={4} 
                      className="w-full bg-black/20 border border-lyra-accent/20 rounded-xl p-3 text-lyra-text focus:border-lyra-accent outline-none resize-none" 
                      placeholder="Jelaskan detail pekerjaannya di sini..." 
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-lyra-text-secondary uppercase tracking-wider mb-2">Ditugaskan Kepada (Assignee)</label>
                      <input 
                        required 
                        type="text" 
                        value={newTaskAssignee} 
                        onChange={e => setNewTaskAssignee(e.target.value)} 
                        className="w-full bg-black/20 border border-lyra-accent/20 rounded-xl p-3 text-lyra-text focus:border-lyra-accent outline-none font-mono text-sm" 
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs font-bold text-lyra-text-secondary uppercase tracking-wider mb-2">Prioritas</label>
                      <input 
                        type="number" 
                        value={newTaskPriority} 
                        onChange={e => setNewTaskPriority(e.target.value)} 
                        className="w-full bg-black/20 border border-lyra-accent/20 rounded-xl p-3 text-lyra-text focus:border-lyra-accent outline-none font-mono text-sm" 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="p-6 border-t border-lyra-accent/10 flex justify-end gap-3 bg-black/10 rounded-b-3xl">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 text-sm font-medium text-lyra-text hover:bg-white/5 rounded-xl transition-colors">
                    Batal
                  </button>
                  <button type="submit" disabled={creating} className="px-6 py-2.5 text-sm font-medium bg-lyra-accent text-white hover:bg-lyra-accent/90 rounded-xl transition-colors shadow-lg shadow-lyra-accent/20 flex items-center justify-center min-w-[120px]">
                    {creating ? 'Mendelegasikan...' : 'Buat Tugas'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'running': return 'bg-lyra-accent-soft shadow-[0_0_8px_rgba(var(--color-lyra-accent-soft),0.6)]';
    case 'ready':
    case 'todo': return 'bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.5)]';
    case 'review': return 'bg-purple-400/80 shadow-[0_0_8px_rgba(192,132,252,0.5)]';
    case 'done': return 'bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.5)]';
    case 'blocked': return 'bg-red-400/80 shadow-[0_0_8px_rgba(248,113,113,0.5)]';
    case 'archived': return 'bg-lyra-text-muted';
    case 'triage': return 'bg-blue-400/80 shadow-[0_0_8px_rgba(96,165,250,0.5)]';
    default: return 'bg-lyra-text-muted/50';
  }
}
