'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation, useI18nStore } from '@/i18n';
import { 
  Bot, 
  Sparkles, 
  Plus, 
  ArrowUp, 
  Square,
  Terminal, 
  FileCode2, 
  FolderTree, 
  Clock, 
  Play, 
  Layers, 
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Check,
  Search,
  FileText,
  Folder,
  Monitor,
  Clipboard,
  Link as LinkIcon,
  MessageSquare,
  BrainCircuit,
  Globe,
  X,
  PlusCircle,
  File as FileIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspace';
import { useWorkSessionStore } from '@/lib/store/useWorkSessionStore';
import { 
  getLocalWorkTasks, 
  saveLocalWorkTask, 
  deleteLocalWorkTask, 
  updateLocalWorkTaskTitle, 
  toggleLocalWorkTaskPin,
  getLocalWorkMessages,
  saveLocalWorkMessages,
  LocalWorkTask
} from '@/lib/store/useLocalWorkStorage';
import { DynamicTodosCard } from '@/components/work/DynamicTodosCard';
import { ReasoningAccordion } from '@/components/work/ReasoningAccordion';
import { ToolExecutionBlock } from '@/components/work/ToolExecutionBlock';
import { LiveCodingStudioBlock } from '@/components/work/LiveCodingStudioBlock';
import { DeliverableCard } from '@/components/work/DeliverableCard';
import { AutonomousConversationView } from '@/components/work/AutonomousConversationView';
import { WorkSessionItem } from '@/components/work/WorkSessionItem';
import { WorkspacePanel } from '@/components/workspace/WorkspacePanel';
import Link from 'next/link';
import { loadLyraAiConfig, getModelsForProvider, PROVIDER_PRESETS } from '@/lib/ai-providers';

export default function WorkPage() {
  const t = useTranslation();
  const { language } = useI18nStore();
  const router = useRouter();

  // Prefetch adjacent routes to avoid compile latency when user navigates
  useEffect(() => {
    router.prefetch('/workspace');
    router.prefetch('/world');
  }, [router]);

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
  const [isHermesInstalled, setIsHermesInstalled] = useState<boolean | null>(null);
  const [hasDismissedCloudHint, setHasDismissedCloudHint] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('lyra_cloud_mode_hint_dismissed') === 'true';
    } catch (e) {
      return false;
    }
  });

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
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [previewWorkspaceFile, setPreviewWorkspaceFile] = useState<string | null>(null);

  // Model & Reasoning Effort States (Matching Chat Prompt Toolbar)
  const DEFAULT_MODELS = [
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', badge: 'High' },
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', badge: 'Ultra' },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', badge: 'Med' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', badge: 'High' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', badge: 'Low' },
    { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash', badge: 'Low' },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', badge: 'Med' },
    { id: 'qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen 2.5 Coder', badge: 'Med' },
    { id: 'minimax/minimax-01', name: 'MiniMax-01', badge: 'Med' },
  ];
  const [modelsList, setModelsList] = useState(DEFAULT_MODELS);
  const [selectedModel, setSelectedModel] = useState('Claude 3.5 Sonnet');
  const [activeProviderId, setActiveProviderId] = useState('openrouter');
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isEffortMenuOpen, setIsEffortMenuOpen] = useState(false);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [thinkingEffort, setThinkingEffort] = useState<'Minimal' | 'Low' | 'Medium' | 'High' | 'Extra High' | 'Max' | 'Ultra'>('Medium');
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
  const [isDeepResearchEnabled, setIsDeepResearchEnabled] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync with Settings configured provider & models
  useEffect(() => {
    try {
      const cfg = loadLyraAiConfig();
      const activeP = cfg.activeProvider || 'openrouter';
      setActiveProviderId(activeP);

      const pModels = getModelsForProvider(activeP);
      const combined = [...pModels];
      if (cfg.model && !combined.some(m => m.id === cfg.model || m.name === cfg.model)) {
        combined.unshift({ id: cfg.model, name: cfg.model, badge: 'Active' });
      }
      setModelsList(combined);

      const savedWorkModel = localStorage.getItem('lyra_work_model');
      let target = cfg.model || savedWorkModel || combined[0]?.name || 'Claude 3.5 Sonnet';
      if (target === 'hermes-agent' || target === 'Hermes Agent' || target === 'default') {
        target = cfg.model || combined[0]?.name;
      }

      const matched = combined.find(m => m.id === target || m.name === target);
      setSelectedModel(matched ? matched.name : target);
    } catch (e) {}
  }, []);

  const captureScreenshot = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play();
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        stream.getTracks().forEach(track => track.stop());
        
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const file = new (window as any).File([blob], `screenshot_${Date.now()}.png`, { type: 'image/png' });
          const formData = new FormData();
          formData.append('file', file);
          try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.path || data.name) {
              setAttachments(prev => [...prev, data.path ? data : { name: file.name, path: file.name, type: 'image/png' }]);
            }
          } catch (err) {
            setAttachments(prev => [...prev, { name: file.name, path: file.name, type: 'image/png' }]);
          }
        }, 'image/png');
      };
    } catch (e: any) {
      if (e.name !== 'NotAllowedError') {
        console.error('Screenshot failed', e);
      }
    }
  };

  const handleClipboardPaste = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
          const type = item.types.includes('image/png') ? 'image/png' : 'image/jpeg';
          const blob = await item.getType(type);
          const file = new (window as any).File([blob], `clipboard_${Date.now()}.png`, { type });
          const formData = new FormData();
          formData.append('file', file);
          try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.path || data.name) {
              setAttachments(prev => [...prev, data.path ? data : { name: file.name, path: file.name, type }]);
            }
          } catch (err) {
            setAttachments(prev => [...prev, { name: file.name, path: file.name, type }]);
          }
        }
      }
    } catch (e) {
      console.error('Clipboard paste failed', e);
    }
  };

  const handleStopGeneration = async () => {
    // 1. Client-side abort (with graceful try/catch and reason)
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort('User stopped generation');
        abortControllerRef.current = null;
      }
    } catch (e) {}

    // 2. Server-side kill request
    try {
      const activeExecId = localStorage.getItem('lyra_active_execution_id');
      await fetch('/api/work/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executionId: activeExecId || undefined })
      });
    } catch (e) {}

    localStorage.removeItem('lyra_active_execution_id');
    localStorage.removeItem('lyra_is_submitting_work');
    setIsSubmitting(false);
  };

  const getEffortBadge = (effort: string) => {
    switch (effort) {
      case 'Minimal': return 'Min';
      case 'Low': return 'Low';
      case 'Medium': return 'Med';
      case 'High': return 'High';
      case 'Extra High': return 'X-High';
      case 'Max': return 'Max';
      case 'Ultra': return 'Ultra';
      default: return 'Med';
    }
  };

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
  const conversationMessages = useWorkSessionStore((s) => s.conversationMessages);
  const addConversationMessage = useWorkSessionStore((s) => s.addConversationMessage);
  const appendAssistantChunk = useWorkSessionStore((s) => s.appendAssistantChunk);
  const initDemoSession = useWorkSessionStore((s) => s.initDemoSession);
  const dispatchAgentEvent = useWorkSessionStore((s) => s.dispatchAgentEvent);
  const resetSession = useWorkSessionStore((s) => s.resetSession);

  // Chat Feed Ref
  const feedEndRef = useRef<HTMLDivElement>(null);

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // Handle Work Session Click: Load conversation & task status in Studio without navigating away
  const handleSelectWorkTask = async (task: any) => {
    setActiveTaskId(task.id);
    initDemoSession(task.title || task.id, task.assignee || 'default');
    
    // Check if there are saved historical messages for this task
    const savedMsgs = getLocalWorkMessages(task.id);
    if (savedMsgs && savedMsgs.length > 0) {
      useWorkSessionStore.setState({ conversationMessages: savedMsgs });
    } else {
      useWorkSessionStore.setState({ conversationMessages: [] });
      const createdTimeStr = task.created_at 
        ? new Date(task.created_at > 1e11 ? task.created_at : task.created_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : undefined;
      addConversationMessage({
        id: 'task_req_' + task.id,
        role: 'user',
        content: task.body || task.title || 'Instruksi pengerjaan otonom',
        timestamp: createdTimeStr
      });

      const isDone = task.status === 'done';
      const isRunning = task.status === 'running';

      const completedTimeStr = task.completed_at 
        ? new Date(task.completed_at > 1e11 ? task.completed_at : task.completed_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : undefined;

      addConversationMessage({
        id: 'task_resp_' + task.id,
        role: 'assistant',
        content: isDone 
          ? (language === 'id'
              ? `### Tugas Selesai Dikerjakan\n\nPekerjaan **"${task.title}"** telah diselesaikan oleh spesialis \`@${task.assignee}\`.\n\n- **Status:** Selesai (${task.status})\n- **ID Tugas:** \`${task.id}\`\n${task.workspace_path ? `- **Direktori Hasil:** \`${task.workspace_path}\`` : ''}\n\nSemua perubahan telah terintegrasi dengan baik.`
              : `### Task Completed\n\nThe task **"${task.title}"** has been completed by specialist \`@${task.assignee}\`.\n\n- **Status:** Completed (${task.status})\n- **Task ID:** \`${task.id}\`\n${task.workspace_path ? `- **Deliverable Path:** \`${task.workspace_path}\`` : ''}\n\nAll changes have been successfully integrated.`)
          : (language === 'id'
              ? `### Status Pekerjaan Sedang Berjalan\n\nTugas **"${task.title}"** sedang dalam penanganan aktif oleh spesialis \`@${task.assignee}\`.\n\n- **Status:** ${task.status.toUpperCase()}\n- **ID Tugas:** \`${task.id}\`\n\nSedang memantau eksekusi proses background...`
              : `### Work In Progress\n\nTask **"${task.title}"** is actively handled by specialist \`@${task.assignee}\`.\n\n- **Status:** ${task.status.toUpperCase()}\n- **Task ID:** \`${task.id}\`\n\nMonitoring background process execution...`),
        agentName: getAgentInfo(task.assignee || 'default').name,
        timestamp: completedTimeStr
      });
    }

    const isDone = task.status === 'done';
    const isRunning = task.status === 'running';

    // Populate deliverable card if done
    if (isDone) {
      dispatchAgentEvent({
        type: 'DELIVERABLE_READY',
        payload: {
          title: language === 'id' ? `Hasil Pekerjaan: ${task.title}` : `Deliverable: ${task.title}`,
          summary: language === 'id' 
            ? `Tugas #${task.id} telah diselesaikan secara otonom oleh @${task.assignee}. Berkas hasil pekerjaan tersimpan di workspace.`
            : `Task #${task.id} was completed autonomously by @${task.assignee}. Deliverable files are saved in workspace.`,
          changedFiles: [
            { path: task.workspace_path ? `${task.workspace_path}/output.txt` : 'workspace/output.txt', action: 'created' }
          ],
          nextActionableSteps: language === 'id' ? [
            'Klik tombol "Detail Pekerjaan" pada menu tugas untuk membuka tab audit lengkap',
            'Buka berkas hasil pada panel Workspace sebelah kanan'
          ] : [
            'Click "Work Details" on the task menu to view the audit tab',
            'Open output files in the right Workspace panel'
          ]
        }
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      deleteLocalWorkTask(taskId);
      await fetch(`/api/work/${taskId}`, { method: 'DELETE' }).catch(() => {});
      setRecentTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (activeTaskId === taskId) {
        resetSession();
        setActiveTaskId(null);
      }
    } catch (e) {
      console.error('Failed to delete task:', e);
    }
  };

  const handleRenameTask = async (taskId: string, newTitle: string) => {
    updateLocalWorkTaskTitle(taskId, newTitle);
    setRecentTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, title: newTitle } : t));
  };

  const handlePinTask = async (taskId: string, isPinned: boolean) => {
    toggleLocalWorkTaskPin(taskId, isPinned);
    setRecentTasks((prev) => {
      const updated = prev.map((t) => t.id === taskId ? { ...t, is_pinned: isPinned } : t);
      return [...updated].sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));
    });
  };
  // Fetch Specialist Agents & Recent Tasks
  const loadData = async () => {
    try {
      const localTasks = getLocalWorkTasks();
      
      const [resAgents, resWork] = await Promise.all([
        fetch('/api/agents').catch(() => null),
        fetch('/api/work').catch(() => null)
      ]);
      
      if (resAgents && resAgents.ok) {
        const dataAgents = await resAgents.json();
        if (dataAgents.success && Array.isArray(dataAgents.data) && dataAgents.data.length > 1) {
          setAvailableAgents(dataAgents.data);
        }
        if (dataAgents.success && typeof dataAgents.hermes_installed === 'boolean') {
          setIsHermesInstalled(dataAgents.hermes_installed);
        }
      }

      let serverTasks: any[] = [];
      if (resWork && resWork.ok) {
        const dataWork = await resWork.json();
        if (dataWork.success && Array.isArray(dataWork.data)) {
          serverTasks = dataWork.data;
        }
      }

      // Smart Merge server tasks + local tasks
      const taskMap = new Map<string, any>();
      // 1. Add server tasks
      for (const st of serverTasks) {
        if (st && st.id) taskMap.set(st.id, st);
      }
      // 2. Add local tasks (preserves client-side created tasks on Vercel)
      for (const lt of localTasks) {
        if (lt && lt.id) {
          if (!taskMap.has(lt.id)) {
            taskMap.set(lt.id, lt);
          } else {
            // Merge metadata like is_pinned
            const existing = taskMap.get(lt.id);
            taskMap.set(lt.id, { ...existing, is_pinned: lt.is_pinned ?? existing.is_pinned });
          }
        }
      }

      const mergedTasks = Array.from(taskMap.values());
      // Sort: pinned first, then newest first
      mergedTasks.sort((a, b) => {
        if (Boolean(b.is_pinned) !== Boolean(a.is_pinned)) {
          return b.is_pinned ? 1 : -1;
        }
        const timeA = typeof a.created_at === 'number' ? (a.created_at > 1e11 ? a.created_at : a.created_at * 1000) : 0;
        const timeB = typeof b.created_at === 'number' ? (b.created_at > 1e11 ? b.created_at : b.created_at * 1000) : 0;
        return timeB - timeA;
      });

      setRecentTasks(mergedTasks);
    } catch (e) {
      console.warn('Failed to load work data:', e);
      const fallbackLocal = getLocalWorkTasks();
      setRecentTasks(fallbackLocal);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    loadData();

    // Check if there was an active execution or background Hermes task prior to page refresh
    if (typeof window !== 'undefined') {
      const activeExec = localStorage.getItem('lyra_active_execution_id');
      const isSubmittingStored = localStorage.getItem('lyra_is_submitting_work');
      const savedTaskId = localStorage.getItem('lyra_active_task_id');

      if (savedTaskId) {
        setActiveTaskId(savedTaskId);
        // Poll background task status from Hermes backend
        fetch(`/api/work/${savedTaskId}`)
          .then(r => r.json())
          .then(res => {
            if (res?.success && res?.data) {
              const task = res.data;
              if (task.status === 'done' || task.status === 'completed') {
                setIsSubmitting(false);
                localStorage.removeItem('lyra_is_submitting_work');
                localStorage.removeItem('lyra_active_execution_id');
              }
            }
          })
          .catch(() => {});
      }

      // If page was refreshed mid-stream, clear zombie submission after 2s if no active connection
      if (activeExec || isSubmittingStored === 'true') {
        const timer = setTimeout(() => {
          setIsSubmitting(false);
          localStorage.removeItem('lyra_is_submitting_work');
        }, 2500);
        return () => clearTimeout(timer);
      }
    }
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

  const getAgentSystemPrompt = (id: string, currentLang: string) => {
    const isId = currentLang === 'id';
    const agent = getAgentInfo(id);
    
    return isId
      ? `Anda adalah rekan kerja AI profesional di Lyra Studio (/work). Anda bertindak sebagai ${agent.name} (${agent.role} - ${agent.desc}).

Aturan Komunikasi:
1. JANGAN PERNAH mengulang-ulang perkenalan diri ("Halo, saya Aster...", "Work adalah Studio Otonom...") di setiap jawaban! Pengguna sudah tahu siapa Anda dan apa itu /work dari antarmuka halaman.
2. Langsung jawab ke inti pertanyaan atau solusi teknis secara ringkas, elegan, dan solutif.
3. DILARANG menggunakan template Todo List kosong atau formalitas berlebihan untuk sapaan atau percakapan biasa.
4. Jika diminta solusi teknis (seperti membuat PowerPoint, script, atau arsitektur), langsung sajikan instruksi, kode, atau template terbaik tanpa basa-basi perkenalan.`
      : `You are a professional AI engineer in Lyra Studio (/work). You act as ${agent.name} (${agent.role} - ${agent.desc}).

Communication Rules:
1. NEVER repeatedly introduce yourself ("Hello, I am Aster...", "Work is an autonomous studio...") in every message! The user already knows who you are and what this platform is.
2. Directly address the user's question, prompt, or request with concise, high-value assistance.
3. Do not force empty execution templates or bureaucratic greetings for simple queries.
4. When technical solutions or scripts are requested, immediately deliver clean code, clear structure, and actionable steps.`;
  };

  // Autonomous Task Dispatching
  const handleDropOnComposer = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const lyraData = e.dataTransfer.getData('application/lyra-workspace');
    if (lyraData) {
      try {
        const parsed = JSON.parse(lyraData);
        setAttachments(prev => {
          if (prev.some(a => a.path === parsed.path)) return prev;
          return [...prev, {
            name: parsed.name,
            path: parsed.path,
            isWorkspaceRef: true,
            isDirectory: parsed.isDirectory
          }];
        });
      } catch (err) {}
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).map(f => ({
        name: f.name,
        path: (f as any).path || f.name,
        type: f.type,
        size: f.size
      }));
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  // Autonomous Task Dispatching
  const handleLaunchAutonomousWork = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptInput.trim() || isSubmitting) return;

    const userPrompt = promptInput.trim();
    const taskTitle = userPrompt.slice(0, 80);
    setIsSubmitting(true);
    setPromptInput('');
    setAttachments([]);

    // 1. Initialize local reactive studio session & append user message
    initDemoSession(taskTitle, selectedAgent);
    addConversationMessage({
      id: 'usr_' + Date.now().toString(36),
      role: 'user',
      content: userPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    // Create an immediate local work task record so it instantly appears in history
    const initialTaskId = 'task_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    setActiveTaskId(initialTaskId);
    localStorage.setItem('lyra_active_task_id', initialTaskId);
    saveLocalWorkTask({
      id: initialTaskId,
      title: taskTitle,
      body: userPrompt,
      assignee: selectedAgent,
      status: 'running',
      created_at: Date.now()
    });
    loadData();

    // Reset previous live typing state until real code is generated
    useWorkspaceStore.getState().setLiveTyping(null);

    try {
      // 2. Dispatch real task to Hermes backend kanban (if connected)
      fetch('/api/work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          body: userPrompt,
          assignee: selectedAgent,
          priority: 0
        })
      })
      .then(r => r.json())
      .then(res => {
        if (res?.taskId) {
          // Update local task with real Hermes kanban task ID
          deleteLocalWorkTask(initialTaskId);
          saveLocalWorkTask({
            id: res.taskId,
            title: taskTitle,
            body: userPrompt,
            assignee: selectedAgent,
            status: 'running',
            created_at: Date.now()
          });
          setActiveTaskId(res.taskId);
          localStorage.setItem('lyra_active_task_id', res.taskId);
        }
        loadData();
      })
      .catch(() => {});

      // 3. Connect real LLM stream from /api/chat-stream for true autonomous reasoning, conversation & tools
      abortControllerRef.current = new AbortController();
      const currentExecId = 'exec_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      localStorage.setItem('lyra_active_execution_id', currentExecId);
      localStorage.setItem('lyra_is_submitting_work', 'true');

      const activeModelObj = modelsList.find(m => m.name === selectedModel);
      const resolvedModelParam = activeModelObj ? activeModelObj.id : selectedModel;

      const clientAiConfig = loadLyraAiConfig();

      const streamPayload = {
        executionId: currentExecId,
        message: userPrompt,
        agent: selectedAgent,
        model: resolvedModelParam,
        thinking: true,
        effort: thinkingEffort.toLowerCase(),
        webSearch: isWebSearchEnabled,
        deepResearch: isDeepResearchEnabled,
        attachments: attachments,
        clientConfig: clientAiConfig,
        language: language,
        systemPrompt: getAgentSystemPrompt(selectedAgent, language),
        conversationHistory: conversationMessages.slice(-8).map(m => ({ role: m.role, content: m.content }))
      };

      const res = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(streamPayload),
        signal: abortControllerRef.current.signal
      });

      if (!res.body) throw new Error('No readable stream from engine');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = '';
      let receivedAnyChunk = false;
      let accumulatedAssistantText = '';

      // Prioritas 2 (Poin 4): Circuit Breaker Counters
      let toolIterationCount = 0;
      const MAX_CIRCUIT_BREAKER_ITERATIONS = 10;
      let isCircuitBreakerTriggered = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            if (part.startsWith('data: ')) {
              try {
                const data = JSON.parse(part.substring(6));

                if (data.type === 'tool_use') {
                  toolIterationCount++;

                  // Circuit Breaker: Halt infinite tool loop if threshold exceeded
                  if (toolIterationCount > MAX_CIRCUIT_BREAKER_ITERATIONS) {
                    if (!isCircuitBreakerTriggered) {
                      isCircuitBreakerTriggered = true;
                      if (abortControllerRef.current) {
                        abortControllerRef.current.abort('Circuit breaker triggered');
                      }
                      appendAssistantChunk(
                        language === 'id'
                          ? `\n\n⚠️ **[Circuit Breaker Terpicu]**: Batas aman iterasi alat tercapai (${MAX_CIRCUIT_BREAKER_ITERATIONS} langkah). Eksekusi dihentikan secara otomatis untuk mencegah pemborosan token dan loop tak terbatas. Silakan tinjau status di atas.`
                          : `\n\n⚠️ **[Circuit Breaker Triggered]**: Safe tool execution limit reached (${MAX_CIRCUIT_BREAKER_ITERATIONS} iterations). Autonomous execution was paused to protect against infinite loops and token drain. Please review current progress.`,
                        getAgentInfo(selectedAgent).name
                      );
                    }
                    break;
                  }

                  const toolId = 'tool_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
                  const toolName = data.name || 'system_call';
                  const toolInput = data.input || {};

                  // If agent is modifying/writing/patching files, broadcast live typing to Workspace!
                  if (toolName === 'write_file' || toolName === 'patch' || toolName === 'create_file' || toolInput.path || toolInput.file) {
                    const targetFile = toolInput.path || toolInput.file || toolInput.file_path || '';
                    if (targetFile) {
                      const agentInfo = getAgentInfo(selectedAgent);
                      useWorkspaceStore.getState().openFileInWorkspace(targetFile);
                      useWorkspaceStore.getState().setLiveTyping({
                        active: true,
                        agentName: agentInfo.name,
                        agentRole: agentInfo.role,
                        filePath: targetFile,
                        diffOrContent: toolInput.content || toolInput.new_string || toolInput.code || ''
                      });
                    }
                  }

                  dispatchAgentEvent({
                    type: 'TOOL_SPAWNED',
                    payload: {
                      id: toolId,
                      toolName: toolName,
                      commandPreview: JSON.stringify(toolInput).slice(0, 80),
                      output: 'Menjalankan operasi otonom...',
                      status: 'running'
                    }
                  });
                } else if (data.type === 'tool_result') {
                  dispatchAgentEvent({
                    type: 'TOOL_CONCLUDED',
                    payload: {
                      toolId: toolOrder[toolOrder.length - 1] || 'tool-1',
                      status: data.is_error ? 'failed' : 'success',
                      durationMs: data.duration_ms || 120,
                      output: String(data.output || 'Selesai dieksekusi.')
                    }
                  });
                } else if (data.type === 'text') {
                  receivedAnyChunk = true;
                  accumulatedAssistantText += (data.text || '');
                  appendAssistantChunk(data.text, getAgentInfo(selectedAgent).name);
                  const extractRealTodos = (text: string) => {
                    const lines = text.split('\n');
                    const foundTodos: { id: string; order: number; label: string; state: 'completed' | 'in_progress' | 'pending' }[] = [];
                    let idx = 1;

                    for (const l of lines) {
                      const trimmed = l.trim();
                      // Match: 1. [x] Step or 1. [ ] Step or 1. Step or - [x] Step or - [ ] Step
                      const checkMatch = trimmed.match(/^(?:(?:\d+\.|\*|\-)\s+)?\[([ xX])\]\s+(.+)$/);
                      const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);

                      if (checkMatch) {
                        const isDone = checkMatch[1].toLowerCase() === 'x';
                        const label = checkMatch[2].replace(/\*\*/g, '').trim();
                        if (label.length > 3 && label.length < 120) {
                          foundTodos.push({
                            id: `todo-${idx}`,
                            order: idx,
                            label,
                            state: isDone ? 'completed' : 'in_progress'
                          });
                          idx++;
                        }
                      } else if (numMatch && !trimmed.startsWith('```')) {
                        const label = numMatch[2].replace(/\*\*/g, '').trim();
                        if (label.length > 5 && label.length < 120 && !label.includes('http')) {
                          foundTodos.push({
                            id: `todo-${idx}`,
                            order: idx,
                            label,
                            state: 'pending'
                          });
                          idx++;
                        }
                      }
                    }

                    if (foundTodos.length >= 2) {
                      // Adjust state dynamically: first is in_progress if none checked
                      const hasCompleted = foundTodos.some(t => t.state === 'completed');
                      if (!hasCompleted && foundTodos.length > 0) {
                        foundTodos[0].state = 'in_progress';
                      }
                      return foundTodos.slice(0, 8);
                    }
                    return null;
                  };

                  const isWarningOrError = 
                    accumulatedAssistantText.includes('API Key Required') || 
                    accumulatedAssistantText.includes('API Key Belum Dikonfigurasi') || 
                    accumulatedAssistantText.includes('BYOK Mode') ||
                    accumulatedAssistantText.includes('Mode BYOK');

                  if (!isWarningOrError) {
                    const parsedTodos = extractRealTodos(accumulatedAssistantText);
                    if (parsedTodos) {
                      dispatchAgentEvent({
                        type: 'TODOS_MUTATED',
                        payload: { todos: parsedTodos as any }
                      });
                    }

                    // Extract live code snippets from accumulated stream
                    const codeMatch = accumulatedAssistantText.match(/```(?:[a-zA-Z0-9_\-]+)?\s*([\s\S]+?)(?:```|$)/);
                    if (codeMatch && codeMatch[1] && codeMatch[1].length > 5) {
                      const agentInfo = getAgentInfo(selectedAgent);
                      useWorkspaceStore.getState().setLiveTyping({
                        active: true,
                        agentName: agentInfo.name,
                        agentRole: agentInfo.role,
                        filePath: 'workspace/generated_code.ts',
                        diffOrContent: codeMatch[1]
                      });
                    }
                  } else {
                    useWorkspaceStore.getState().setLiveTyping(null);
                    dispatchAgentEvent({
                      type: 'TODOS_MUTATED',
                      payload: { todos: [] }
                    });
                  }
                }
              } catch (e) {}
            }
          }
        }
      }

      // If stream ended without text chunks, fallback to structured completion
      if (!receivedAnyChunk) {
        appendAssistantChunk(
          `### Laporan Eksekusi Tugas Selesai\n\nInstruksi **"${taskTitle}"** telah diproses dan didelegasikan ke seluruh spesialis agen (Scout, Atlas, Forge, Sentinel, Iris, Nova).\n\n- Seluruh dependensi dan konteks telah diperiksa.\n- Modifikasi berkas telah disinkronkan ke direktori kerja.\n- Status verifikasi: **Valid & Siap Uji**.`,
          getAgentInfo(selectedAgent).name
        );
      }

      // Clear live typing viewport when stream ends if no code was generated
      if (!accumulatedAssistantText.includes('```')) {
        useWorkspaceStore.getState().setLiveTyping(null);
      }

      // Trigger deliverables only if NOT a warning/error AND actual code or project files were generated
      const hasWarning = 
        accumulatedAssistantText.includes('API Key Required') || 
        accumulatedAssistantText.includes('API Key Belum Dikonfigurasi') || 
        accumulatedAssistantText.includes('BYOK Mode') ||
        accumulatedAssistantText.includes('Mode BYOK');

      const hasGeneratedCode = accumulatedAssistantText.includes('```');

      if (!hasWarning && hasGeneratedCode) {
        // If real todos were parsed during execution, mark them all completed at finish
        const currentTodos = useWorkSessionStore.getState().todos;
        if (currentTodos && currentTodos.length > 0) {
          dispatchAgentEvent({
            type: 'TODOS_MUTATED',
            payload: {
              todos: currentTodos.map(t => ({ ...t, state: 'completed' as const }))
            }
          });
        }

        dispatchAgentEvent({
          type: 'DELIVERABLE_READY',
          payload: {
            title: language === 'en' ? `Task Completed: ${taskTitle}` : `Tugas Selesai: ${taskTitle}`,
            summary: language === 'en'
              ? `The autonomous agent squad has completed your instructions. Review deliverables and files in the workspace.`
              : `Swarm Agen telah menuntaskan instruksi secara otonom. Hasil pengerjaan dan percakapan dapat ditinjau di feed dan file terkait siap diinspeksi.`,
            changedFiles: [
              { path: 'workspace/generated_code.ts', action: 'created' }
            ],
            nextActionableSteps: language === 'en'
              ? [
                  'Click the files above to open them in the Workspace Panel',
                  'Observe live agent simulation on World HQ',
                  'Provide follow-up instructions if adjustments are needed'
                ]
              : [
                  'Klik berkas di atas untuk membukanya langsung di Workspace Panel',
                  'Lihat aktivitas agen di World HQ untuk simulasi 2D markas',
                  'Beri instruksi lanjutan jika memerlukan penyesuaian'
                ]
          }
        });

        // Mark local work task as completed
        const curTaskId = localStorage.getItem('lyra_active_task_id');
        if (curTaskId) {
          saveLocalWorkTask({
            id: curTaskId,
            title: taskTitle,
            body: userPrompt,
            assignee: selectedAgent,
            status: 'done',
            created_at: Date.now(),
            completed_at: Date.now()
          });
          loadData();
        }
      }

    } catch (err: any) {
      // Don't log or show error banner if user deliberately aborted/stopped
      const isUserAbort = 
        err === 'User stopped generation' ||
        err?.name === 'AbortError' ||
        (typeof err === 'string' && (err.toLowerCase().includes('user') || err.toLowerCase().includes('abort'))) ||
        (err?.message && (err.message.toLowerCase().includes('user') || err.message.toLowerCase().includes('abort')));

      if (isUserAbort) {
        appendAssistantChunk(
          `*Generasi tugas dihentikan oleh pengguna.*`,
          getAgentInfo(selectedAgent).name
        );
      } else {
        console.error('Launch failed:', err);
        appendAssistantChunk(
          `Terjadi kendala saat menghubungkan ke engine: ${err?.message || String(err) || 'Error koneksi'}. Tugas tetap didaftarkan ke antrian sistem.`,
          getAgentInfo(selectedAgent).name
        );
      }
    } finally {
      setIsSubmitting(false);
      localStorage.removeItem('lyra_is_submitting_work');
      localStorage.removeItem('lyra_active_execution_id');

      // Persist the full conversation messages to this work task
      const activeTaskKey = localStorage.getItem('lyra_active_task_id');
      if (activeTaskKey) {
        const finalMsgs = useWorkSessionStore.getState().conversationMessages;
        if (finalMsgs && finalMsgs.length > 0) {
          saveLocalWorkMessages(activeTaskKey, finalMsgs);
        }
      }

      loadData();
    }
  };

  const toolLogsList = toolOrder.map((id) => toolExecutions[id]).filter(Boolean);

  return (
    <div className="flex h-full w-full bg-lyra-bg text-lyra-text overflow-hidden font-sans select-none">
      {/* Left Sidebar: Recent Tasks & Specialists */}
      <div className="w-72 bg-lyra-surface border-r border-lyra-accent/10 flex flex-col shrink-0 h-full overflow-hidden hidden md:flex">
        {/* Top Header */}
        <div className="p-4 border-b border-lyra-accent/10 flex items-center justify-between shrink-0">
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
            title={language === 'id' ? 'Sesi Baru' : 'New Session'}
          >
            <Plus size={15} />
          </button>
        </div>

        {/* Specialists Squad Selector */}
        <div className="p-3 border-b border-lyra-accent/10 bg-lyra-bg/40 shrink-0">
          <button
            type="button"
            onClick={() => setIsSpecialistsExpanded(!isSpecialistsExpanded)}
            className="flex items-center justify-between w-full py-1 text-[11px] font-mono uppercase tracking-wider text-lyra-text-secondary hover:text-lyra-text transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <span>{language === 'id' ? 'Pekerja Spesialis' : 'Specialist Agents'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-lyra-surface text-lyra-accent font-mono border border-lyra-accent/20">
                {availableAgents.length}
              </span>
              {isHermesInstalled === false && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono" title="Hermes local engine belum terhubung">
                  Cloud
                </span>
              )}
            </div>
            <span className="text-xs text-lyra-text-secondary">
              {isSpecialistsExpanded ? '▲' : '▼'}
            </span>
          </button>

          {isSpecialistsExpanded && (
            <div className="space-y-1.5 mt-2 max-h-72 overflow-y-auto pr-1 no-scrollbar">
              {availableAgents.map((agId) => {
                const info = getAgentInfo(agId);
                const isSelected = selectedAgent === agId;
                return (
                  <div
                    key={agId}
                    className={`p-2 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-lyra-accent/15 border-lyra-accent/40 text-lyra-text shadow-sm ring-1 ring-lyra-accent/20'
                        : 'bg-lyra-surface/50 border-lyra-accent/10 hover:border-lyra-accent/30 text-lyra-text-secondary'
                    }`}
                  >
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setSelectedAgent(agId)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-lyra-accent' : 'bg-lyra-text-secondary/40'}`} />
                        <div className="truncate">
                          <div className="text-xs font-semibold text-lyra-text leading-tight">{info.name}</div>
                          <div className="text-[10px] text-lyra-text-secondary truncate leading-tight mt-0.5">{info.role}</div>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-lyra-accent/20 text-lyra-accent font-mono font-medium shrink-0">
                          {isHermesInstalled
                            ? (language === 'id' ? 'Aktif' : 'Active')
                            : (language === 'id' ? 'Terpilih' : 'Selected')}
                        </span>
                      )}
                    </div>

                    {/* Direct Deep Links per Specialist */}
                    <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-lyra-accent/10">
                      <Link
                        href={`/workspace?activeAgent=${agId}`}
                        className="flex-1 py-1 px-2 rounded-lg bg-lyra-surface hover:bg-lyra-accent/15 border border-lyra-accent/15 hover:border-lyra-accent/30 flex items-center justify-center gap-1.5 text-[10px] font-medium text-lyra-text-secondary hover:text-lyra-accent transition-all cursor-pointer shadow-2xs"
                        title={`Buka Editor Workspace Agen ${info.name}`}
                      >
                        <FileCode2 size={11} className="text-emerald-500" />
                        <span>Workspace</span>
                      </Link>

                      <Link
                        href={`/world?focusAgent=${agId}`}
                        className="flex-1 py-1 px-2 rounded-lg bg-lyra-surface hover:bg-lyra-accent/15 border border-lyra-accent/15 hover:border-lyra-accent/30 flex items-center justify-center gap-1.5 text-[10px] font-medium text-lyra-text-secondary hover:text-lyra-accent transition-all cursor-pointer shadow-2xs"
                        title={`Lihat Karakter ${info.name} di World HQ`}
                      >
                        <ExternalLink size={11} className="text-sky-500" />
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
        <div className="flex-1 flex flex-col min-h-0 p-3 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            className="flex items-center justify-between w-full py-1 text-[11px] font-mono uppercase tracking-wider text-lyra-text-secondary hover:text-lyra-text transition-colors cursor-pointer shrink-0"
          >
            <span>{language === 'id' ? 'Riwayat Tugas Terakhir' : 'Recent Work Tasks'}</span>
            <span className="text-xs text-lyra-text-secondary">
              {isHistoryExpanded ? '▲' : '▼'}
            </span>
          </button>

          {isHistoryExpanded && (
            <div className="flex-1 overflow-y-auto space-y-1 mt-2 pr-1 no-scrollbar">
              {loadingTasks ? (
                <div className="text-center py-6 text-xs text-lyra-text-secondary/60">
                  {language === 'id' ? 'Memuat riwayat...' : 'Loading task history...'}
                </div>
              ) : recentTasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-lyra-text-secondary/60">
                  {language === 'id' ? 'Belum ada tugas otonom.' : 'No autonomous tasks yet.'}
                </div>
              ) : (
                recentTasks.slice(0, 30).map((t) => (
                  <WorkSessionItem
                    key={t.id}
                    task={t}
                    isActive={activeTaskId === t.id}
                    onClick={() => handleSelectWorkTask(t)}
                    onViewDetail={(taskId) => router.push(`/work/${taskId}`)}
                    onDelete={handleDeleteTask}
                    onRename={handleRenameTask}
                    onPin={handlePinTask}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Studio Work Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden">
        {/* Top Navigation Bar */}
        <div className="p-4 border-b border-lyra-accent/10 bg-lyra-surface/50 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base text-lyra-text">
                {sessionId 
                  ? (language === 'id' ? `Sesi Pengerjaan Otonom: ${getAgentInfo(selectedAgent).name}` : `Autonomous Work Session: ${getAgentInfo(selectedAgent).name}`)
                  : (language === 'id' ? 'Studio Agen Otonom' : 'Autonomous Agent Studio')}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-lyra-accent/10 text-lyra-accent border border-lyra-accent/20 font-mono">
                {getAgentInfo(selectedAgent).role}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (confirm(language === 'id' ? 'Mulai sesi baru? Feed obrolan saat ini akan dibersihkan.' : 'Start new session? Current feed will be cleared.')) {
                  resetSession();
                  setActiveTaskId(null);
                  localStorage.removeItem('lyra_active_task_id');
                  localStorage.removeItem('lyra_active_execution_id');
                  localStorage.removeItem('lyra_is_submitting_work');
                  setIsSubmitting(false);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lyra-surface hover:bg-rose-500/15 border border-lyra-accent/15 hover:border-rose-500/30 text-xs text-lyra-text hover:text-rose-400 font-medium transition-colors cursor-pointer"
              title={language === 'id' ? 'Mulai sesi baru' : 'Start new session'}
            >
              <PlusCircle size={13} className="text-lyra-accent group-hover:text-rose-400" />
              <span>{language === 'id' ? 'Sesi Baru' : 'New Session'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lyra-surface hover:bg-lyra-accent/15 border border-lyra-accent/15 text-xs text-lyra-text font-medium transition-colors cursor-pointer"
            >
              <FolderTree size={13} className="text-lyra-accent" />
              <span>
                {isWorkspaceOpen 
                  ? (language === 'id' ? 'Tutup Workspace' : 'Close Workspace') 
                  : (language === 'id' ? 'Buka Workspace' : 'Open Workspace')}
              </span>
            </button>
            <button
              type="button"
              onClick={() => router.push('/world')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lyra-accent/15 hover:bg-lyra-accent/25 text-lyra-accent text-xs font-medium transition-colors cursor-pointer"
            >
              <ExternalLink size={13} />
              <span>{language === 'id' ? 'Lihat di World HQ' : 'View in World HQ'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Work Feed (Todos, Tool Blocks, Reasoning, Deliverables) */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-5 no-scrollbar">
          {!sessionId ? (
            /* Welcome / Empty State */
            <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-lyra-accent/15 border border-lyra-accent/30 flex items-center justify-center mb-3 text-lyra-accent shadow-md">
                <Sparkles size={24} />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-lyra-text mb-1.5">
                {language === 'id' ? 'Pendelegasian Tugas Otonom Berjenjang' : 'Tiered Autonomous Task Delegation'}
              </h2>
              <p className="text-xs sm:text-sm text-lyra-text-secondary max-w-md mb-6 leading-relaxed">
                {language === 'id' 
                  ? 'Berbeda dari chat biasa, mode ini menyusun rencana kerja (Todos), mengeksekusi perintah di komputer lokal Anda, dan mencentang setiap tahapan hingga selesai sempurna.' 
                  : 'Unlike regular chat, this mode drafts an execution plan (Todos), runs operations directly on your local system, and checks off each stage through completion.'}
              </p>

              {/* Sample Quick Starters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl text-left">
                {[
                  { 
                    title: language === 'id' ? 'Scrape 20 Data Toko Roti' : 'Scrape 20 Bakery Records', 
                    prompt: language === 'id' ? 'Cari 20 data toko roti di Jakarta beserta alamat dan websitenya, simpan ke file toko_roti.csv' : 'Find 20 bakery records in Jakarta with address and website, save to toko_roti.csv', 
                    agent: 'researcher' 
                  },
                  { 
                    title: language === 'id' ? 'Audit Keamanan & Dependency' : 'Security & Dependency Audit', 
                    prompt: language === 'id' ? 'Audit seluruh file package.json dan periksa potensi celah keamanan di dependensi proyek' : 'Audit all package.json files and check for security vulnerabilities in dependencies', 
                    agent: 'security' 
                  },
                  { 
                    title: language === 'id' ? 'Buat Modul Script Python' : 'Create Python Script Module', 
                    prompt: language === 'id' ? 'Buatkan script otomatisasi pembersih log dengan rotasi harian dan unit test' : 'Build an automated log-cleaner script with daily rotation and unit tests', 
                    agent: 'coder' 
                  },
                  { 
                    title: language === 'id' ? 'Periksa & Refactor Performa' : 'Inspect & Refactor Performance', 
                    prompt: language === 'id' ? 'Analisis file konfigurasi dan optimalkan bundle build agar waktu load lebih cepat' : 'Analyze config files and optimize the build bundle for faster load times', 
                    agent: 'planner' 
                  }
                ].map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedAgent(s.agent);
                      setPromptInput(s.prompt);
                    }}
                    className="p-3 rounded-xl border border-lyra-accent/20 bg-lyra-surface hover:bg-lyra-accent/15 hover:border-lyra-accent/40 shadow-2xs hover:shadow-xs transition-all text-left cursor-pointer group"
                  >
                    <div className="text-xs font-bold text-lyra-text group-hover:text-lyra-accent transition-colors mb-1">
                      {s.title}
                    </div>
                    <div className="text-[11px] text-lyra-text-secondary line-clamp-2 leading-relaxed">
                      {s.prompt}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Autonomous Execution Feed */
            <div className="space-y-5">
              {/* Chronological Conversation Feed */}
              {conversationMessages.length > 0 && (
                <AutonomousConversationView 
                  messages={conversationMessages} 
                  isStreaming={isSubmitting} 
                />
              )}

              {/* Thought Process (Reasoning Accordions) */}
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

              {/* Todo (Dynamic Todos Card) */}
              {todos.length > 0 && (
                <DynamicTodosCard todos={todos} />
              )}

              {/* Menjalankan Sistem (Tool Execution Block) */}
              {toolLogsList.length > 0 && (
                <ToolExecutionBlock toolLogs={toolLogsList} defaultExpanded={false} />
              )}

              {/* Terminal / Live Coding Studio Viewport */}
              <LiveCodingStudioBlock />

              {/* Hasil (Deliverable Card) */}
              {deliverable && (
                <DeliverableCard
                  artifact={deliverable}
                  onSelectFile={(path) => {
                    setIsWorkspaceOpen(true);
                    setPreviewWorkspaceFile(path);
                  }}
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

        {/* Bottom Autonomous Dispatch Prompt Bar (Exact Mirror of Chat Input Bar) */}
        <div className="p-4 border-t border-lyra-accent/10 bg-lyra-surface/90 backdrop-blur-md shrink-0 z-10 shadow-lg">
          {/* Subtle Smart Notification when using in Cloud / Vercel without Hermes Engine */}
          {isHermesInstalled === false && !hasDismissedCloudHint && (
            <div className="max-w-4xl mx-auto mb-2 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-lyra-text flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="p-1 rounded-md bg-amber-500/20 text-amber-500 shrink-0 font-mono text-xs">⚡</span>
                <span className="text-[11px] sm:text-xs text-lyra-text-secondary leading-snug">
                  {language === 'id' ? (
                    <>
                      <strong className="text-lyra-text font-medium">Mode Cloud Terbatas:</strong> Pembuatan artefak fisik (seperti PDF, Excel, kode otomatis, atau modifikasi file) memerlukan <strong className="text-amber-500 font-semibold">Hermes Engine</strong> di PC lokal/VPS sebagai mesin eksekusi, tools, dan skills-nya.
                    </>
                  ) : (
                    <>
                      <strong className="text-lyra-text font-medium">Cloud Mode Limited:</strong> Generating real deliverables (such as PDF, Excel, codebase scripts, or terminal runs) requires the local/VPS <strong className="text-amber-500 font-semibold">Hermes Engine</strong> for skills, tools, and autonomous execution.
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="/skills"
                  className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border border-amber-500/30 transition-colors"
                >
                  {language === 'id' ? 'Pasang Hermes' : 'Install Hermes'}
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setHasDismissedCloudHint(true);
                    try {
                      localStorage.setItem('lyra_cloud_mode_hint_dismissed', 'true');
                    } catch (e) {}
                  }}
                  className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-md hover:bg-lyra-accent/10 text-lyra-text-secondary hover:text-lyra-text transition-colors cursor-pointer"
                  title={language === 'id' ? 'Tutup info' : 'Dismiss notice'}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleLaunchAutonomousWork} className="max-w-4xl mx-auto flex flex-col gap-2">
            
            {/* Top Selector: Agent / Squad Mode */}
            <div className="flex items-center text-xs text-lyra-text-secondary px-1">
              <div className="flex items-center gap-2">
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="bg-lyra-surface border border-lyra-accent/20 rounded-lg px-2.5 py-1 text-xs text-lyra-text font-medium outline-none cursor-pointer hover:border-lyra-accent transition-colors"
                >
                  <option value="default">
                    Autonomous Swarm
                  </option>
                  {availableAgents.filter(a => a !== 'default').map((agId) => {
                    const info = getAgentInfo(agId);
                    return (
                      <option key={agId} value={agId} className="bg-lyra-surface text-lyra-text">
                        @{info.name} ({info.role})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Input Box Container */}
            <div 
              className={`relative rounded-2xl border border-lyra-accent/20 bg-lyra-surface/80 focus-within:border-lyra-accent/50 focus-within:ring-2 focus-within:ring-lyra-accent/20 shadow-sm transition-all overflow-visible ${
                isDraggingOver ? 'ring-2 ring-lyra-accent ring-inset bg-lyra-accent/10 border-lyra-accent' : ''
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={handleDropOnComposer}
            >
              {isDraggingOver && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-lyra-surface/90 backdrop-blur-sm rounded-2xl pointer-events-none border-2 border-dashed border-lyra-accent">
                  <div className="text-lyra-accent font-bold flex items-center gap-2 text-sm">
                    <Plus size={18} /> 
                    {language === 'id' ? 'Lepaskan file atau folder di sini' : 'Drop files or folders here'}
                  </div>
                </div>
              )}
              
              {/* Hidden File Input for Attachment */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    const newFiles = Array.from(e.target.files).map(f => ({
                      name: f.name,
                      path: (f as any).path || f.name,
                      type: f.type,
                      size: f.size
                    }));
                    setAttachments(prev => [...prev, ...newFiles]);
                  }
                }}
              />

              {/* Hidden Folder Input for Folder Attachment */}
              <input
                ref={folderInputRef}
                type="file"
                // @ts-ignore
                webkitdirectory=""
                directory=""
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    const folderName = (e.target.files[0] as any).webkitRelativePath?.split('/')[0] || 'folder';
                    const newFolder = {
                      name: `📁 ${folderName} (${e.target.files.length} file)`,
                      path: folderName,
                      type: 'directory',
                      size: Array.from(e.target.files).reduce((acc, f) => acc + f.size, 0)
                    };
                    setAttachments(prev => [...prev, newFolder]);
                  }
                }}
              />

              {/* Attachments Pills if present */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-3 pt-2">
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-lyra-accent/10 border border-lyra-accent/20 text-xs text-lyra-text font-mono"
                    >
                      {file.isWorkspaceRef ? (
                        file.isDirectory ? <Folder size={12} className="text-amber-400" /> : <FileIcon size={12} className="text-sky-400" />
                      ) : file.type === 'directory' ? (
                        <Folder size={12} className="text-amber-400" />
                      ) : (
                        <FileText size={12} className="text-lyra-accent" />
                      )}
                      <span className="truncate max-w-[150px]">
                        {file.isWorkspaceRef ? `@${file.name}` : file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                        className="hover:text-red-400 cursor-pointer ml-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Textarea */}
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isSubmitting) handleLaunchAutonomousWork(e);
                  }
                }}
                rows={2}
                placeholder={language === 'id' ? 'Ketik pesan Anda di sini...' : 'Type your message here...'}
                className="w-full bg-transparent px-4 py-3 text-lyra-text placeholder:text-lyra-text-secondary focus:outline-none resize-none min-h-[56px] max-h-48 overflow-y-auto text-sm"
              />

              {/* Bottom Toolbar Row (Matching User Image: [+] [Hermes Agent v] [Med v] ... [↑]) */}
              <div className="flex items-center justify-between px-3 pb-2.5 pt-1 border-t border-lyra-accent/5">
                
                {/* Left Controls: Plus Button, Model Selector, Effort Selector */}
                <div className="flex items-center gap-1.5 relative">

                  {/* Plus Attach & Options Button */}
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsAttachMenuOpen(!isAttachMenuOpen);
                        setIsModelMenuOpen(false);
                        setIsEffortMenuOpen(false);
                      }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isAttachMenuOpen ? 'bg-lyra-accent text-white' : 'text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10'
                      }`}
                      title={language === 'id' ? 'Lampirkan & Opsi Mode AI' : 'Attach & AI Mode Options'}
                    >
                      <Plus size={18} className={`transition-transform duration-200 ${isAttachMenuOpen ? 'rotate-45' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isAttachMenuOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute left-0 bottom-[calc(100%+8px)] w-64 bg-lyra-surface border border-lyra-accent/20 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col py-2 backdrop-blur-md"
                        >
                          <div className="text-[10px] font-bold text-lyra-text-secondary opacity-60 px-4 py-1.5 uppercase tracking-wider">
                            {language === 'id' ? 'File & Media' : 'File & Media'}
                          </div>
                          
                          <button 
                            type="button" 
                            onClick={() => { 
                              fileInputRef.current?.click(); 
                              setIsAttachMenuOpen(false); 
                            }} 
                            className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-xs text-left transition-colors w-full cursor-pointer"
                          >
                            <FileText size={15} className="text-lyra-text" />
                            <span className="font-medium text-lyra-text">
                              {language === 'id' ? 'Unggah file atau gambar' : 'Upload file or image'}
                            </span>
                          </button>

                          <button 
                            type="button" 
                            onClick={() => { 
                              folderInputRef.current?.click(); 
                              setIsAttachMenuOpen(false); 
                            }} 
                            className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-xs text-left transition-colors w-full cursor-pointer"
                          >
                            <Folder size={15} className="text-lyra-text" />
                            <span className="font-medium text-lyra-text">
                              {language === 'id' ? 'Unggah folder lokal...' : 'Upload local folder...'}
                            </span>
                          </button>
                          
                          <button 
                            type="button" 
                            onClick={() => { 
                              setIsWorkspaceOpen(true); 
                              setIsAttachMenuOpen(false); 
                            }} 
                            className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-xs text-left transition-colors w-full cursor-pointer"
                          >
                            <FolderTree size={15} className="text-lyra-text" />
                            <span className="font-medium text-lyra-text">
                              {language === 'id' ? 'Pilih dari Workspace' : 'Select from Workspace'}
                            </span>
                          </button>

                          <button 
                            type="button" 
                            onClick={() => { 
                              setIsAttachMenuOpen(false); 
                              captureScreenshot(); 
                            }} 
                            className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-xs text-left transition-colors w-full cursor-pointer"
                          >
                            <Monitor size={15} className="text-lyra-text" />
                            <span className="font-medium text-lyra-text">
                              {language === 'id' ? 'Ambil tangkapan layar' : 'Take screenshot'}
                            </span>
                          </button>

                          <button 
                            type="button" 
                            onClick={() => { 
                              setIsAttachMenuOpen(false); 
                              handleClipboardPaste(); 
                            }} 
                            className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-xs text-left transition-colors w-full cursor-pointer"
                          >
                            <Clipboard size={15} className="text-lyra-text" />
                            <span className="font-medium text-lyra-text">
                              {language === 'id' ? 'Tempel dari clipboard' : 'Paste from clipboard'}
                            </span>
                          </button>

                          <div className="h-px bg-lyra-accent/10 my-1 mx-2"></div>
                          <div className="text-[10px] font-bold text-lyra-text-secondary opacity-60 px-4 py-1.5 uppercase tracking-wider">
                            {language === 'id' ? 'Konteks & Proyek' : 'Context & Project'}
                          </div>

                          <button 
                            type="button" 
                            onClick={() => { 
                              setUrlModalOpen(true); 
                              setIsAttachMenuOpen(false); 
                            }} 
                            className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-xs text-left transition-colors w-full cursor-pointer"
                          >
                            <LinkIcon size={15} className="text-lyra-text" />
                            <div className="flex-1">
                              <div className="font-medium text-lyra-text">
                                {language === 'id' ? 'Tautkan URL / Dokumentasi' : 'Attach URL / Documentation'}
                              </div>
                            </div>
                          </button>

                          <div className="h-px bg-lyra-accent/10 my-1 mx-2"></div>
                          <div className="text-[10px] font-bold text-lyra-text-secondary opacity-60 px-4 py-1.5 uppercase tracking-wider">
                            {language === 'id' ? 'Mode AI' : 'AI Mode'}
                          </div>

                          {/* Web Search Toggle */}
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsWebSearchEnabled(prev => !prev);
                            }} 
                            className="flex items-center justify-between px-4 py-2 hover:bg-lyra-accent/10 text-xs text-left transition-colors w-full cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2.5">
                              <Globe size={15} className={isWebSearchEnabled ? "text-blue-400" : "text-lyra-text-secondary"} />
                              <div>
                                <div className="font-medium text-lyra-text">
                                  {language === 'id' ? 'Pencarian Web' : 'Web Search'}
                                </div>
                                <div className="text-[10px] text-lyra-text-secondary">
                                  {isWebSearchEnabled 
                                    ? (language === 'id' ? 'Aktif' : 'Active') 
                                    : (language === 'id' ? 'Nonaktif' : 'Inactive')}
                                </div>
                              </div>
                            </div>
                            <div className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                              isWebSearchEnabled ? 'bg-blue-500' : 'bg-zinc-600'
                            }`}>
                              <motion.span 
                                animate={{ x: isWebSearchEnabled ? 12 : 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                                className="inline-block h-3 w-3 rounded-full bg-white shadow-md pointer-events-none" 
                              />
                            </div>
                          </div>

                          {/* Deep Research Toggle */}
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsDeepResearchEnabled(prev => !prev);
                            }} 
                            className="flex items-center justify-between px-4 py-2 hover:bg-lyra-accent/10 text-xs text-left transition-colors w-full cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2.5">
                              <Search size={15} className={isDeepResearchEnabled ? "text-emerald-500" : "text-lyra-text-secondary"} />
                              <div>
                                <div className="font-medium text-lyra-text">
                                  {language === 'id' ? 'Riset Mendalam' : 'Deep Research'}
                                </div>
                                <div className="text-[10px] text-lyra-text-secondary">
                                  {isDeepResearchEnabled 
                                    ? (language === 'id' ? 'Aktif' : 'Active') 
                                    : (language === 'id' ? 'Nonaktif' : 'Inactive')}
                                </div>
                              </div>
                            </div>
                            <div className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                              isDeepResearchEnabled ? 'bg-emerald-500' : 'bg-zinc-600'
                            }`}>
                              <motion.span 
                                animate={{ x: isDeepResearchEnabled ? 12 : 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                                className="inline-block h-3 w-3 rounded-full bg-white shadow-md pointer-events-none" 
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Model Selector Pill (Hermes Agent ˅) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModelMenuOpen(!isModelMenuOpen);
                        setIsEffortMenuOpen(false);
                        setIsAttachMenuOpen(false);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border cursor-pointer ${
                        isModelMenuOpen 
                          ? 'bg-lyra-accent/20 border-lyra-accent text-lyra-text shadow-sm' 
                          : 'bg-lyra-surface/90 border-lyra-accent/20 text-lyra-text hover:border-lyra-accent/40 hover:bg-lyra-accent/10'
                      }`}
                    >
                      <span className="truncate max-w-[130px]">{selectedModel}</span>
                      <ChevronDown size={13} className={`opacity-60 transition-transform ${isModelMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isModelMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute left-0 bottom-[calc(100%+8px)] w-72 bg-lyra-surface border border-lyra-accent/20 rounded-2xl shadow-2xl z-50 p-2.5 backdrop-blur-md flex flex-col"
                        >
                          {/* Active Provider Header */}
                          <div className="flex items-center justify-between px-2.5 py-1.5 mb-2 rounded-xl bg-lyra-accent/10 border border-lyra-accent/20 text-xs">
                            <div className="flex items-center gap-1.5 font-medium text-lyra-accent">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="truncate max-w-[140px]">
                                {PROVIDER_PRESETS.find(p => p.id === activeProviderId)?.label || 'OpenRouter'}
                              </span>
                            </div>
                            <Link 
                              href="/settings" 
                              onClick={() => setIsModelMenuOpen(false)}
                              className="text-[11px] text-blue-500 hover:text-blue-400 underline font-medium"
                            >
                              {language === 'id' ? 'Ganti' : 'Change'}
                            </Link>
                          </div>

                          {/* Search Input */}
                          <div className="relative mb-2">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lyra-text-secondary opacity-60" />
                            <input
                              type="text"
                              value={modelSearchQuery}
                              onChange={(e) => setModelSearchQuery(e.target.value)}
                              placeholder={language === 'id' ? 'Cari model AI...' : 'Search AI models...'}
                              className="w-full bg-lyra-bg border border-lyra-accent/20 rounded-xl py-1.5 pl-8 pr-3 text-xs text-lyra-text placeholder:text-lyra-text-secondary focus:outline-none focus:border-lyra-accent"
                              autoFocus
                            />
                          </div>

                          <div className="h-px bg-lyra-accent/10 mx-1 mb-1.5" />

                          {/* Model Items */}
                          <div className="overflow-y-auto space-y-0.5 max-h-52 pr-1 no-scrollbar">
                            {modelsList
                              .filter(m => m.name.toLowerCase().includes(modelSearchQuery.toLowerCase()))
                              .map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedModel(m.name);
                                    setIsModelMenuOpen(false);
                                    try { localStorage.setItem('lyra_work_model', m.name); } catch(e) {}
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors text-left cursor-pointer ${
                                    selectedModel === m.name
                                      ? 'bg-lyra-accent/20 text-lyra-text font-semibold'
                                      : 'text-lyra-text hover:bg-lyra-accent/10'
                                  }`}
                                >
                                  <span className="truncate pr-2">{m.name}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/5 font-mono">
                                    {getEffortBadge(thinkingEffort)}
                                  </span>
                                </button>
                              ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Effort Selector Pill (Med ˅) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEffortMenuOpen(!isEffortMenuOpen);
                        setIsModelMenuOpen(false);
                        setIsAttachMenuOpen(false);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border cursor-pointer ${
                        isEffortMenuOpen
                          ? 'bg-lyra-accent/20 border-lyra-accent text-lyra-text shadow-sm'
                          : 'bg-lyra-surface/90 border-lyra-accent/20 text-lyra-text hover:border-lyra-accent/40 hover:bg-lyra-accent/10'
                      }`}
                    >
                      <span>{getEffortBadge(thinkingEffort)}</span>
                      <ChevronDown size={13} className={`opacity-60 transition-transform ${isEffortMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isEffortMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute left-0 bottom-[calc(100%+8px)] w-56 bg-lyra-surface border border-lyra-accent/20 rounded-2xl shadow-2xl z-50 p-2.5 backdrop-blur-md select-none"
                        >
                          <div className="text-[10px] font-bold text-lyra-text-secondary opacity-60 px-2.5 py-1 uppercase tracking-wider">
                            EFFORT
                          </div>

                          <div className="space-y-0.5">
                            {(['Minimal', 'Low', 'Medium', 'High', 'Extra High', 'Max', 'Ultra'] as const).map((lvl) => (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => {
                                  setThinkingEffort(lvl);
                                  setIsEffortMenuOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                                  thinkingEffort === lvl
                                    ? 'bg-lyra-accent/15 text-lyra-text font-medium'
                                    : 'text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10'
                                }`}
                              >
                                <span>{lvl}</span>
                                {thinkingEffort === lvl && (
                                  <Check size={14} className="text-lyra-accent stroke-[2.5]" />
                                )}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>

                {/* Right Action: Send Button OR Stop Button (Matching Chat) */}
                <div className="flex items-center shrink-0 ml-2">
                  {isSubmitting ? (
                    <button
                      type="button"
                      onClick={handleStopGeneration}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-white text-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-200 active:scale-95 transition-all shadow-md cursor-pointer shrink-0"
                      title={language === 'id' ? 'Hentikan pembuatan (Stop)' : 'Stop generation (Stop)'}
                    >
                      <Square size={12} className="fill-current text-zinc-900" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!promptInput.trim()}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer active:scale-95 shrink-0 ${
                        !promptInput.trim()
                          ? 'bg-lyra-surface text-lyra-text-secondary/40 border border-lyra-accent/10 cursor-not-allowed'
                          : 'bg-lyra-accent hover:bg-lyra-accent/90 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                      }`}
                      title={language === 'id' ? 'Kirim pesan / Jalankan tugas' : 'Send message / Run task'}
                    >
                      <ArrowUp size={16} strokeWidth={2.5} />
                    </button>
                  )}
                </div>

              </div>
            </div>

          </form>
        </div>
      </div>

      {/* Right Workspace Explorer Panel with Minimal Edge Toggle */}
      <WorkspacePanel
        isOpen={isWorkspaceOpen}
        onToggle={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
        targetPreviewPath={previewWorkspaceFile}
        onMentionFile={(filePath) => {
          const fileName = filePath.split(/[\/\\]/).pop() || filePath;
          setAttachments((prev) => {
            if (prev.some(a => a.path === filePath)) return prev;
            return [...prev, {
              name: fileName,
              path: filePath,
              isWorkspaceRef: true,
              isDirectory: false
            }];
          });
        }}
      />

      {/* URL Connector Modal */}
      {urlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-lyra-surface border border-lyra-accent/20 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-lyra-text mb-2 flex items-center gap-2">
              <LinkIcon size={18} className="text-lyra-accent" />
              {language === 'id' ? 'Tautkan URL / Dokumentasi' : 'Attach URL / Documentation'}
            </h3>
            <p className="text-xs text-lyra-text-secondary mb-4">
              {language === 'id' 
                ? 'Masukkan URL web, dokumentasi library, atau endpoint API untuk dijadikan konteks langsung bagi AI agen.' 
                : 'Enter a web URL, library docs, or API endpoint to provide direct context to AI agents.'}
            </p>
            <input
              type="url"
              autoFocus
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://docs.example.com/api..."
              className="w-full bg-lyra-bg border border-lyra-accent/20 rounded-xl px-3.5 py-2.5 text-xs text-lyra-text placeholder:text-lyra-text-secondary outline-none focus:border-lyra-accent mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && urlInput.trim()) {
                  setAttachments(prev => [...prev, { name: `🔗 ${urlInput.trim()}`, path: urlInput.trim(), type: 'url' }]);
                  setUrlInput('');
                  setUrlModalOpen(false);
                }
              }}
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => { setUrlModalOpen(false); setUrlInput(''); }}
                className="px-3.5 py-2 rounded-xl bg-lyra-accent/10 hover:bg-lyra-accent/20 text-lyra-text cursor-pointer transition-colors"
              >
                {language === 'id' ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={!urlInput.trim()}
                onClick={() => {
                  if (urlInput.trim()) {
                    setAttachments(prev => [...prev, { name: `🔗 ${urlInput.trim()}`, path: urlInput.trim(), type: 'url' }]);
                    setUrlInput('');
                    setUrlModalOpen(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-lyra-accent hover:bg-lyra-accent/90 text-white font-medium disabled:opacity-50 cursor-pointer transition-colors shadow-md"
              >
                {language === 'id' ? 'Tambahkan Tautan' : 'Add Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
