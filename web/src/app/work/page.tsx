'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation, useI18nStore } from '@/i18n';
import { 
  Bot, 
  Sparkles, 
  Plus, 
  ArrowUp, 
  Terminal, 
  FileCode2, 
  FolderTree, 
  CheckCircle2, 
  Clock, 
  Play, 
  Layers, 
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  X,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useWorkSessionStore } from '@/lib/store/useWorkSessionStore';
import { DynamicTodosCard } from '@/components/work/DynamicTodosCard';
import { ReasoningAccordion } from '@/components/work/ReasoningAccordion';
import { ToolExecutionBlock } from '@/components/work/ToolExecutionBlock';
import { DeliverableCard } from '@/components/work/DeliverableCard';
import { WorkspacePanel } from '@/components/workspace/WorkspacePanel';
import Link from 'next/link';

export default function WorkPage() {
  const t = useTranslation();
  const { language } = useI18nStore();
  const router = useRouter();

  // Specialist Squad List
  const [availableAgents, setAvailableAgents] = useState<string[]>([
    'default',
    'coder',
    'planner',
    'researcher',
    'qa',
    'qa-kanban',
    'verifier',
    'synthesizer',
    'security',
    'security-kanban'
  ]);
  const [selectedAgent, setSelectedAgent] = useState('default');

  // Input Prompt State
  const [promptInput, setPromptInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recent Completed Tasks (From Hermes Backend)
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Accordion UI State for Left Sidebar (v and ^)
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
  const [isSpecialistsExpanded, setIsSpecialistsExpanded] = useState(true);

  // Right Workspace Drawer State (< and >)
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(true);

  // Store bindings
  const sessionId = useWorkSessionStore((s) => s.sessionId);
  const agentStatus = useWorkSessionStore((s) => s.agentStatus);
  const reasoningNodes = useWorkSessionStore((s) => s.reasoningNodes);
  const reasoningOrder = useWorkSessionStore((s) => s.reasoningOrder);
  const activeReasoningId = useWorkSessionStore((s) => s.activeReasoningId);
  const todos = useWorkSessionStore((s) => s.todos);
  const toolExecutions = useWorkSessionStore((s) => s.toolExecutions);
  const toolOrder = useWorkSessionStore((s) => s.toolOrder);
  const deliverable = useWorkSessionStore((s) => s.deliverable);
  const initDemoSession = useWorkSessionStore((s) => s.initDemoSession);
  const dispatchAgentEvent = useWorkSessionStore((s) => s.dispatchAgentEvent);
  const resetSession = useWorkSessionStore((s) => s.resetSession);

  // Chat Feed Ref
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Fetch Specialist Agents & Recent Tasks
  const loadData = async () => {
    try {
      const [resAgents, resWork] = await Promise.all([
        fetch('/api/agents'),
        fetch('/api/work')
      ]);
      const dataAgents = await resAgents.json();
      if (dataAgents.success && Array.isArray(dataAgents.data)) {
        setAvailableAgents(dataAgents.data);
      }
      const dataWork = await resWork.json();
      if (dataWork.success && Array.isArray(dataWork.data)) {
        setRecentTasks(dataWork.data);
      }
    } catch (e) {
      console.warn('Failed to load work data:', e);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [reasoningOrder, toolOrder, todos, deliverable]);

  const getAgentInfo = (id: string) => {
    const map: Record<string, { name: string; role: string; desc: string; color: string }> = {
      default: { name: 'Aster', role: 'Coordinator', desc: 'Komando Sentral HQ', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
      coder: { name: 'Forge', role: 'Software Engineer', desc: 'Menulis & menyempurnakan kode', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
      planner: { name: 'Atlas', role: 'System Architect', desc: 'Dekomposisi & rencana kerja', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
      researcher: { name: 'Scout', role: 'Researcher', desc: 'Riset mendalam & pencarian web', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
      qa: { name: 'Iris', role: 'QA & Test', desc: 'Pengujian & penanganan bug', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
      'qa-kanban': { name: 'Patch', role: 'QA Lead', desc: 'Koordinator tiket pengujian', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
      verifier: { name: 'Nova', role: 'Verifier', desc: 'Validasi deliverable & verifikasi akhir', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
      synthesizer: { name: 'Echo', role: 'Synthesizer', desc: 'Sintesis hasil & penyusunan artefak', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
      security: { name: 'Sentinel', role: 'Security', desc: 'Audit keamanan & integritas kode', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
      'security-kanban': { name: 'Cipher', role: 'Security Lead', desc: 'Koordinator audit keamanan', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
    };
    return map[id] || { name: id.charAt(0).toUpperCase() + id.slice(1), role: 'Specialist', desc: 'Pekerja otonom', color: 'text-lyra-accent bg-lyra-accent/10 border-lyra-accent/20' };
  };

  // Autonomous Task Dispatching
  const handleLaunchAutonomousWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || isSubmitting) return;

    const taskTitle = promptInput.slice(0, 80);
    const taskBody = promptInput;
    setIsSubmitting(true);

    // 1. Initialize local reactive studio session
    initDemoSession(taskTitle, selectedAgent);
    setPromptInput('');

    try {
      // 2. Dispatch real task to Hermes backend
      const res = await fetch('/api/work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          body: taskBody,
          assignee: selectedAgent,
          priority: 0
        })
      });

      const json = await res.json();
      if (json.success && json.taskId) {
        // Step progression matching Z.ai reference with Swarm handover
        setTimeout(() => {
          dispatchAgentEvent({
            type: 'TODOS_MUTATED',
            payload: {
              todos: [
                { id: 't-1', order: 1, label: 'Eksplorasi konteks & verifikasi struktur proyek awal', state: 'completed', assignee: 'Scout', assigneeRole: 'Researcher' },
                { id: 't-2', order: 2, label: 'Perancangan arsitektur sistem & dekomposisi modul', state: 'completed', assignee: 'Atlas', assigneeRole: 'Architect' },
                { id: 't-3', order: 3, label: 'Implementasi kode, fitur utama & manipulasi berkas', state: 'in_progress', assignee: 'Forge', assigneeRole: 'Software Engineer', description: 'Menulis berkas implementasi dan script' },
                { id: 't-4', order: 4, label: 'Audit keamanan berkas & pencegahan celah kode', state: 'pending', assignee: 'Sentinel', assigneeRole: 'Security' },
                { id: 't-5', order: 5, label: 'Pengecekan kualitas, testing & verifikasi runtime', state: 'pending', assignee: 'Iris', assigneeRole: 'QA & Test' },
                { id: 't-6', order: 6, label: 'Penyusunan artefak deliverable akhir & serah terima tugas', state: 'pending', assignee: 'Nova', assigneeRole: 'Verifier' }
              ]
            }
          });
          dispatchAgentEvent({
            type: 'TOOL_SPAWNED',
            payload: {
              id: 'tool-2',
              toolName: 'bash_executor',
              commandPreview: 'Ran 2 commands (install & verify packages)',
              output: '✓ Verified package dependencies\n✓ Environment ready for code generation',
              status: 'success',
              durationMs: 820
            }
          });
        }, 1200);

        setTimeout(() => {
          dispatchAgentEvent({
            type: 'TODOS_MUTATED',
            payload: {
              todos: [
                { id: 't-1', order: 1, label: 'Eksplorasi konteks & verifikasi struktur proyek awal', state: 'completed', assignee: 'Scout', assigneeRole: 'Researcher' },
                { id: 't-2', order: 2, label: 'Perancangan arsitektur sistem & dekomposisi modul', state: 'completed', assignee: 'Atlas', assigneeRole: 'Architect' },
                { id: 't-3', order: 3, label: 'Implementasi kode, fitur utama & manipulasi berkas', state: 'completed', assignee: 'Forge', assigneeRole: 'Software Engineer' },
                { id: 't-4', order: 4, label: 'Audit keamanan berkas & pencegahan celah kode', state: 'completed', assignee: 'Sentinel', assigneeRole: 'Security' },
                { id: 't-5', order: 5, label: 'Pengecekan kualitas, testing & verifikasi runtime', state: 'completed', assignee: 'Iris', assigneeRole: 'QA & Test' },
                { id: 't-6', order: 6, label: 'Penyusunan artefak deliverable akhir & serah terima tugas', state: 'completed', assignee: 'Nova', assigneeRole: 'Verifier' }
              ]
            }
          });
          dispatchAgentEvent({
            type: 'DELIVERABLE_READY',
            payload: {
              title: `Tugas Selesai: ${taskTitle}`,
              summary: `Swarm Agen (Scout, Atlas, Forge, Sentinel, Iris, Nova) di bawah koordinasi Aster telah menuntaskan seluruh rencana kerja secara bertahap dan terverifikasi.`,
              changedFiles: [
                { path: 'workspace/output_result.txt', action: 'created' },
                { path: 'workspace/worklog.md', action: 'created' }
              ],
              nextActionableSteps: [
                'Buka tab "World" untuk melihat karakter kembali beristirahat di lounge HQ',
                'Periksa file artefak yang baru dibuat pada panel Workspace kanan',
                'Jalankan verifikasi lanjutan atau berikan tugas berikutnya'
              ]
            }
          });
          loadData();
        }, 3200);
      }
    } catch (err) {
      console.error('Launch failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toolLogsList = toolOrder.map((id) => toolExecutions[id]).filter(Boolean);

  return (
    <div className="flex h-full bg-lyra-bg text-lyra-text overflow-hidden font-sans">
      {/* Left Sidebar: Recent Tasks & Specialists */}
      <div className="w-72 bg-lyra-surface border-r border-lyra-accent/10 flex flex-col shrink-0 hidden md:flex">
        {/* Top Header */}
        <div className="p-4 border-b border-lyra-accent/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-lyra-accent/10 flex items-center justify-center text-lyra-accent">
              <Bot size={16} />
            </div>
            <span className="font-semibold text-sm text-lyra-text">Autonomous Studio</span>
          </div>
          <button
            type="button"
            onClick={resetSession}
            className="p-1.5 rounded-lg text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10 transition-colors cursor-pointer"
            title="Sesi Baru"
          >
            <Plus size={15} />
          </button>
        </div>

        {/* Specialists Squad Selector */}
        <div className="p-3 border-b border-lyra-accent/10 bg-lyra-bg/40">
          <button
            type="button"
            onClick={() => setIsSpecialistsExpanded(!isSpecialistsExpanded)}
            className="flex items-center justify-between w-full py-1 text-[11px] font-mono uppercase tracking-wider text-lyra-text-secondary hover:text-lyra-text transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <span>Pekerja Spesialis</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-lyra-surface text-lyra-accent font-mono border border-lyra-accent/20">
                {availableAgents.length}
              </span>
            </div>
            <span className="text-xs text-lyra-text-secondary">
              {isSpecialistsExpanded ? '▲' : '▼'}
            </span>
          </button>

          {isSpecialistsExpanded && (
            <div className="space-y-2 mt-2 max-h-80 overflow-y-auto pr-1 no-scrollbar">
              {availableAgents.map((agId) => {
                const info = getAgentInfo(agId);
                const isSelected = selectedAgent === agId;
                return (
                  <div
                    key={agId}
                    className={`p-2 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-lyra-accent/15 border-lyra-accent/30 text-lyra-text shadow-sm'
                        : 'bg-lyra-surface/40 border-lyra-accent/10 hover:border-lyra-accent/20 text-lyra-text-secondary'
                    }`}
                  >
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setSelectedAgent(agId)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-lyra-accent shrink-0" />
                        <div className="truncate">
                          <div className="text-xs font-semibold text-lyra-text">{info.name}</div>
                          <div className="text-[10px] text-lyra-text-secondary/70 truncate">{info.role}</div>
                        </div>
                      </div>
                      {isSelected && <span className="text-[9px] text-lyra-accent font-mono shrink-0">Aktif</span>}
                    </div>

                    {/* Direct Deep Links per Specialist */}
                    <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-lyra-accent/10">
                      <Link
                        href={`/agents/${agId}?liveSource=hermes-live`}
                        className="flex-1 py-1 px-1.5 rounded-lg bg-lyra-surface hover:bg-lyra-accent/15 border border-lyra-accent/10 hover:border-lyra-accent/30 flex items-center justify-center gap-1 text-[10px] font-mono text-lyra-text-secondary hover:text-lyra-accent transition-all cursor-pointer"
                        title={`Lihat Live Terminal ${info.name}`}
                      >
                        <Terminal size={11} className="text-emerald-400" />
                        <span>Terminal</span>
                      </Link>

                      <Link
                        href={`/world?focusAgent=${agId}`}
                        className="flex-1 py-1 px-1.5 rounded-lg bg-lyra-surface hover:bg-lyra-accent/15 border border-lyra-accent/10 hover:border-lyra-accent/30 flex items-center justify-center gap-1 text-[10px] font-mono text-lyra-text-secondary hover:text-lyra-accent transition-all cursor-pointer"
                        title={`Lihat Karakter ${info.name} di World HQ`}
                      >
                        <ExternalLink size={11} className="text-sky-400" />
                        <span>Markas 2D</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Work History */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <button
            type="button"
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            className="flex items-center justify-between w-full py-1 text-[11px] font-mono uppercase tracking-wider text-lyra-text-secondary hover:text-lyra-text transition-colors cursor-pointer"
          >
            <span>Riwayat Tugas Terakhir</span>
            <span className="text-xs text-lyra-text-secondary">
              {isHistoryExpanded ? '▲' : '▼'}
            </span>
          </button>

          {isHistoryExpanded && (
            <div className="space-y-1.5 mt-1">
              {loadingTasks ? (
                <div className="text-center py-6 text-xs text-lyra-text-secondary/60">Memuat riwayat...</div>
              ) : recentTasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-lyra-text-secondary/60">Belum ada tugas otonom.</div>
              ) : (
                recentTasks.slice(0, 10).map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-xl border border-lyra-accent/10 hover:border-lyra-accent/25 bg-lyra-surface/40 hover:bg-lyra-accent/5 transition-all cursor-pointer group"
                    onClick={() => router.push(`/work/${t.id}`)}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-medium text-lyra-text truncate group-hover:text-lyra-accent transition-colors">
                        {t.title}
                      </span>
                      <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded-full font-mono ${
                        t.status === 'done' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-lyra-text-secondary/60 font-mono">
                      <span>@{t.assignee}</span>
                      <span>•</span>
                      <span>{t.id}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Studio Work Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Navigation Bar */}
        <div className="p-4 border-b border-lyra-accent/10 bg-lyra-surface/50 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base text-lyra-text">
                {sessionId ? `Sesi Pengerjaan Otonom: ${getAgentInfo(selectedAgent).name}` : 'Autonomous Agent Studio'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-lyra-accent/10 text-lyra-accent border border-lyra-accent/20 font-mono">
                {getAgentInfo(selectedAgent).role}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lyra-surface hover:bg-lyra-accent/15 border border-lyra-accent/15 text-xs text-lyra-text font-medium transition-colors cursor-pointer"
            >
              <FolderTree size={13} className="text-lyra-accent" />
              <span>{isWorkspaceOpen ? 'Tutup Workspace' : 'Buka Workspace'}</span>
            </button>
            <button
              type="button"
              onClick={() => router.push('/world')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lyra-accent/15 hover:bg-lyra-accent/25 text-lyra-accent text-xs font-medium transition-colors cursor-pointer"
            >
              <ExternalLink size={13} />
              <span>Lihat di World HQ</span>
            </button>
          </div>
        </div>

        {/* Scrollable Work Feed (Todos, Tool Blocks, Reasoning, Deliverables) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
          {!sessionId ? (
            /* Welcome / Empty State */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-lyra-accent/10 border border-lyra-accent/20 flex items-center justify-center mb-4 text-lyra-accent shadow-lg">
                <Sparkles size={28} />
              </div>
              <h2 className="text-xl font-bold text-lyra-text mb-2">
                Pendelegasian Tugas Otonom Berjenjang
              </h2>
              <p className="text-sm text-lyra-text-secondary max-w-md mb-8 leading-relaxed">
                Berbeda dari chat biasa, mode ini menyusun rencana kerja (*Todos*), mengeksekusi perintah di komputer lokal Anda, dan mencentang setiap tahapan hingga selesai sempurna.
              </p>

              {/* Sample Quick Starters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl text-left">
                {[
                  { title: 'Scrape 20 Data Toko Roti', prompt: 'Cari 20 data toko roti di Jakarta beserta alamat dan websitenya, simpan ke file toko_roti.csv', agent: 'researcher' },
                  { title: 'Audit Keamanan & Dependency', prompt: 'Audit seluruh file package.json dan periksa potensi celah keamanan di dependensi proyek', agent: 'security' },
                  { title: 'Buat Modul Script Python', prompt: 'Buatkan script otomatisasi pembersih log dengan rotasi harian dan unit test', agent: 'coder' },
                  { title: 'Periksa & Refactor Performa', prompt: 'Analisis file konfigurasi dan optimalkan bundle build agar waktu load lebih cepat', agent: 'planner' }
                ].map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedAgent(s.agent);
                      setPromptInput(s.prompt);
                    }}
                    className="p-3.5 rounded-xl border border-lyra-accent/15 bg-lyra-surface/50 hover:bg-lyra-accent/10 hover:border-lyra-accent/30 transition-all text-left cursor-pointer group"
                  >
                    <div className="text-xs font-semibold text-lyra-text group-hover:text-lyra-accent transition-colors mb-1">
                      {s.title}
                    </div>
                    <div className="text-[11px] text-lyra-text-secondary/70 line-clamp-2 leading-relaxed">
                      {s.prompt}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Autonomous Execution Feed */
            <div className="space-y-5">
              {/* 1. Reasoning Accordions (Thought Process) */}
              {reasoningOrder.map((nodeId) => {
                const node = reasoningNodes[nodeId];
                if (!node) return null;
                return (
                  <ReasoningAccordion
                    key={node.id}
                    thought={node.thought}
                    isStreaming={node.id === activeReasoningId && node.isStreaming}
                  />
                );
              })}

              {/* 2. Tool Execution Block (Ran commands, Wrote files) */}
              {toolLogsList.length > 0 && (
                <ToolExecutionBlock toolLogs={toolLogsList} defaultExpanded={false} />
              )}

              {/* 3. Dynamic Todos Card (The Star Component from Z.ai reference) */}
              {todos.length > 0 && (
                <DynamicTodosCard todos={todos} />
              )}

              {/* 4. Deliverable / Handover Card */}
              {deliverable && (
                <DeliverableCard
                  artifact={deliverable}
                  onApprove={() => {
                    alert('Hasil pengerjaan disetujui!');
                    resetSession();
                  }}
                  onReject={() => {
                    alert('Permintaan revisi dikirimkan ke agen.');
                  }}
                />
              )}
            </div>
          )}

          <div ref={feedEndRef} />
        </div>

        {/* Bottom Autonomous Dispatch Prompt Bar */}
        <div className="p-4 border-t border-lyra-accent/10 bg-lyra-surface/80 backdrop-blur-md shrink-0">
          <form onSubmit={handleLaunchAutonomousWork} className="max-w-4xl mx-auto flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-lyra-text-secondary px-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs">Mode Pengerjaan:</span>
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="bg-lyra-surface border border-lyra-accent/20 rounded-lg px-2 py-0.5 text-xs text-lyra-text font-medium outline-none cursor-pointer hover:border-lyra-accent"
                >
                  <option value="default">✨ Full Autonomous Swarm (Semua Spesialis Bekerja Sama)</option>
                  {availableAgents.filter(a => a !== 'default').map((agId) => {
                    const info = getAgentInfo(agId);
                    return (
                      <option key={agId} value={agId} className="bg-lyra-surface text-lyra-text">
                        Spesifik: {info.name} ({info.role})
                      </option>
                    );
                  })}
                </select>
              </div>
              <span className="font-mono text-[11px] opacity-70 hidden sm:inline">
                Autonomous Studio • Bertahap & Berhasil Maksimal
              </span>
            </div>

            <div className="flex items-center gap-2 bg-lyra-bg border border-lyra-accent/20 focus-within:border-lyra-accent rounded-2xl p-2 transition-all shadow-sm">
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleLaunchAutonomousWork(e);
                  }
                }}
                rows={2}
                placeholder={language === 'id' 
                  ? 'Delegasikan instruksi tugas besar di sini (misal: "Buat sistem portfolio lengkap beserta CV PDF dan validasi linting")...' 
                  : 'Delegate a deep autonomous task here...'}
                className="flex-1 bg-transparent border-0 text-sm text-lyra-text placeholder:text-lyra-text-secondary/50 focus:outline-none resize-none px-2 py-1 leading-relaxed"
              />

              <button
                type="submit"
                disabled={!promptInput.trim() || isSubmitting}
                className="w-10 h-10 rounded-xl bg-lyra-accent hover:bg-lyra-accent/80 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md shrink-0 cursor-pointer active:scale-95"
                title="Jalankan Tugas Otonom"
              >
                <ArrowUp size={18} strokeWidth={2.5} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Workspace Explorer Panel with Minimal Edge Toggle */}
      <WorkspacePanel
        isOpen={isWorkspaceOpen}
        onToggle={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
        onMentionFile={(filePath) => {
          setPromptInput((prev) => `${prev} @${filePath} `);
        }}
      />
    </div>
  );
}
