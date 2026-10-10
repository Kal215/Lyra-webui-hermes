'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation, useI18nStore } from '@/i18n';
import { MessageSquare, Plus, Send, Menu, Terminal, Globe, FileText, Wrench, ChevronDown, ChevronRight, CheckCircle2, CircleDashed, BrainCircuit, MoreVertical, Edit2, Trash2, Check, X, Pin, DownloadCloud, PinOff, Paperclip, Folder, File, ImageIcon, XCircle, Columns, Monitor, Settings, Zap, Database, FolderTree, Clipboard, PenTool, Link, Search, ImagePlus, GitBranch, Library, Command } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { buildRichMessages } from './messageParser';
import { extractInlineThinking } from '@/lib/reasoning/extractor';
import { useWorkspaceStore } from '@/store/workspace';
import { useRouter, useSearchParams } from 'next/navigation';

// --- Subcomponents for Rich Tool UI ---

function LiveTicker({ isRunning, startTime }: { isRunning: boolean, startTime: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setElapsed((Date.now() - startTime) / 1000);
    }, 100);
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  return <span className="font-mono text-xs opacity-70 ml-2">({elapsed.toFixed(1)}s)</span>;
}

function ToolCallCard({ tool }: { tool: any }) {
  const [expanded, setExpanded] = useState(false);

  let Icon = Wrench;
  if (tool.name === 'terminal') Icon = Terminal;
  if (tool.name.includes('web')) Icon = Globe;
  if (tool.name.includes('file') || tool.name.includes('patch')) Icon = FileText;

  const isRunning = !tool.result;
  const duration = tool.result?.duration_ms ? (tool.result.duration_ms / 1000).toFixed(1) + 's' : null;

  return (
    <div className="my-2 rounded-xl border border-lyra-accent/10 bg-lyra-accent/5 overflow-hidden text-sm w-full max-w-2xl">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-lyra-accent/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isRunning ? (
            <CircleDashed size={16} className="text-lyra-accent animate-spin" />
          ) : (
            <CheckCircle2 size={16} className="text-emerald-500" />
          )}
          <Icon size={16} className="text-lyra-text/70" />
          <span className="font-medium text-lyra-text/90">
            Menggunakan: {tool.name}
          </span>
          {isRunning ? (
            <LiveTicker isRunning={true} startTime={tool.startTime} />
          ) : (
            <span className="font-mono text-xs opacity-50 ml-2">({duration})</span>
          )}
        </div>
        {expanded ? <ChevronDown size={16} className="opacity-50" /> : <ChevronRight size={16} className="opacity-50" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-lyra-accent/10 bg-lyra-surface"
          >
            <div className="p-3 font-mono text-xs overflow-x-auto text-lyra-text">
              <div className="opacity-50 mb-1">Input:</div>
              <pre className="text-emerald-600 dark:text-emerald-300 mb-3">{JSON.stringify(tool.input, null, 2)}</pre>
              
              {tool.result && (
                <>
                  <div className="opacity-50 mb-1">Output:</div>
                  <pre className="opacity-80 whitespace-pre-wrap">
                    {tool.result.output}
                  </pre>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReasoningCard({ reasoning }: { reasoning: any }) {
  const isRunning = !reasoning.endTime;
  const duration = reasoning.endTime ? ((reasoning.endTime - reasoning.startTime) / 1000).toFixed(1) + 's' : null;
  const hasText = reasoning.text && reasoning.text.trim().length > 0;
  const [expanded, setExpanded] = useState(isRunning);

  useEffect(() => {
    if (!isRunning) {
      setExpanded(false);
    } else if (hasText && isRunning && !expanded) {
      setExpanded(true);
    }
  }, [isRunning, hasText, expanded]);

  return (
    <div className="my-2 rounded-xl border border-lyra-accent/20 bg-lyra-accent/5 overflow-hidden text-sm w-full max-w-2xl">
      <button 
        onClick={() => hasText && setExpanded(!expanded)}
        disabled={!hasText}
        className={`w-full flex items-center justify-between p-3 transition-colors ${hasText ? 'hover:bg-lyra-accent/10 cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex items-center">
          <BrainCircuit size={16} className={`text-lyra-accent mr-3 ${isRunning ? 'animate-pulse' : ''}`} />
          <span className="font-medium text-lyra-accent/90">
            {isRunning ? 'Berpikir...' : (duration ? `Berpikir selama ${duration}` : 'Proses Berpikir')}
          </span>
          {isRunning && <LiveTicker isRunning={true} startTime={reasoning.startTime} />}
        </div>
        {hasText && (
          expanded ? <ChevronDown size={16} className="text-lyra-accent/70" /> : <ChevronRight size={16} className="text-lyra-accent/70" />
        )}
      </button>

      <AnimatePresence>
        {expanded && hasText && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-lyra-accent/10 bg-lyra-accent/5"
          >
            <div className="p-4 font-mono text-xs text-lyra-accent/80 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
              {reasoning.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const formatTimeLabel = (updated_at: number) => {
  if (!updated_at) return '';
  const diffMins = Math.floor((Date.now() - updated_at) / (1000 * 60));
  if (diffMins < 60) return `${Math.max(1, diffMins)}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
};

function SidebarSessionItem({ session, isActive, onClick, onDelete, onRename, onPin }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [editTitle, setEditTitle] = useState(session.title || session.id);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setEditTitle(session.title || session.id);
  }, [session.title, session.id]);

  const handleRenameSubmit = (e: any) => {
    e.preventDefault();
    if (editTitle.trim() && editTitle.trim() !== (session.title || session.id)) {
      onRename(session.id, editTitle.trim());
    }
    setIsEditing(false);
    setMenuOpen(false);
  };

  const timeLabel = formatTimeLabel(session.updated_at);

  return (
    <div className={`relative group w-full rounded-lg mb-1 flex items-center transition-colors ${isActive ? 'bg-lyra-accent/15 text-lyra-accent font-medium' : 'text-lyra-text-secondary hover:bg-lyra-accent/5'}`}>
      {isConfirmingDelete ? (
        <div className="flex-1 flex items-center justify-between p-2 text-sm bg-red-500/10 rounded-lg">
          <span className="text-red-500 pl-2 truncate font-semibold">Hapus sesi?</span>
          <div className="flex gap-1 shrink-0">
            <button onClick={(e) => { e.stopPropagation(); onDelete(session.id); setIsConfirmingDelete(false); }} className="text-emerald-500 p-1 hover:bg-emerald-500/20 rounded transition-colors"><Check size={14}/></button>
            <button onClick={(e) => { e.stopPropagation(); setIsConfirmingDelete(false); }} className="text-lyra-text-secondary p-1 hover:bg-lyra-accent/10 rounded transition-colors"><X size={14}/></button>
          </div>
        </div>
      ) : isEditing ? (
        <form onSubmit={handleRenameSubmit} className="flex-1 flex items-center p-2">
          <input 
            autoFocus 
            value={editTitle} 
            onChange={e => setEditTitle(e.target.value)} 
            onKeyDown={(e) => e.key === 'Escape' && setIsEditing(false)}
            className="w-full bg-lyra-bg border border-lyra-accent/50 rounded px-2 py-1 text-sm text-lyra-text focus:outline-none focus:border-lyra-accent shadow-inner" 
          />
          <button type="submit" className="ml-1 text-emerald-500 p-1 hover:bg-emerald-500/20 rounded transition-colors"><Check size={14}/></button>
          <button type="button" onClick={() => { setIsEditing(false); setEditTitle(session.title || session.id); }} className="text-red-500 p-1 hover:bg-red-500/20 rounded transition-colors"><X size={14}/></button>
        </form>
      ) : (
        <>
          <button onClick={onClick} className="flex-1 flex items-center p-2 truncate text-sm text-left">
            <div className={`w-2 h-2 rounded-full mr-2 shrink-0 ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-gray-400/50'}`}></div>
            <span className="truncate flex-1">{session.title || session.id}</span>
            {timeLabel && <span className="text-[10px] opacity-50 ml-2 shrink-0">{timeLabel}</span>}
          </button>
          
          <div className="relative pr-2 flex items-center">
            <button 
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className={`p-1.5 rounded hover:bg-lyra-accent/10 ${menuOpen || isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
            >
              <MoreVertical size={14} className="opacity-70" />
            </button>
            
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}></div>
                <div className="absolute right-0 top-8 w-40 bg-lyra-surface border border-lyra-accent/20 rounded-lg shadow-xl z-50 overflow-hidden text-sm py-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onPin(session.id, !session.is_pinned); setMenuOpen(false); }} 
                    className="w-full text-left px-3 py-2 text-lyra-text hover:bg-lyra-accent/10 flex items-center gap-2 transition-colors"
                  >
                    {session.is_pinned ? <PinOff size={14} className="opacity-70" /> : <Pin size={14} className="opacity-70" />}
                    {session.is_pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsEditing(true); setMenuOpen(false); }} 
                    className="w-full text-left px-3 py-2 text-lyra-text hover:bg-lyra-accent/10 flex items-center gap-2 transition-colors"
                  >
                    <Edit2 size={14} className="opacity-70" /> Rename
                  </button>
                  <a 
                    href={`/api/sessions/${session.id}/export`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} 
                    className="w-full text-left px-3 py-2 text-lyra-text hover:bg-lyra-accent/10 flex items-center gap-2 transition-colors"
                  >
                    <DownloadCloud size={14} className="opacity-70" /> Export (.md)
                  </a>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsConfirmingDelete(true); setMenuOpen(false); }} 
                    className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors border-t border-lyra-accent/10 mt-1 pt-1"
                  >
                    <Trash2 size={14} className="opacity-70" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// --- Main Page ---

export default function NativeChatPage() {
  const t = useTranslation();
  const { language } = useI18nStore();
  
  const searchParams = useSearchParams();
  const projectId = searchParams?.get('project_id');
  const [activeProject, setActiveProject] = useState<any>(null);

  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Workspace Global Store
  const { currentWorkspace, setCurrentWorkspace, openFileInWorkspace } = useWorkspaceStore();
  const router = useRouter();
  
  const [workspaceFiles, setWorkspaceFiles] = useState<any[]>([]);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [workspaceInput, setWorkspaceInput] = useState(currentWorkspace);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(true);
  const [isReasoningEnabled, setIsReasoningEnabled] = useState(true);
  const [isDeepResearchEnabled, setIsDeepResearchEnabled] = useState(false);
  const [activeModal, setActiveModal] = useState<'none' | 'sketch' | 'snippets' | 'github' | 'notion' | 'folderPicker' | 'projectPicker' | 'urlConnector'>('none');
  const [githubToken, setGithubToken] = useState('');
  const [notionToken, setNotionToken] = useState('');
  const [urlInput, setUrlInput] = useState('');
  
  // Skills & Memory State
  const [activeSnippetsTab, setActiveSnippetsTab] = useState<'snippets' | 'skills' | 'memory'>('skills');
  const [skillsList, setSkillsList] = useState<any[]>([]);
  const [snippetsList, setSnippetsList] = useState<any[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [selectedSkillCategory, setSelectedSkillCategory] = useState('All');
  
  const [memoryData, setMemoryData] = useState({ memory: '', user: '' });
  const [memoryLoading, setMemoryLoading] = useState(false);

  useEffect(() => {
    if (activeModal === 'snippets') {
      if (skillsList.length === 0) {
        setSkillsLoading(true);
        fetch('/api/skills').then(res => res.json()).then(data => {
          if (data.success) setSkillsList(data.skills);
        }).finally(() => setSkillsLoading(false));
      }
      if (snippetsList.length === 0) {
        fetch('/api/snippets').then(res => res.json()).then(data => {
          if (!data.error) setSnippetsList(data);
        });
      }
      if (!memoryData.memory) {
        setMemoryLoading(true);
        fetch('/api/memory').then(res => res.json()).then(data => {
          if (data.success) setMemoryData({ memory: data.memory, user: data.user });
        }).finally(() => setMemoryLoading(false));
      }
    }
  }, [activeModal]);
  
  // Folder Picker States
  const [browseDir, setBrowseDir] = useState('D:/project');
  const [browseFiles, setBrowseFiles] = useState<any[]>([]);

  // Projects State
  const [savedProjects, setSavedProjects] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isStreamingRef = useRef(false);
  
  // Sketch Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Fetch project if present
  useEffect(() => {
    if (projectId) {
      fetch('/api/projects')
        .then(res => res.json())
        .then(data => {
          const p = data.find((x: any) => x.id === projectId);
          if (p) {
            setActiveProject(p);
            if (p.workspacePath && p.workspacePath !== currentWorkspace) {
              setCurrentWorkspace(p.workspacePath);
            }
          }
        })
        .catch(console.error);
    }
  }, [projectId]);

  // Load tokens
  useEffect(() => {
    setGithubToken(localStorage.getItem('lyra_github_token') || '');
    setNotionToken(localStorage.getItem('lyra_notion_token') || '');
  }, []);

  // Sync input if global changes
  useEffect(() => {
    setWorkspaceInput(currentWorkspace);
    if (currentWorkspace) {
      loadWorkspaceFiles(currentWorkspace);
    }
  }, [currentWorkspace]);

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
            if (data.path) {
              setAttachments(prev => [...prev, data]);
            }
          } catch (err) {
            console.error('Screenshot upload failed', err);
          }
        }, 'image/png');
      };
    } catch (e: any) {
      if (e.name === 'NotAllowedError') {
        alert('Gagal mengambil tangkapan layar: Anda menolak izin perekaman layar, atau browser Anda tidak mendukungnya.');
      } else {
        console.error('Screenshot failed', e);
      }
    }
  };

  const handleClipboardPaste = async () => {
    try {
      const items = await navigator.clipboard.read();
      let hasItem = false;
      for (const item of items) {
        if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
          const type = item.types.includes('image/png') ? 'image/png' : 'image/jpeg';
          const blob = await item.getType(type);
          const file = new (window as any).File([blob], `clipboard_${Date.now()}.png`, { type });
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          const data = await res.json();
          if (data.path) setAttachments(prev => [...prev, data]);
          hasItem = true;
        } else if (item.types.includes('text/plain')) {
          const blob = await item.getType('text/plain');
          const text = await blob.text();
          setInputMessage(prev => prev + (prev ? '\n' : '') + text);
          hasItem = true;
        }
      }
      if (!hasItem) alert('Clipboard tidak berisi gambar atau teks yang dikenali.');
      setIsAttachMenuOpen(false);
    } catch (e) {
      alert('Gagal membaca clipboard. Pastikan browser Anda memiliki izin clipboard.');
    }
  };

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      setAttachments(prev => [...prev, { name: url, path: url, isUrl: true }]);
      setActiveModal('none');
      setUrlInput('');
    } else if (url) {
      alert('URL tidak valid. Harus dimulai dengan http:// atau https://');
    }
  };

  const saveIntegrationToken = (provider: 'github' | 'notion', token: string) => {
    localStorage.setItem(`lyra_${provider}_token`, token);
    if (provider === 'github') setGithubToken(token);
    else setNotionToken(token);
    setActiveModal('none');
  };

  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const saveSketch = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new (window as any).File([blob], `sketsa_${Date.now()}.png`, { type: 'image/png' });
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.path) {
          setAttachments(prev => [...prev, data]);
          setActiveModal('none');
        }
      } catch (err) {
        console.error('Sketch upload failed', err);
      }
    }, 'image/png');
  };

  const loadWorkspaceFiles = async (dir: string) => {
    if (!dir) return;
    try {
      const res = await fetch(`/api/workspace/ls?dir=${encodeURIComponent(dir)}`);
      const data = await res.json();
      if (data.files) {
        setWorkspaceFiles(data.files);
        setCurrentWorkspace(data.cwd);
        setWorkspaceInput(data.cwd);
      }
    } catch(e) {}
  };

  const loadBrowseDir = async (dir: string) => {
    try {
      const res = await fetch(`/api/workspace/ls?dir=${encodeURIComponent(dir)}`);
      const data = await res.json();
      if (data.files) {
        setBrowseFiles(data.files.filter((f: any) => f.isDirectory));
        setBrowseDir(data.cwd.replace(/\\/g, '/'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeModal === 'folderPicker') {
      loadBrowseDir(browseDir);
    } else if (activeModal === 'projectPicker') {
      fetch('/api/projects')
        .then(res => res.json())
        .then(data => setSavedProjects(data))
        .catch(console.error);
    }
  }, [activeModal]);

  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | any) => {
    const fileList = e.target?.files || e.dataTransfer?.files;
    if (!fileList?.length) return;
    const files = Array.from(fileList) as File[];
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.path) {
          setAttachments(prev => [...prev, data]);
        }
      } catch (err) {
        console.error('Upload failed', err);
      }
    }
    // reset input
    if (e.target && e.target.value !== undefined) e.target.value = '';
  };

  const handleDragStartWorkspaceItem = (e: React.DragEvent, file: any) => {
    e.dataTransfer.setData('application/lyra-workspace', JSON.stringify({
      name: file.name,
      path: file.path,
      isDirectory: file.isDirectory
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

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
      } catch(err) {}
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload({ dataTransfer: e.dataTransfer });
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('session');
    if (sid) {
      setActiveSessionId(sid);
    }
    fetchSessions();
  }, []);

  const updateUrlWithSession = (sid: string | null) => {
    if (sid) {
      window.history.pushState({}, '', `?session=${sid}`);
    } else {
      window.history.pushState({}, '', window.location.pathname);
    }
  };

  useEffect(() => {
    if (activeSessionId) {
      if (!isStreamingRef.current) {
        fetchMessages(activeSessionId);
      }
      updateUrlWithSession(activeSessionId);
    } else {
      updateUrlWithSession(null);
      setMessages([{ role: 'assistant', content: language === 'id' ? 'Halo! Saya Hermes. Apa yang bisa saya bantu hari ini?' : 'Hello! I am Hermes. How can I help you today?', tools: [], reasoning: null }]);
    }
  }, [activeSessionId, language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions', { cache: 'no-store' });
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSession = async (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) setActiveSessionId(null);
    try {
      await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      fetchSessions();
    } catch (e) {
      fetchSessions();
    }
  };

  const handleRenameSession = async (id: string, newTitle: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
    try {
      await fetch(`/api/sessions/${id}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      fetchSessions();
    } catch (e) {
      fetchSessions();
    }
  };

  const handlePinSession = async (id: string, pin: boolean) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, is_pinned: pin } : s));
    try {
      await fetch(`/api/sessions/${id}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      fetchSessions();
    } catch (e) {
      fetchSessions();
    }
  };

  const fetchMessages = async (id: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}/messages`);
      const data = await res.json();
      const rich = buildRichMessages(data.messages || []);
      setMessages(rich);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userText = inputMessage;
    setInputMessage('');
    
    const newMessage = { role: 'user', content: userText, tools: [], reasoning: null, attachments: [...attachments] };
    setMessages(prev => [...prev, newMessage, { 
      role: 'assistant', 
      content: '', 
      rawContent: '',
      tools: [], 
      reasoning: { startTime: Date.now(), endTime: null, text: '' }
    }]);
    setIsLoading(true);
    isStreamingRef.current = true;
    
    let currentSessionId = activeSessionId;

    // Send payload
    const payload = {
      message: userText,
      session_id: activeSessionId,
      workspace: currentWorkspace || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      systemPrompt: activeProject?.systemPrompt || undefined
    };
    
    // Clear attachments after sending
    setAttachments([]);

    try {
      const res = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.body) throw new Error('No readable stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = '';

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
                
                if (data.type === 'session_id') {
                  currentSessionId = data.session_id;
                  if (!activeSessionId) setActiveSessionId(currentSessionId);
                } 
                else if (data.type === 'tool_use') {
                  setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastMsg = { ...newMsgs[newMsgs.length - 1] };
                    newMsgs[newMsgs.length - 1] = lastMsg;
                    
                    if (lastMsg.role === 'assistant') {
                      if (lastMsg.reasoning && !lastMsg.reasoning.endTime) {
                        lastMsg.reasoning = { ...lastMsg.reasoning, endTime: Date.now() };
                      }
                      lastMsg.tools = lastMsg.tools ? [...lastMsg.tools] : [];
                      lastMsg.tools.push({
                        name: data.name,
                        input: data.input,
                        startTime: Date.now(),
                        result: null
                      });
                    }
                    return newMsgs;
                  });
                }
                else if (data.type === 'tool_result') {
                  setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastMsg = { ...newMsgs[newMsgs.length - 1] };
                    newMsgs[newMsgs.length - 1] = lastMsg;
                    
                    if (lastMsg.role === 'assistant' && lastMsg.tools && lastMsg.tools.length > 0) {
                      lastMsg.tools = [...lastMsg.tools];
                      const activeToolIdx = lastMsg.tools.length - 1;
                      lastMsg.tools[activeToolIdx] = {
                        ...lastMsg.tools[activeToolIdx],
                        result: {
                          output: data.output,
                          duration_ms: data.duration_ms,
                          is_error: data.is_error
                        }
                      };
                      lastMsg.reasoning = { startTime: Date.now(), endTime: null, text: '' };
                    }
                    return newMsgs;
                  });
                }
                else if (data.type === 'text') {
                  setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastMsg = { ...newMsgs[newMsgs.length - 1] };
                    newMsgs[newMsgs.length - 1] = lastMsg;
                    
                    if (lastMsg.role === 'assistant') {
                      lastMsg.rawContent = (lastMsg.rawContent || '') + data.text;
                      const extracted = extractInlineThinking(lastMsg.rawContent, true);
                      
                      lastMsg.content = extracted.content;
                      
                      if (extracted.reasoning) {
                        lastMsg.reasoning = { 
                          ...(lastMsg.reasoning || { startTime: Date.now(), endTime: null }),
                          text: extracted.reasoning 
                        };
                      }
                      
                      if (!extracted.inThinking && lastMsg.reasoning && !lastMsg.reasoning.endTime) {
                        lastMsg.reasoning = { ...lastMsg.reasoning, endTime: Date.now() };
                      } else if (extracted.inThinking && lastMsg.reasoning && lastMsg.reasoning.endTime) {
                        lastMsg.reasoning = { ...lastMsg.reasoning, endTime: null };
                      }
                    }
                    return newMsgs;
                  });
                } 
                else if (data.type === 'done') {
                  setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastMsg = { ...newMsgs[newMsgs.length - 1] };
                    newMsgs[newMsgs.length - 1] = lastMsg;
                    
                    if (lastMsg.role === 'assistant') {
                      if (lastMsg.reasoning && !lastMsg.reasoning.endTime) {
                        lastMsg.reasoning = { ...lastMsg.reasoning, endTime: Date.now() };
                      }
                    }
                    return newMsgs;
                  });
                }
              } catch (e) {
              }
            }
          }
        }
      }
      
      fetchSessions();
    } catch (e) {
      console.error(e);
      setMessages(prev => {
        const newMsgs = [...prev];
        const lastMsg = newMsgs[newMsgs.length - 1];
        lastMsg.content += '\n\n**[Error: Koneksi terputus]**';
        return newMsgs;
      });
    } finally {
      setIsLoading(false);
      isStreamingRef.current = false;
    }
  };

  // Filter by search query
  const filteredSessions = sessions.filter(session => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (session.title && session.title.toLowerCase().includes(q)) || (session.id && session.id.toLowerCase().includes(q));
  });

  // Group sessions by Time and Pin status
  const groupedSessions = filteredSessions.reduce((acc: any, session: any) => {
    let group = 'OLDER';
    if (session.is_pinned) {
      group = 'PINNED';
    } else {
      const diffHours = (Date.now() - (session.updated_at || 0)) / (1000 * 60 * 60);
      const diffDays = diffHours / 24;
      if (diffHours < 24) group = 'EARLIER TODAY';
      else if (diffDays < 2) group = 'YESTERDAY';
      else if (diffDays < 7) group = 'PREVIOUS 7 DAYS';
    }
    
    if (!acc[group]) acc[group] = [];
    acc[group].push(session);
    return acc;
  }, {});

  const groupOrder = ['PINNED', 'EARLIER TODAY', 'YESTERDAY', 'PREVIOUS 7 DAYS', 'OLDER'];

  return (
    <div className="flex h-full bg-lyra-bg text-lyra-text overflow-hidden font-sans">
      
      {/* Sidebar for Sessions */}
      <div className={`flex flex-col bg-lyra-surface border-r border-lyra-accent/10 transition-all duration-300 shrink-0 ${isSidebarOpen ? 'w-64' : 'w-0 hidden'}`}>
        <div className="p-4 border-b border-lyra-accent/10 flex flex-col gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lyra-text-muted" />
            <input 
              type="text"
              placeholder={language === 'id' ? 'Cari Percakapan...' : 'Search Sessions...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-lyra-bg border border-lyra-accent/10 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-lyra-accent text-lyra-text placeholder:text-lyra-text-muted transition-colors"
            />
          </div>
          <button 
            onClick={() => setActiveSessionId(null)}
            className="w-full bg-lyra-accent/10 hover:bg-lyra-accent/20 text-lyra-accent py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium"
          >
            <Plus size={16} />
            {language === 'id' ? 'Chat Baru' : 'New Chat'}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {groupOrder.map(group => {
            if (!groupedSessions[group] || groupedSessions[group].length === 0) return null;
            return (
              <div key={group} className="mb-4">
                <div className="text-xs font-semibold text-lyra-text-secondary opacity-60 ml-2 mb-2">{group}</div>
                {groupedSessions[group].map((s: any) => (
                  <SidebarSessionItem 
                    key={s.id}
                    session={s}
                    isActive={activeSessionId === s.id}
                    onClick={() => setActiveSessionId(s.id)}
                    onDelete={handleDeleteSession}
                    onRename={handleRenameSession}
                    onPin={handlePinSession}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        <div className="p-4 flex items-center gap-3 border-b border-white/5 bg-lyra-surface/50 backdrop-blur-md sticky top-0 z-10 justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-md text-lyra-text-secondary transition-colors">
              <Menu size={20} />
            </button>
            <span className="font-medium text-lg">{language === 'id' ? 'Percakapan AI' : 'AI Conversation'}</span>
          </div>
          <button 
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)} 
            className={`p-2 rounded-md transition-colors ${isRightPanelOpen ? 'bg-lyra-accent/20 text-lyra-accent' : 'hover:bg-white/10 text-lyra-text-secondary'}`}
            title="Toggle Workspace Panel"
          >
            <Columns size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {activeProject && messages.length === 0 && (
            <div className="w-full text-center py-10 opacity-70">
              <div className="w-16 h-16 bg-lyra-accent/10 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <Command size={32} className="text-lyra-accent" />
              </div>
              <h2 className="text-2xl font-bold text-lyra-text mb-2">Proyek: {activeProject.name}</h2>
              <p className="text-sm max-w-md mx-auto">{activeProject.description}</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-3xl p-5 ${
                m.role === 'user' 
                  ? 'bg-lyra-accent text-white' 
                  : 'bg-lyra-surface border border-white/5 text-lyra-text'
              }`}>
                <div className="text-sm font-semibold mb-3 opacity-60 uppercase tracking-wider">
                  {m.role === 'user' ? (language === 'id' ? 'Anda' : 'You') : 'Hermes'}
                </div>

                {m.attachments && m.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {m.attachments.map((att: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg text-xs shadow-sm">
                        {att.isWorkspaceRef ? (att.isDirectory ? <Folder size={14} className="text-lyra-accent" /> : <File size={14} className="text-lyra-accent" />) : att.isUrl ? <Link size={14} className="text-purple-400" /> : att.type?.startsWith('image/') ? <ImageIcon size={14}/> : <File size={14}/>}
                        <span className="truncate max-w-[200px]">{att.isWorkspaceRef ? `@${att.isDirectory ? 'folder' : 'file'}:${att.name}` : att.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Reasoning & Tools Execution Pipeline */}
                {m.role === 'assistant' && (
                  <div className="mb-2">
                    {/* Render completed tools */}
                    {m.tools?.map((tool: any, idx: number) => (
                      <ToolCallCard key={idx} tool={tool} />
                    ))}
                    
                    {/* Render active reasoning if it hasn't ended */}
                    {m.reasoning && !m.reasoning.endTime && (
                      <ReasoningCard reasoning={m.reasoning} />
                    )}
                  </div>
                )}

                {/* Final Markdown Content */}
                {m.content && (
                  <div className="prose prose-p:leading-relaxed prose-pre:bg-lyra-bg prose-pre:border prose-pre:border-lyra-accent/10 prose-headings:text-lyra-text prose-p:text-lyra-text prose-a:text-lyra-accent prose-strong:text-lyra-text prose-code:text-lyra-accent prose-ul:text-lyra-text prose-ol:text-lyra-text prose-li:text-lyra-text prose-table:text-lyra-text max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-lyra-bg border-t border-white/5">
          <div className="max-w-4xl mx-auto relative flex flex-col gap-2">
            
            {/* Attachment Preview */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 px-2">
                {attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-2 bg-lyra-surface border border-lyra-accent/20 px-3 py-1.5 rounded-lg text-xs">
                    {att.isWorkspaceRef ? (att.isDirectory ? <Folder size={14} className="text-lyra-accent" /> : <File size={14} className="text-lyra-accent" />) : att.isUrl ? <Link size={14} className="text-purple-400" /> : att.type?.startsWith('image/') ? <ImageIcon size={14} className="text-emerald-500"/> : <File size={14} className="text-blue-500"/>}
                    <span className="truncate max-w-[150px]">{att.isWorkspaceRef ? `@${att.isDirectory ? 'folder' : 'file'}:${att.name}` : att.name}</span>
                    <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300 ml-1">
                      <XCircle size={14}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div 
              className={`relative flex items-end transition-colors rounded-2xl ${isDraggingOver ? 'bg-lyra-accent/20 ring-2 ring-lyra-accent ring-inset' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={handleDropOnComposer}
            >
              {isDraggingOver && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-lyra-surface/80 backdrop-blur-sm rounded-2xl pointer-events-none border-2 border-dashed border-lyra-accent">
                  <div className="text-lyra-accent font-bold flex items-center gap-2">
                    <Plus size={20} /> Lepaskan file di sini
                  </div>
                </div>
              )}
              <input type="file" id="fileUpload" multiple className="hidden" onChange={(e) => { handleFileUpload(e); setIsAttachMenuOpen(false); }} />
              
              <div className="absolute left-3 bottom-3 z-20">
                <button 
                  onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                  className={`p-2 rounded-xl transition-colors ${isAttachMenuOpen ? 'bg-lyra-accent text-white' : 'text-lyra-text-secondary hover:text-lyra-accent hover:bg-lyra-accent/10'}`}
                  title="Lampirkan"
                >
                  <Plus size={18} className={`transition-transform duration-200 ${isAttachMenuOpen ? 'rotate-45' : ''}`} />
                </button>

                <AnimatePresence>
                  {isAttachMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsAttachMenuOpen(false)}></div>
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 bottom-[calc(100%+8px)] w-64 bg-lyra-surface border border-lyra-accent/20 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col py-2"
                      >
                        <div className="text-[10px] font-bold text-lyra-text-secondary opacity-60 px-4 py-1.5 uppercase tracking-wider">File & Media</div>
                        
                        <button onClick={() => document.getElementById('fileUpload')?.click()} className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full">
                          <FileText size={16} className="text-lyra-text" />
                          <div>
                            <div className="font-medium text-lyra-text">Unggah file atau gambar</div>
                          </div>
                        </button>
                        
                        <button onClick={() => { setActiveModal('folderPicker'); setIsAttachMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full">
                          <Folder size={16} className="text-lyra-text" />
                          <div>
                            <div className="font-medium text-lyra-text">Unggah folder lokal...</div>
                          </div>
                        </button>

                        <button onClick={() => { setIsAttachMenuOpen(false); captureScreenshot(); }} className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full">
                          <Monitor size={16} className="text-lyra-text" />
                          <div>
                            <div className="font-medium text-lyra-text">Ambil tangkapan layar</div>
                          </div>
                        </button>

                        <button onClick={handleClipboardPaste} className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full">
                          <Clipboard size={16} className="text-lyra-text" />
                          <div>
                            <div className="font-medium text-lyra-text">Tempel dari clipboard</div>
                          </div>
                        </button>
                        
                        <button onClick={() => { setActiveModal('sketch'); setIsAttachMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full">
                          <PenTool size={16} className="text-lyra-text" />
                          <div>
                            <div className="font-medium text-lyra-text">Sketsa manual</div>
                          </div>
                        </button>

                        <div className="h-px bg-lyra-accent/10 my-1 mx-2"></div>
                        <div className="text-[10px] font-bold text-lyra-text-secondary opacity-60 px-4 py-1.5 uppercase tracking-wider">Konteks & Proyek</div>

                        <button onClick={() => { setActiveModal('projectPicker'); setIsAttachMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full group">
                          <Database size={16} className="text-lyra-text" />
                          <div className="flex-1">
                            <div className="font-medium text-lyra-text">Ganti / Tautkan Proyek</div>
                          </div>
                          <ChevronRight size={14} className="opacity-50 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button onClick={() => { setActiveModal('urlConnector'); setIsAttachMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full">
                          <Link size={16} className="text-lyra-text" />
                          <div className="flex-1">
                            <div className="font-medium text-lyra-text">Tautkan URL / Konektor</div>
                          </div>
                        </button>

                        <button onClick={() => { setActiveModal('snippets'); setIsAttachMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full">
                          <MessageSquare size={16} className="text-lyra-text" />
                          <div className="flex-1">
                            <div className="font-medium text-lyra-text">Prompt Snippets & Skills</div>
                          </div>
                        </button>

                        <div className="h-px bg-lyra-accent/10 my-1 mx-2"></div>
                        <div className="text-[10px] font-bold text-lyra-text-secondary opacity-60 px-4 py-1.5 uppercase tracking-wider">Mode AI</div>

                        <button onClick={() => setIsReasoningEnabled(!isReasoningEnabled)} className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full">
                          <BrainCircuit size={16} className="text-purple-400" />
                          <div className="flex-1">
                            <div className="font-medium text-lyra-text">Pikirkan (Reasoning)</div>
                          </div>
                          {isReasoningEnabled && <Check size={16} className="text-purple-400" />}
                        </button>

                        <button onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)} className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full">
                          <Globe size={16} className="text-blue-400" />
                          <div className="flex-1">
                            <div className="font-medium text-lyra-text">Pencarian web</div>
                          </div>
                          {isWebSearchEnabled && <Check size={16} className="text-blue-400" />}
                        </button>

                        <button onClick={() => setIsDeepResearchEnabled(!isDeepResearchEnabled)} className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full">
                          <Search size={16} className="text-emerald-500" />
                          <div className="flex-1">
                            <div className="font-medium text-lyra-text">Riset mendalam</div>
                          </div>
                          {isDeepResearchEnabled && <Check size={16} className="text-emerald-500" />}
                        </button>

                        <button onClick={() => alert('Mode Generator Gambar segera hadir!')} className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full">
                          <ImagePlus size={16} className="text-amber-500" />
                          <div className="flex-1">
                            <div className="font-medium text-lyra-text">Buat gambar</div>
                          </div>
                        </button>

                        <div className="h-px bg-lyra-accent/10 my-1 mx-2"></div>
                        <div className="text-[10px] font-bold text-lyra-text-secondary opacity-60 px-4 py-1.5 uppercase tracking-wider">Integrasi</div>
                        
                        <button onClick={() => { setActiveModal('github'); setIsAttachMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full">
                          <GitBranch size={16} className={`text-lyra-text ${githubToken ? 'text-green-400' : ''}`} />
                          <div className="flex-1">
                            <div className="font-medium text-lyra-text">{githubToken ? 'GitHub Terhubung' : 'Hubungkan GitHub'}</div>
                          </div>
                        </button>
                        
                        <button onClick={() => { setActiveModal('notion'); setIsAttachMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full">
                          <Library size={16} className={`text-lyra-text ${notionToken ? 'text-green-400' : ''}`} />
                          <div className="flex-1">
                            <div className="font-medium text-lyra-text">{notionToken ? 'Notion Terhubung' : 'Hubungkan Notion'}</div>
                          </div>
                        </button>

                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={language === 'id' ? 'Ketik pesan Anda di sini...' : 'Type your message here...'}
                className="w-full bg-lyra-surface border border-lyra-accent/20 rounded-2xl py-4 pl-12 pr-14 text-lyra-text focus:outline-none focus:border-lyra-accent resize-none min-h-[60px] max-h-48 overflow-y-auto shadow-xl"
                rows={1}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="absolute right-3 bottom-3 p-2 bg-lyra-accent hover:bg-lyra-accent/80 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Workspace Right Panel */}
      {isRightPanelOpen && (
        <div className="w-72 bg-lyra-surface border-l border-lyra-accent/10 flex flex-col transition-all duration-300">
          <div className="p-4 border-b border-lyra-accent/10 flex justify-between items-center bg-lyra-bg">
            <span className="font-medium flex items-center gap-2"><Folder size={16} className="text-lyra-accent"/> Workspace</span>
            <button onClick={() => setIsRightPanelOpen(false)} className="p-1 hover:bg-lyra-accent/10 rounded"><X size={16}/></button>
          </div>
          <div className="p-3 border-b border-lyra-accent/10">
            <form onSubmit={(e) => { e.preventDefault(); loadWorkspaceFiles(workspaceInput); }} className="flex gap-2">
              <input 
                value={workspaceInput} 
                onChange={e => setWorkspaceInput(e.target.value)} 
                placeholder="D:/project/..." 
                className="flex-1 bg-lyra-bg border border-lyra-accent/20 text-xs p-2 rounded focus:outline-none focus:border-lyra-accent text-lyra-text"
              />
              <button type="submit" className="bg-lyra-accent/10 text-lyra-accent px-2 rounded hover:bg-lyra-accent/20 text-xs font-medium">Load</button>
            </form>
          </div>
          <div className="flex-1 overflow-y-auto p-2 text-sm">
            {workspaceFiles.length === 0 ? (
              <div className="text-center text-xs opacity-50 p-4">No workspace loaded or directory empty.</div>
            ) : (
              workspaceFiles.map((f, i) => (
                <div 
                  key={i}
                  draggable
                  onDragStart={(e) => handleDragStartWorkspaceItem(e, f)}
                  className="flex items-center gap-2 p-2 hover:bg-lyra-accent/5 rounded cursor-grab active:cursor-grabbing text-lyra-text-secondary transition-colors group"
                  onClick={() => {
                    if (f.isDirectory) {
                      loadWorkspaceFiles(f.path);
                    } else {
                      openFileInWorkspace(f.path);
                      router.push('/workspace');
                    }
                  }}
                >
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity -ml-1 text-lyra-text-secondary/50">
                    ⋮⋮
                  </div>
                  {f.isDirectory ? <Folder size={14} className="text-lyra-accent/70"/> : <File size={14} className="opacity-50"/>}
                  <span className="truncate flex-1 text-xs" title={f.name}>{f.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {activeModal !== 'none' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className={`bg-lyra-surface border border-lyra-accent/20 rounded-2xl p-6 w-full ${activeModal === 'snippets' ? 'max-w-3xl p-0 overflow-hidden' : 'max-w-md'} shadow-2xl relative`}
            >
              <button onClick={() => setActiveModal('none')} className="absolute top-4 right-4 p-2 text-lyra-text-secondary hover:text-lyra-text bg-lyra-surface hover:bg-lyra-accent/10 rounded-full transition-colors z-10">
                <X size={16} />
              </button>

              {activeModal === 'projectPicker' && (
                <>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Command size={20} className="text-lyra-accent" /> Pilih Proyek</h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {savedProjects.length === 0 ? (
                      <div className="text-center opacity-50 py-4 text-sm">Belum ada proyek. Buat di halaman Projects.</div>
                    ) : (
                      savedProjects.map((p, i) => (
                        <button key={i} onClick={() => {
                          // Change the active project context via URL to trigger re-fetch and cleanup
                          router.push(`/chat?project_id=${p.id}`);
                          setActiveModal('none');
                        }} className={`w-full text-left p-4 rounded-xl border transition-colors flex flex-col gap-1 ${activeProject?.id === p.id ? 'bg-lyra-accent/10 border-lyra-accent' : 'border-lyra-accent/20 hover:border-lyra-accent/50 hover:bg-lyra-accent/5'}`}>
                          <div className="font-bold text-lyra-text flex items-center gap-2">
                            {p.name} {activeProject?.id === p.id && <CheckCircle2 size={14} className="text-lyra-accent" />}
                          </div>
                          <div className="text-xs text-lyra-text-secondary line-clamp-1">{p.description || 'Tanpa deskripsi'}</div>
                        </button>
                      ))
                    )}
                  </div>
                  <button onClick={() => router.push('/projects')} className="w-full mt-4 bg-black/20 text-lyra-text p-3 rounded-xl font-semibold hover:bg-black/30 transition-colors text-sm">Kelola Proyek</button>
                </>
              )}

              {activeModal === 'urlConnector' && (
                <>
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Globe size={20} className="text-lyra-accent" /> Tautkan Halaman Web</h3>
                  <p className="text-sm opacity-60 mb-6">Masukkan tautan artikel, dokumentasi, atau API. AI akan langsung membaca isinya secara otomatis.</p>
                  
                  <div className="flex gap-2 mb-4">
                    <input
                      type="url"
                      autoFocus
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddUrl(); }}
                      placeholder="https://..."
                      className="flex-1 bg-black/20 border border-lyra-accent/20 rounded-xl p-3 text-lyra-text outline-none focus:border-lyra-accent"
                    />
                  </div>

                  <div className="flex gap-2 mb-6">
                    <button onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        setUrlInput(text);
                      } catch(e) {}
                    }} className="text-xs bg-black/20 hover:bg-lyra-accent/20 border border-lyra-accent/10 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                      <Clipboard size={12}/> Tempel dari clipboard
                    </button>
                    <button onClick={() => setUrlInput('')} className="text-xs bg-black/20 hover:bg-red-500/20 border border-red-500/10 px-3 py-1.5 rounded-lg transition-colors text-red-400">
                      Hapus
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => { setActiveModal('none'); setUrlInput(''); }} className="flex-1 bg-black/20 text-lyra-text p-3 rounded-xl font-semibold hover:bg-black/30 transition-colors">Batal</button>
                    <button onClick={handleAddUrl} disabled={!urlInput} className="flex-1 bg-lyra-accent text-white p-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                      Tautkan <Link size={16} />
                    </button>
                  </div>
                </>
              )}

              {activeModal === 'snippets' && (
                <div className="w-full h-[75vh] flex flex-col">
                  {/* Header & Tabs */}
                  <div className="p-6 pb-0 border-b border-lyra-border/50 bg-lyra-surface">
                    <h3 className="text-xl font-bold flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-lyra-md bg-lyra-bg shadow-neo-inset flex items-center justify-center text-lyra-accent">
                        <MessageSquare size={20} />
                      </div>
                      <div>
                        Prompt Snippets & Skills
                        <p className="text-xs text-lyra-text-muted font-normal mt-1">Kemampuan, Pengetahuan, dan Ingatan Inti JARVIS</p>
                      </div>
                    </h3>
                    
                    <div className="flex gap-6 border-b border-transparent">
                      <button 
                        onClick={() => setActiveSnippetsTab('skills')}
                        className={`pb-3 text-sm font-bold transition-all relative ${activeSnippetsTab === 'skills' ? 'text-lyra-accent' : 'text-lyra-text-secondary hover:text-lyra-text'}`}
                      >
                        Panggil Kemampuan
                        {activeSnippetsTab === 'skills' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-lyra-accent rounded-t-full shadow-[0_-2px_8px_rgba(var(--color-lyra-accent),0.5)]"></div>}
                      </button>
                      <button 
                        onClick={() => setActiveSnippetsTab('snippets')}
                        className={`pb-3 text-sm font-bold transition-all relative ${activeSnippetsTab === 'snippets' ? 'text-lyra-accent' : 'text-lyra-text-secondary hover:text-lyra-text'}`}
                      >
                        Gunakan Snippet
                        {activeSnippetsTab === 'snippets' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-lyra-accent rounded-t-full shadow-[0_-2px_8px_rgba(var(--color-lyra-accent),0.5)]"></div>}
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 flex overflow-hidden bg-lyra-bg relative">
                    
                    {/* SKILLS TAB */}
                    {activeSnippetsTab === 'skills' && (
                      <>
                        {/* Left Sidebar - Categories */}
                        <div className="w-48 border-r border-lyra-border/50 bg-lyra-surface/30 overflow-y-auto p-4 space-y-1">
                          {(() => {
                            const categories = ['All', ...Array.from(new Set(skillsList.map(s => s.category)))].filter(Boolean);
                            return categories.map(cat => (
                              <button
                                key={cat}
                                onClick={() => setSelectedSkillCategory(cat)}
                                className={`w-full text-left px-3 py-2 rounded-lyra-md text-sm font-medium transition-colors ${selectedSkillCategory === cat ? 'bg-lyra-surface shadow-neo text-lyra-accent' : 'text-lyra-text-secondary hover:bg-lyra-surface-inset hover:text-lyra-text'}`}
                              >
                                {cat === 'All' ? 'Semua' : cat.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                <span className="float-right text-[10px] opacity-50 mt-0.5">
                                  {cat === 'All' ? skillsList.length : skillsList.filter(s => s.category === cat).length}
                                </span>
                              </button>
                            ));
                          })()}
                        </div>

                        {/* Right Content - Skills Grid */}
                        <div className="flex-1 overflow-y-auto p-4">
                          {skillsLoading ? (
                            <div className="h-full flex items-center justify-center text-lyra-text-muted animate-pulse text-sm">
                              Memuat kemampuan...
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {skillsList.filter(s => selectedSkillCategory === 'All' || s.category === selectedSkillCategory).map(skill => (
                                <button
                                  key={skill.name}
                                  onClick={() => {
                                    setInputMessage((prev) => prev + (prev ? ' ' : '') + `@skill:${skill.name} `);
                                    setActiveModal('none');
                                  }}
                                  className="text-left p-3 rounded-lyra-lg bg-lyra-surface border border-lyra-border/50 hover:border-lyra-accent/50 hover:shadow-neo transition-all group flex flex-col"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-sm text-lyra-text group-hover:text-lyra-accent transition-colors truncate">{skill.name}</span>
                                  </div>
                                  <p className="text-[10px] text-lyra-text-muted line-clamp-2 leading-relaxed flex-1">
                                    {skill.description}
                                  </p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* SNIPPETS TAB */}
                    {activeSnippetsTab === 'snippets' && (
                      <div className="flex-1 p-6 overflow-y-auto">
                        <div className="grid grid-cols-1 gap-3">
                          {snippetsList.map((snip, i) => (
                            <button key={snip.id || i} onClick={() => { setInputMessage(snip.text); setActiveModal('none'); }} className="text-left p-3 rounded-lyra-md bg-lyra-surface border border-lyra-border/50 hover:border-lyra-accent/50 hover:shadow-neo transition-all group flex flex-col">
                              <span className="font-bold text-xs text-lyra-text-secondary group-hover:text-lyra-accent transition-colors block mb-1">{snip.title}</span>
                              <span className="text-sm text-lyra-text line-clamp-2">{snip.text}</span>
                            </button>
                          ))}
                          {snippetsList.length === 0 && (
                            <div className="text-center text-sm text-lyra-text-muted py-10">Belum ada snippet. Kelola di menu Kemampuan (Skills).</div>
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}

              {(activeModal === 'github' || activeModal === 'notion') && (
                <>
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    {activeModal === 'github' ? <GitBranch size={20} /> : <Library size={20} />}
                    Hubungkan {activeModal === 'github' ? 'GitHub' : 'Notion'}
                  </h3>
                  <p className="text-sm opacity-60 mb-6">Masukkan Personal Access Token Anda untuk membaca repositori dan database secara langsung.</p>
                  <input
                    type="password"
                    id="tokenInput"
                    placeholder="Paste token di sini..."
                    className="w-full bg-black/20 border border-lyra-accent/20 rounded-xl p-3 text-lyra-text outline-none focus:border-lyra-accent mb-4"
                  />
                  <button onClick={() => saveIntegrationToken(activeModal as 'github'|'notion', (document.getElementById('tokenInput') as HTMLInputElement).value)} className="w-full bg-lyra-accent text-white p-3 rounded-xl font-semibold hover:opacity-90 transition-opacity">
                    Simpan & Hubungkan
                  </button>
                  {(activeModal === 'github' && githubToken) || (activeModal === 'notion' && notionToken) ? (
                    <button onClick={() => saveIntegrationToken(activeModal as 'github'|'notion', '')} className="w-full mt-2 text-red-400 p-2 text-sm hover:underline">Putuskan Koneksi</button>
                  ) : null}
                </>
              )}

              {activeModal === 'folderPicker' && (
                <>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Folder size={20} className="text-lyra-accent" /> Pilih Direktori Folder</h3>
                  
                  <div className="flex gap-2 mb-4">
                    <button onClick={() => {
                      if (browseDir === 'ROOT') return;
                      const parts = browseDir.replace(/\\/g, '/').split('/').filter(Boolean);
                      if (parts.length > 1) {
                        parts.pop();
                        loadBrowseDir(parts.join('/') + '/');
                      } else {
                        loadBrowseDir('ROOT');
                      }
                    }} className="bg-black/20 text-lyra-text p-2 px-3 rounded-lg hover:bg-lyra-accent/20 transition-colors">
                      ← Kembali (Naik)
                    </button>
                    <div className="flex-1 bg-black/20 p-2 px-3 rounded-lg font-mono text-xs flex items-center overflow-hidden whitespace-nowrap overflow-ellipsis">
                      {browseDir}
                    </div>
                  </div>

                  <div className="w-full h-64 bg-black/20 border border-lyra-accent/10 rounded-xl overflow-y-auto mb-4">
                    {browseFiles.length === 0 ? (
                      <div className="p-4 text-center text-xs opacity-50 italic">Folder kosong atau akses ditolak.</div>
                    ) : (
                      browseFiles.map((f, idx) => (
                        <button key={idx} onClick={() => loadBrowseDir(f.path)} className="w-full text-left p-3 border-b border-lyra-accent/5 hover:bg-lyra-accent/10 flex items-center gap-3 transition-colors">
                          <Folder size={16} className="text-lyra-accent/70" />
                          <span className="text-sm truncate">{f.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button onClick={() => setActiveModal('none')} className="flex-1 bg-black/20 text-lyra-text p-3 rounded-xl font-semibold hover:bg-black/30 transition-colors">Batal</button>
                    <button onClick={() => {
                      setCurrentWorkspace(browseDir);
                      setIsRightPanelOpen(true);
                      setActiveModal('none');
                    }} className="flex-1 bg-lyra-accent text-white p-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                      Pilih Folder Ini <Check size={16} />
                    </button>
                  </div>
                </>
              )}

              {activeModal === 'sketch' && (
                <>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><PenTool size={20} className="text-lyra-accent" /> Sketsa (Canvas)</h3>
                  <div className="w-full h-64 bg-white rounded-xl mb-4 overflow-hidden relative cursor-crosshair border-2 border-lyra-accent/20">
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={256}
                      className="w-full h-full bg-white touch-none"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseOut={stopDrawing}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { const ctx = canvasRef.current?.getContext('2d'); if(ctx) ctx.clearRect(0,0,400,256); }} className="flex-1 bg-black/20 text-lyra-text p-3 rounded-xl font-semibold hover:bg-black/30 transition-colors">Bersihkan</button>
                    <button onClick={saveSketch} className="flex-1 bg-lyra-accent text-white p-3 rounded-xl font-semibold hover:opacity-90 transition-opacity">Simpan & Lampirkan</button>
                  </div>
                </>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}