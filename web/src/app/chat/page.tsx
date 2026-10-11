'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation, useI18nStore } from '@/i18n';
import { MessageSquare, Plus, Send, Menu, Terminal, Globe, FileText, Wrench, ChevronDown, ChevronRight, ChevronLeft, ArrowDown, CheckCircle2, CircleDashed, BrainCircuit, MoreVertical, Edit2, Trash2, Check, X, Pin, DownloadCloud, PinOff, Paperclip, Folder, File, ImageIcon, XCircle, Columns, Monitor, Settings, Zap, Database, FolderTree, Clipboard, PenTool, Link, Search, ImagePlus, GitBranch, Library, Command, Sparkles, Code, FileEdit, Lightbulb, Coffee, RefreshCw, Square, ArrowUp, Share2, ThumbsDown, Volume2, RotateCw, MoreHorizontal, FolderPlus, FilePlus, CornerLeftUp, ExternalLink, Upload } from 'lucide-react';
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
  const duration = reasoning.endTime ? ((reasoning.endTime - reasoning.startTime) / 1000).toFixed(1) + ' detik' : null;
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
            {isRunning ? 'Berpikir...' : (duration ? `Telah berpikir selama ${duration}` : 'Proses Berpikir')}
          </span>
          {isRunning && <LiveTicker isRunning={true} startTime={reasoning.startTime} />}
        </div>
        {hasText && (
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.15 }}>
            <ChevronDown size={16} className="text-lyra-accent/70" />
          </motion.div>
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

function CodeBlock({ inline, className, children, ...props }: any) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const languageName = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  if (inline) {
    return (
      <code className="px-1.5 py-0.5 rounded-md bg-black/20 dark:bg-white/10 text-lyra-accent font-mono text-[13px] border border-lyra-accent/20" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative my-3 rounded-2xl overflow-hidden border border-white/10 bg-zinc-950/95 shadow-xl text-sm group">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/90 border-b border-white/5 text-xs text-zinc-400 font-mono select-none">
        <span className="font-semibold text-zinc-300 lowercase">{languageName || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition-all cursor-pointer text-xs"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400 stroke-[2.5]" />
              <span className="text-emerald-400 font-medium">Tersalin</span>
            </>
          ) : (
            <>
              <Clipboard size={12} />
              <span>Salin kode</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed text-zinc-200">
        <pre className="!bg-transparent !p-0 !m-0 !border-none font-mono">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    </div>
  );
}

const markdownComponents = {
  code: CodeBlock,
  pre: ({ children }: any) => <>{children}</>,
  p: ({ children }: any) => {
    // If paragraph contains a block code element, render a div to prevent HTML hydration errors (div/pre inside p)
    const hasBlock = React.Children.toArray(children).some((child: any) => {
      return (
        React.isValidElement(child) &&
        (child.type === CodeBlock || (child.props as any)?.className?.includes('language-'))
      );
    });
    if (hasBlock) {
      return <div className="leading-relaxed my-2">{children}</div>;
    }
    return <p className="leading-relaxed my-2">{children}</p>;
  }
};

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
            {(session.parent_session_id || session.title?.includes('(Branch)')) && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium shrink-0 flex items-center gap-0.5 mr-1" title="Percakapan bercabang">
                <GitBranch size={10} />
              </span>
            )}
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

function NativeChatContent() {
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

  const currentActiveSession = sessions.find(s => s.id === activeSessionId) || null;
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 180;
    setShowScrollBottom(isFarFromBottom);
  };
  
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

  // Enhanced Workspace States
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState('');
  const [isWorkspaceDragging, setIsWorkspaceDragging] = useState(false);
  const [isWorkspaceUploading, setIsWorkspaceUploading] = useState(false);
  const [creatingType, setCreatingType] = useState<'file' | 'folder' | null>(null);
  const [creatingName, setCreatingName] = useState('');
  const [activeFileMenu, setActiveFileMenu] = useState<any | null>(null);
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<any | null>(null);
  const workspaceFileInputRef = useRef<HTMLInputElement>(null);

  // Model & Reasoning Effort states (Matching Image 3 & Image 4)
  const DEFAULT_MODELS = [
    { id: 'hermes-agent', name: 'Hermes Agent', badge: 'Med' },
    { id: 'kat-coder-pro', name: 'Kat Coder Pro V2.5:Free', badge: 'Med' },
    { id: 'frontier', name: 'Frontier', badge: 'Med' },
    { id: 'balanced', name: 'Balanced', badge: 'Med' },
    { id: 'minimax-m2.7', name: 'Minimax M2.7', badge: 'Med' },
    { id: 'minimax-m3', name: 'Minimax M3', badge: 'Med' },
    { id: 'glm-5.2', name: 'Glm 5.2', badge: 'Med' },
    { id: 'deepseek-v4-pro', name: 'Deepseek V4 Pro', badge: 'Med' },
    { id: 'deepseek-v4-flash', name: 'Deepseek V4 Flash', badge: 'Med' },
    { id: 'kimi-k2.6', name: 'Kimi K2.6', badge: 'Med' },
    { id: 'nemotron-3-ultra', name: 'Nemotron 3 Ultra 550b A55b', badge: 'Med' },
  ];
  const [modelsList, setModelsList] = useState(DEFAULT_MODELS);
  const [selectedModel, setSelectedModel] = useState('Hermes Agent');
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isEffortMenuOpen, setIsEffortMenuOpen] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [thinkingEffort, setThinkingEffort] = useState<'Minimal' | 'Low' | 'Medium' | 'High' | 'Extra High' | 'Max' | 'Ultra'>('Medium');
  const [isRefreshingModels, setIsRefreshingModels] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const getEffortBadge = (effort: string) => {
    switch (effort) {
      case 'Minimal': return 'Min';
      case 'Low': return 'Low';
      case 'Medium': return 'Med';
      case 'High': return 'High';
      case 'Extra High': return 'XHigh';
      case 'Max': return 'Max';
      case 'Ultra': return 'Ultra';
      default: return 'Med';
    }
  };

  const daysId = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [currentDayName, setCurrentDayName] = useState('Minggu');

  useEffect(() => {
    const d = new Date();
    setCurrentDayName(language === 'id' ? daysId[d.getDay()] : daysEn[d.getDay()]);
  }, [language]);

  const handleStarterPrompt = (type: string) => {
    if (type === 'kode') {
      setInputMessage(language === 'id' ? 'Bantu saya menulis kode untuk ' : 'Help me write code for ');
    } else if (type === 'web') {
      setIsWebSearchEnabled(true);
      setInputMessage(language === 'id' ? 'Cari informasi terbaru tentang ' : 'Search latest info on ');
    } else if (type === 'tulis') {
      setInputMessage(language === 'id' ? 'Bantu saya menulis draf untuk ' : 'Help me draft ');
    } else if (type === 'analisis') {
      setInputMessage(language === 'id' ? 'Analisis arsitektur sistem berikut: ' : 'Analyze the following system architecture: ');
    } else if (type === 'rencana') {
      setInputMessage(language === 'id' ? 'Buat rencana terstruktur untuk ' : 'Create a structured plan for ');
    }
    inputRef.current?.focus();
  };

  const handleRefreshModels = async () => {
    setIsRefreshingModels(true);
    try {
      const res = await fetch('/api/settings/ai');
      const data = await res.json();
      if (data.model) {
        setModelsList(prev => {
          if (!prev.some(m => m.name.toLowerCase() === data.model.toLowerCase())) {
            return [{ id: data.model, name: data.model, badge: 'Med' }, ...prev];
          }
          return prev;
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsRefreshingModels(false), 500);
    }
  };

  // --- PERSISTENCE (localStorage) ---
  // Restore preferences on initial mount
  useEffect(() => {
    try {
      const savedModel = localStorage.getItem('lyra_chat_model');
      if (savedModel) setSelectedModel(savedModel);

      const savedReasoning = localStorage.getItem('lyra_chat_reasoning');
      if (savedReasoning !== null) setIsReasoningEnabled(savedReasoning === 'true');

      const savedEffort = localStorage.getItem('lyra_chat_effort');
      if (savedEffort) setThinkingEffort(savedEffort as any);

      const savedWebSearch = localStorage.getItem('lyra_chat_web_search');
      if (savedWebSearch !== null) setIsWebSearchEnabled(savedWebSearch === 'true');

      const savedDeepResearch = localStorage.getItem('lyra_chat_deep_research');
      if (savedDeepResearch !== null) setIsDeepResearchEnabled(savedDeepResearch === 'true');
    } catch (e) {
      console.warn('Failed to load chat preferences from localStorage', e);
    }
  }, []);

  // Save preferences whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('lyra_chat_model', selectedModel);
    } catch (e) {}
  }, [selectedModel]);

  useEffect(() => {
    try {
      localStorage.setItem('lyra_chat_reasoning', String(isReasoningEnabled));
    } catch (e) {}
  }, [isReasoningEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('lyra_chat_effort', thinkingEffort);
    } catch (e) {}
  }, [thinkingEffort]);

  useEffect(() => {
    try {
      localStorage.setItem('lyra_chat_web_search', String(isWebSearchEnabled));
    } catch (e) {}
  }, [isWebSearchEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('lyra_chat_deep_research', String(isDeepResearchEnabled));
    } catch (e) {}
  }, [isDeepResearchEnabled]);

  // Sync draft message per-session from localStorage
  useEffect(() => {
    try {
      const draftKey = activeSessionId ? `lyra_chat_draft_${activeSessionId}` : 'lyra_chat_draft_new';
      const saved = localStorage.getItem(draftKey);
      setInputMessage(saved || '');
    } catch (e) {}
  }, [activeSessionId]);

  // Save typing draft message to localStorage
  useEffect(() => {
    try {
      const draftKey = activeSessionId ? `lyra_chat_draft_${activeSessionId}` : 'lyra_chat_draft_new';
      if (inputMessage) {
        localStorage.setItem(draftKey, inputMessage);
      } else {
        localStorage.removeItem(draftKey);
      }
    } catch (e) {}
  }, [inputMessage, activeSessionId]);

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
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    isStreamingRef.current = false;
    setMessages(prev => {
      const newMsgs = [...prev];
      if (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].role === 'assistant') {
        const lastMsg = { ...newMsgs[newMsgs.length - 1] };
        if (lastMsg.reasoning && !lastMsg.reasoning.endTime) {
          lastMsg.reasoning = { ...lastMsg.reasoning, endTime: Date.now() };
        }
        newMsgs[newMsgs.length - 1] = lastMsg;
      }
      return newMsgs;
    });
  };
  
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
        if (data.cwd) {
          const cleanCwd = data.cwd.replace(/\\/g, '/');
          setCurrentWorkspace(cleanCwd);
          setWorkspaceInput(cleanCwd);
        }
      }
    } catch(e) {
      console.error(e);
    }
  };

  const handleWorkspaceBack = () => {
    if (!currentWorkspace || currentWorkspace === 'ROOT') return;
    const norm = currentWorkspace.replace(/\\/g, '/').replace(/\/$/, '');
    const parts = norm.split('/').filter(Boolean);
    if (parts.length <= 1) {
      loadWorkspaceFiles('ROOT');
      return;
    }
    parts.pop();
    const parentDir = parts.join('/') + (norm.startsWith('/') ? '/' : '');
    const finalParent = parentDir.match(/^[a-zA-Z]:$/) ? `${parentDir}/` : parentDir;
    loadWorkspaceFiles(finalParent);
  };

  const handleWorkspaceRefresh = () => {
    if (currentWorkspace) {
      loadWorkspaceFiles(currentWorkspace);
    }
  };

  const handleWorkspaceUpload = async (fileList: FileList | File[]) => {
    if (!currentWorkspace || fileList.length === 0) return;
    setIsWorkspaceUploading(true);
    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('targetDir', currentWorkspace);
        await fetch('/api/workspace/upload', {
          method: 'POST',
          body: formData
        });
      }
      await loadWorkspaceFiles(currentWorkspace);
      setBranchNotification(language === 'id' ? 'File berhasil diunggah ke workspace' : 'Files uploaded to workspace');
      setTimeout(() => setBranchNotification(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Upload gagal');
    } finally {
      setIsWorkspaceUploading(false);
      setIsWorkspaceDragging(false);
    }
  };

  const handleWorkspaceDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsWorkspaceDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleWorkspaceUpload(e.dataTransfer.files);
    }
  };

  const handleCreateFileOrFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatingName.trim() || !currentWorkspace) return;
    try {
      if (creatingType === 'folder') {
        const res = await fetch('/api/workspace/mkdir', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dirPath: currentWorkspace, folderName: creatingName.trim() })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      } else if (creatingType === 'file') {
        const res = await fetch('/api/workspace/create-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dirPath: currentWorkspace, fileName: creatingName.trim() })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }
      setCreatingType(null);
      setCreatingName('');
      await loadWorkspaceFiles(currentWorkspace);
    } catch (err: any) {
      alert(err.message || 'Gagal membuat file/folder');
    }
  };

  const handleDeleteWorkspaceItem = async (targetPath: string) => {
    try {
      const res = await fetch('/api/workspace/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPath })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDeleteConfirmFile(null);
      await loadWorkspaceFiles(currentWorkspace);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus');
    }
  };

  const handleRevealInExplorer = async (targetPath: string) => {
    try {
      await fetch('/api/workspace/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPath })
      });
    } catch (e) {
      console.error('Failed to reveal in explorer', e);
    }
  };

  const handleMentionInChat = (fileItem: any) => {
    const refTag = fileItem.isDirectory ? `@folder:${fileItem.name} ` : `@file:${fileItem.name} `;
    setInputMessage(prev => prev ? `${prev} ${refTag}` : refTag);
    setAttachments(prev => {
      const exists = prev.some(a => a.path === fileItem.path);
      if (exists) return prev;
      return [...prev, {
        name: fileItem.name,
        path: fileItem.path,
        isDirectory: fileItem.isDirectory,
        isWorkspaceRef: true
      }];
    });
    setBranchNotification(language === 'id' ? `Disematkan di chat: ${fileItem.name}` : `Mentioned in chat: ${fileItem.name}`);
    setTimeout(() => setBranchNotification(null), 2500);
  };

  const handleCopyPath = (targetPath: string) => {
    navigator.clipboard.writeText(targetPath);
    setBranchNotification(language === 'id' ? 'Path berhasil disalin' : 'Path copied');
    setTimeout(() => setBranchNotification(null), 2500);
  };

  const getFileIcon = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) {
      return <Folder size={15} className="text-amber-400 shrink-0" />;
    }
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return <Code size={15} className="text-blue-400 shrink-0" />;
      case 'js':
      case 'jsx':
        return <Code size={15} className="text-yellow-400 shrink-0" />;
      case 'py':
        return <Code size={15} className="text-emerald-400 shrink-0" />;
      case 'json':
        return <FileText size={15} className="text-amber-500 shrink-0" />;
      case 'md':
        return <FileText size={15} className="text-purple-400 shrink-0" />;
      case 'css':
      case 'scss':
        return <FileText size={15} className="text-cyan-400 shrink-0" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'svg':
      case 'webp':
        return <ImageIcon size={15} className="text-rose-400 shrink-0" />;
      case 'html':
        return <Globe size={15} className="text-orange-400 shrink-0" />;
      default:
        return <File size={15} className="text-lyra-text-secondary/70 shrink-0" />;
    }
  };

  const getBreadcrumbSegments = (currPath: string) => {
    if (!currPath || currPath === 'ROOT') return [{ name: 'ROOT', path: 'ROOT' }];
    const norm = currPath.replace(/\\/g, '/');
    const parts = norm.split('/').filter(Boolean);
    const segments: { name: string, path: string }[] = [];
    let buildPath = '';
    for (let i = 0; i < parts.length; i++) {
      if (i === 0 && parts[0].includes(':')) {
        buildPath = `${parts[0]}/`;
      } else {
        buildPath = `${buildPath}${buildPath.endsWith('/') ? '' : '/'}${parts[i]}`;
      }
      segments.push({ name: parts[i], path: buildPath });
    }
    return segments;
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
    } else {
      try {
        const savedSid = localStorage.getItem('lyra_chat_active_session');
        if (savedSid) {
          setActiveSessionId(savedSid);
        }
      } catch (e) {}
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
      try {
        localStorage.setItem('lyra_chat_active_session', activeSessionId);
      } catch (e) {}
      if (!isStreamingRef.current) {
        fetchMessages(activeSessionId);
      }
      updateUrlWithSession(activeSessionId);
    } else {
      try {
        localStorage.removeItem('lyra_chat_active_session');
      } catch (e) {}
      updateUrlWithSession(null);
      setMessages([]);
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

  // User Message Edit & Copy states
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editMessageText, setEditMessageText] = useState('');
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);

  // Action & Branch states (Matching Screenshots 1 & 2)
  const [openMoreMenuIndex, setOpenMoreMenuIndex] = useState<number | null>(null);
  const [dislikedMessageIndices, setDislikedMessageIndices] = useState<number[]>([]);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const [isBranching, setIsBranching] = useState(false);
  const [branchNotification, setBranchNotification] = useState<string | null>(null);

  const formatMessageTime = (ts?: number) => {
    if (!ts) return '';
    const d = new Date(ts);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDetailTime = (ts?: number) => {
    if (!ts) return language === 'id' ? 'hari ini' : 'today';
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    if (isToday) {
      return language === 'id' ? `hari ini, ${timeStr}` : `today, ${timeStr}`;
    }
    return `${d.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })}, ${timeStr}`;
  };

  const handleShareMessage = async (content: string) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text: content, title: 'Lyra Chat' });
        return;
      } catch (e) {}
    }
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(content);
      setBranchNotification(language === 'id' ? 'Teks berhasil disalin untuk dibagikan' : 'Text copied to share');
      setTimeout(() => setBranchNotification(null), 2500);
    }
  };

  const handleToggleDislike = (index: number) => {
    setDislikedMessageIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleSpeakMessage = (index: number, content: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (speakingMessageIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingMessageIndex(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = content.replace(/[*#`_~[\]()]/g, '');
    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.lang = language === 'id' ? 'id-ID' : 'en-US';
    utter.onend = () => setSpeakingMessageIndex(null);
    utter.onerror = () => setSpeakingMessageIndex(null);
    setSpeakingMessageIndex(index);
    window.speechSynthesis.speak(utter);
  };

  const handleSwitchVariant = (msgIndex: number, targetVariantIndex: number) => {
    setMessages(prev => {
      const updated = [...prev];
      const m = updated[msgIndex];
      if (!m || !m.variants || targetVariantIndex < 0 || targetVariantIndex >= m.variants.length) return prev;
      updated[msgIndex] = {
        ...m,
        content: m.variants[targetVariantIndex],
        variantIndex: targetVariantIndex
      };
      return updated;
    });
  };

  const handleExportToMarkdown = () => {
    if (messages.length === 0) return;
    const sessionTitle = currentActiveSession?.title || 'Lyra_Chat';
    const cleanTitle = sessionTitle.replace(/[\\/:*?"<>|]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    
    let md = `# ${sessionTitle}\n\n`;
    md += `*Tanggal Ekspor: ${new Date().toLocaleString('id-ID')}*\n`;
    if (currentActiveSession?.parent_session_id) {
      md += `*Bercabang dari sesi: ${currentActiveSession.parent_session_id}*\n`;
    }
    md += `\n---\n\n`;

    for (const m of messages) {
      const roleName = m.role === 'user' ? '👤 Pengguna' : '🤖 Hermes';
      const timeStr = m.timestamp ? new Date(m.timestamp).toLocaleTimeString('id-ID') : '';
      md += `### ${roleName} ${timeStr ? `(${timeStr})` : ''}\n\n`;
      
      if (m.reasoning?.text) {
        md += `> **Proses Berpikir:**\n> \n`;
        md += m.reasoning.text.split('\n').map((line: string) => `> ${line}`).join('\n') + `\n\n`;
      }

      md += `${m.content || ''}\n\n`;
      md += `---\n\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanTitle}_${dateStr}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setBranchNotification(language === 'id' ? 'Obrolan berhasil diekspor ke Markdown (.md)' : 'Chat exported to Markdown (.md)');
    setTimeout(() => setBranchNotification(null), 3000);
  };

  const handleRegenerateFrom = async (index: number) => {
    if (isLoading) return;
    const priorUserMsgIdx = index - 1;
    if (priorUserMsgIdx < 0 || messages[priorUserMsgIdx]?.role !== 'user') return;
    const userPrompt = messages[priorUserMsgIdx].content;
    const userMsg = messages[priorUserMsgIdx];
    const existingAttachments = userMsg.attachments || [];
    const priorMessages = messages.slice(0, priorUserMsgIdx);
    
    // Save previous assistant response into variants
    const currentAssistantMsg = messages[index];
    const prevAssistantVariants = currentAssistantMsg?.variants || (currentAssistantMsg?.content ? [currentAssistantMsg.content] : []);
    
    await sendChatMessage(userPrompt, priorMessages, existingAttachments, userMsg.variants, prevAssistantVariants);
  };

  const handleBranchSession = async (messageIndex: number) => {
    setIsBranching(true);
    setOpenMoreMenuIndex(null);
    try {
      const res = await fetch('/api/sessions/branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_session_id: activeSessionId,
          message_index: messageIndex
        })
      });
      const data = await res.json();
      if (data.success && data.session_id) {
        const branchedMessages = messages.slice(0, messageIndex + 1);
        setMessages(branchedMessages);
        setActiveSessionId(data.session_id);
        updateUrlWithSession(data.session_id);
        try {
          localStorage.setItem('lyra_chat_active_session', data.session_id);
        } catch (e) {}
        fetchSessions();
        setBranchNotification(language === 'id' ? 'Obrolan berhasil dicabangkan ke obrolan baru' : 'Chat branched to a new conversation');
        setTimeout(() => setBranchNotification(null), 3500);
      } else {
        alert(data.error || 'Gagal membuat branch obrolan');
      }
    } catch (e: any) {
      console.error('Failed to branch session', e);
      alert(e.message || 'Gagal membuat branch obrolan');
    } finally {
      setIsBranching(false);
    }
  };

  const handleCopyMessage = (index: number, content: string) => {
    try {
      navigator.clipboard.writeText(content);
      setCopiedMessageIndex(index);
      setTimeout(() => setCopiedMessageIndex(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageIndex(null);
    setEditMessageText('');
  };

  const sendChatMessage = async (
    userText: string, 
    priorMessages?: any[], 
    messageAttachments?: any[],
    userVariants?: string[],
    prevAssistantVariants?: string[]
  ) => {
    if (!userText.trim()) return;

    const currentAttachments = messageAttachments !== undefined ? messageAttachments : attachments;
    const userVars = userVariants || [userText];
    const newMessage = { 
      role: 'user', 
      content: userText, 
      tools: [], 
      reasoning: null, 
      attachments: [...currentAttachments],
      timestamp: Date.now(),
      variants: userVars,
      variantIndex: userVars.length - 1
    };

    const initialMessages = priorMessages 
      ? [...priorMessages, newMessage] 
      : [...messages, newMessage];

    const assistantVariants = prevAssistantVariants ? [...prevAssistantVariants, ''] : [''];

    setMessages([
      ...initialMessages,
      { 
        role: 'assistant', 
        content: '', 
        rawContent: '',
        tools: [], 
        reasoning: { startTime: Date.now(), endTime: null, text: '' },
        timestamp: Date.now(),
        variants: assistantVariants,
        variantIndex: assistantVariants.length - 1
      }
    ]);
    setIsLoading(true);
    isStreamingRef.current = true;
    setEditingMessageIndex(null);

    let currentSessionId = activeSessionId;

    // Send payload
    const payload = {
      message: userText,
      session_id: activeSessionId,
      workspace: currentWorkspace || undefined,
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      systemPrompt: activeProject?.systemPrompt || undefined,
      model: selectedModel,
      thinking: isReasoningEnabled,
      effort: thinkingEffort,
      webSearch: isWebSearchEnabled,
      deepResearch: isDeepResearchEnabled
    };
    
    if (messageAttachments === undefined) {
      setAttachments([]);
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const res = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortController.signal
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
                      if (lastMsg.variants && lastMsg.variants.length > 0) {
                        lastMsg.variants = [...lastMsg.variants];
                        lastMsg.variants[lastMsg.variants.length - 1] = extracted.content;
                      }
                      
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
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log('Stream stopped by user');
      } else {
        console.error(e);
        setMessages(prev => {
          const newMsgs = [...prev];
          const lastMsg = newMsgs[newMsgs.length - 1];
          if (lastMsg) lastMsg.content += '\n\n**[Error: Koneksi terputus]**';
          return newMsgs;
        });
      }
    } finally {
      setIsLoading(false);
      isStreamingRef.current = false;
      abortControllerRef.current = null;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const userText = inputMessage;
    setInputMessage('');
    try {
      const draftKey = activeSessionId ? `lyra_chat_draft_${activeSessionId}` : 'lyra_chat_draft_new';
      localStorage.removeItem(draftKey);
    } catch (e) {}

    await sendChatMessage(userText);
  };

  const handleSaveAndSendEdit = async (index: number) => {
    if (!editMessageText.trim() || isLoading) return;
    const userText = editMessageText;
    const currentMsg = messages[index];
    const prevVariants = currentMsg?.variants || (currentMsg?.content ? [currentMsg.content] : []);
    const newVariants = [...prevVariants, userText];
    const priorMessages = messages.slice(0, index);
    const existingAttachments = currentMsg?.attachments || [];
    setEditingMessageIndex(null);
    setEditMessageText('');
    await sendChatMessage(userText, priorMessages, existingAttachments, newVariants);
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
            onClick={() => {
              setActiveSessionId(null);
              setMessages([]);
              updateUrlWithSession(null);
              try {
                localStorage.removeItem('lyra_chat_active_session');
                const saved = localStorage.getItem('lyra_chat_draft_new');
                setInputMessage(saved || '');
              } catch (e) {}
            }}
            className="w-full bg-lyra-accent/10 hover:bg-lyra-accent/20 text-lyra-accent py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium cursor-pointer"
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

      {/* Floating Minimal Toggle Sidebar Chat (Ketika Ditutup) */}
      {!isSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-30 w-5 h-11 hover:w-6 bg-lyra-surface/90 hover:bg-lyra-surface border-y border-r border-lyra-accent/30 hover:border-lyra-accent rounded-r-lg shadow-md backdrop-blur-md flex items-center justify-center text-lyra-text-secondary hover:text-lyra-accent transition-all duration-200 cursor-pointer group active:scale-95"
          title={language === 'id' ? 'Buka Daftar Obrolan' : 'Open Chats'}
        >
          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform text-lyra-accent" />
        </button>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        <div className="p-4 flex items-center gap-3 border-b border-white/5 bg-lyra-surface/50 backdrop-blur-md sticky top-0 z-10 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-md text-lyra-text-secondary transition-colors shrink-0">
              <Menu size={20} />
            </button>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 truncate">
                <span className="font-semibold text-base sm:text-lg truncate">
                  {currentActiveSession?.title || (language === 'id' ? 'Percakapan AI' : 'AI Conversation')}
                </span>
                {(currentActiveSession?.parent_session_id || currentActiveSession?.title?.includes('(Branch)')) && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shrink-0">
                    <GitBranch size={10} />
                    Branch
                  </span>
                )}
              </div>
              {currentActiveSession?.parent_session_id && (
                <button
                  type="button"
                  onClick={() => setActiveSessionId(currentActiveSession.parent_session_id)}
                  className="text-[11px] text-lyra-accent/80 hover:text-lyra-accent hover:underline flex items-center gap-1 text-left cursor-pointer truncate"
                  title="Kembali ke obrolan sumber"
                >
                  <GitBranch size={11} className="text-emerald-400 shrink-0" />
                  <span className="truncate">← {language === 'id' ? 'Kembali ke sesi induk' : 'Back to parent session'}</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {/* Export to Markdown Button */}
            <button
              type="button"
              onClick={handleExportToMarkdown}
              disabled={messages.length === 0}
              className="p-2 rounded-lg hover:bg-white/10 text-lyra-text-secondary hover:text-lyra-text transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border border-white/5"
              title={language === 'id' ? 'Ekspor obrolan ke Markdown (.md)' : 'Export chat to Markdown (.md)'}
            >
              <DownloadCloud size={16} />
              <span className="hidden sm:inline">{language === 'id' ? 'Ekspor .md' : 'Export .md'}</span>
            </button>

            <button 
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)} 
              className={`p-2 rounded-md transition-colors ${isRightPanelOpen ? 'bg-lyra-accent/20 text-lyra-accent' : 'hover:bg-white/10 text-lyra-text-secondary'}`}
              title="Toggle Workspace Panel"
            >
              <Columns size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {activeProject && messages.length === 0 && (
            <div className="w-full text-center py-10 opacity-70">
              <div className="w-16 h-16 bg-lyra-accent/10 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <Command size={32} className="text-lyra-accent" />
              </div>
              <h2 className="text-2xl font-bold text-lyra-text mb-2">Proyek: {activeProject.name}</h2>
              <p className="text-sm max-w-md mx-auto">{activeProject.description}</p>
            </div>
          )}

          {!activeProject && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto px-4 text-center select-none py-12">
              {/* Claude Style Starburst Icon */}
              <div className="mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#D97757]/15 border border-[#D97757]/30 flex items-center justify-center text-[#D97757] shadow-lg shadow-[#D97757]/10">
                  <Sparkles size={24} className="animate-pulse" />
                </div>
              </div>

              {/* Claude Style Greeting */}
              <h1 className="text-3xl md:text-4xl font-serif font-normal text-lyra-text tracking-tight mb-2">
                {language === 'id' ? `Sesi hari ${currentDayName}, riskal?` : `${currentDayName} session, riskal?`}
              </h1>

              {/* ChatGPT Style Subtitle */}
              <p className="text-sm text-lyra-text-secondary opacity-75 mb-8">
                {language === 'id' ? 'Mulai dari mana hari ini?' : 'Where should we start today?'}
              </p>

              {/* Claude & ChatGPT Action Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-xl">
                <button
                  type="button"
                  onClick={() => handleStarterPrompt('kode')}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-lyra-accent/20 bg-lyra-surface hover:bg-lyra-accent/15 hover:border-lyra-accent text-xs font-medium text-lyra-text transition-all duration-150 hover:scale-[1.02] shadow-sm cursor-pointer"
                >
                  <Code size={14} className="text-amber-500" />
                  <span>{language === 'id' ? 'Kode' : 'Code'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStarterPrompt('web')}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-lyra-accent/20 bg-lyra-surface hover:bg-lyra-accent/15 hover:border-lyra-accent text-xs font-medium text-lyra-text transition-all duration-150 hover:scale-[1.02] shadow-sm cursor-pointer"
                >
                  <Globe size={14} className="text-blue-400" />
                  <span>{language === 'id' ? 'Cari di Web' : 'Web Search'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStarterPrompt('tulis')}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-lyra-accent/20 bg-lyra-surface hover:bg-lyra-accent/15 hover:border-lyra-accent text-xs font-medium text-lyra-text transition-all duration-150 hover:scale-[1.02] shadow-sm cursor-pointer"
                >
                  <FileEdit size={14} className="text-emerald-500" />
                  <span>{language === 'id' ? 'Tulis' : 'Write'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStarterPrompt('analisis')}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-lyra-accent/20 bg-lyra-surface hover:bg-lyra-accent/15 hover:border-lyra-accent text-xs font-medium text-lyra-text transition-all duration-150 hover:scale-[1.02] shadow-sm cursor-pointer"
                >
                  <Lightbulb size={14} className="text-purple-400" />
                  <span>{language === 'id' ? 'Analisis' : 'Analysis'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStarterPrompt('rencana')}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-lyra-accent/20 bg-lyra-surface hover:bg-lyra-accent/15 hover:border-lyra-accent text-xs font-medium text-lyra-text transition-all duration-150 hover:scale-[1.02] shadow-sm cursor-pointer"
                >
                  <Coffee size={14} className="text-rose-400" />
                  <span>{language === 'id' ? 'Urusan Hidup' : 'Life & Plans'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Toast / Alert Notification for Branch or Share */}
          <AnimatePresence>
            {branchNotification && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-lyra-surface/95 border border-lyra-accent/40 text-lyra-text shadow-2xl flex items-center gap-2.5 text-xs font-medium backdrop-blur-md"
              >
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                <span>{branchNotification}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {messages.map((m, i) => (
            m.role === 'user' ? (
              /* User Message Row (Matching Gambar 1) */
              <div key={i} className="flex flex-col items-end group w-full mb-3">
                <div className="flex items-end justify-end max-w-[85%] sm:max-w-[75%] gap-2 w-full">
                  {/* Jam di samping kiri user */}
                  {m.timestamp && (
                    <span className="text-[11px] text-lyra-text-secondary/60 select-none pb-2 font-mono shrink-0">
                      {formatMessageTime(m.timestamp)}
                    </span>
                  )}

                  {/* User Message Bubble */}
                  <div className={`rounded-3xl p-5 relative transition-all max-w-full ${
                    editingMessageIndex === i 
                      ? 'w-full bg-lyra-accent text-white shadow-lg' 
                      : 'bg-lyra-accent text-white shadow-md shadow-lyra-accent/10'
                  }`}>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div className="text-sm font-semibold opacity-70 uppercase tracking-wider">
                        {language === 'id' ? 'Anda' : 'You'}
                      </div>
                    </div>

                    {/* Attachments if any */}
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

                    {/* User Edit Mode vs Normal Markdown Content */}
                    {editingMessageIndex === i ? (
                      <div className="flex flex-col gap-3 min-w-[280px] sm:min-w-[460px] pt-1">
                        <textarea
                          value={editMessageText}
                          onChange={(e) => setEditMessageText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveAndSendEdit(i);
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          className="w-full bg-black/30 text-white placeholder:text-white/50 border border-white/30 rounded-2xl p-4 text-sm focus:outline-none focus:border-white resize-y min-h-[100px] max-h-72 shadow-inner"
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-4 py-2 rounded-xl text-xs font-medium bg-black/30 hover:bg-black/50 text-white transition-colors cursor-pointer border border-white/10"
                          >
                            {language === 'id' ? 'Batal' : 'Cancel'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveAndSendEdit(i)}
                            disabled={isLoading || !editMessageText.trim()}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-zinc-900 hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                          >
                            <span>{language === 'id' ? 'Kirim' : 'Send'}</span>
                            <Send size={13} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      m.content && (
                        <div className="prose prose-p:leading-relaxed prose-pre:bg-lyra-bg prose-pre:border prose-pre:border-lyra-accent/10 prose-headings:text-white prose-p:text-white prose-a:text-white/90 prose-strong:text-white prose-code:text-white prose-ul:text-white prose-ol:text-white prose-li:text-white prose-table:text-white max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {m.content}
                          </ReactMarkdown>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Actions below User Message (Gambar 1): Salin, Bagikan, Edit, & Version Switcher */}
                {editingMessageIndex !== i && (
                  <div className="flex items-center gap-1 mt-1.5 mr-2">
                    {/* Version Switcher if variants > 1 */}
                    {m.variants && m.variants.length > 1 && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/20 text-white/90 text-xs select-none font-medium mr-1 shadow-xs">
                        <button
                          type="button"
                          onClick={() => handleSwitchVariant(i, (m.variantIndex ?? m.variants.length - 1) - 1)}
                          disabled={(m.variantIndex ?? m.variants.length - 1) <= 0}
                          className="p-0.5 rounded hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title={language === 'id' ? 'Versi sebelumnya' : 'Previous version'}
                        >
                          <ChevronLeft size={13} />
                        </button>
                        <span className="text-[11px] font-mono px-1">
                          {((m.variantIndex ?? m.variants.length - 1) + 1)} / {m.variants.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSwitchVariant(i, (m.variantIndex ?? m.variants.length - 1) + 1)}
                          disabled={(m.variantIndex ?? m.variants.length - 1) >= m.variants.length - 1}
                          className="p-0.5 rounded hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title={language === 'id' ? 'Versi berikutnya' : 'Next version'}
                        >
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    )}

                    {/* Salin */}
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(i, m.content)}
                      className="p-1.5 rounded-lg text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10 transition-colors cursor-pointer"
                      title={copiedMessageIndex === i ? (language === 'id' ? 'Tersalin!' : 'Copied!') : (language === 'id' ? 'Salin pesan' : 'Copy message')}
                    >
                      {copiedMessageIndex === i ? (
                        <Check size={14} className="text-emerald-400 stroke-[2.5]" />
                      ) : (
                        <Clipboard size={14} />
                      )}
                    </button>

                    {/* Bagikan */}
                    <button
                      type="button"
                      onClick={() => handleShareMessage(m.content)}
                      className="p-1.5 rounded-lg text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10 transition-colors cursor-pointer"
                      title={language === 'id' ? 'Bagikan' : 'Share'}
                    >
                      <Share2 size={14} />
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMessageIndex(i);
                        setEditMessageText(m.content || '');
                      }}
                      disabled={isLoading}
                      className="p-1.5 rounded-lg text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10 transition-colors cursor-pointer disabled:opacity-40"
                      title={language === 'id' ? 'Edit pesan' : 'Edit message'}
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Assistant Message Row (Matching Gambar 2) */
              <div key={i} className="flex flex-col items-start group w-full mb-3">
                <div className="flex items-end justify-start max-w-[85%] sm:max-w-[75%] gap-2 w-full">
                  {/* Assistant Bubble */}
                  <div className="rounded-3xl p-5 bg-lyra-surface border border-white/5 text-lyra-text shadow-sm transition-all max-w-full">
                    <div className="text-sm font-semibold opacity-60 uppercase tracking-wider mb-2">
                      Hermes
                    </div>

                    {/* Reasoning & Tools Execution Pipeline */}
                    <div className="mb-2">
                      {m.tools?.map((tool: any, idx: number) => (
                        <ToolCallCard key={idx} tool={tool} />
                      ))}
                      {m.reasoning && !m.reasoning.endTime && (
                        <ReasoningCard reasoning={m.reasoning} />
                      )}
                    </div>

                    {/* Markdown Content with CodeBlock */}
                    {m.content && (
                      <div className="prose prose-p:leading-relaxed prose-pre:bg-transparent prose-pre:p-0 prose-pre:border-none prose-headings:text-lyra-text prose-p:text-lyra-text prose-a:text-lyra-accent prose-strong:text-lyra-text prose-code:text-lyra-accent prose-ul:text-lyra-text prose-ol:text-lyra-text prose-li:text-lyra-text prose-table:text-lyra-text max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Jam di samping kanan jawaban ai */}
                  {m.timestamp && (
                    <span className="text-[11px] text-lyra-text-secondary/60 select-none pb-2 font-mono shrink-0">
                      {formatMessageTime(m.timestamp)}
                    </span>
                  )}
                </div>

                {/* Actions below Assistant Message (Gambar 2): Salin, Tidak Suka, Bagikan, Baca Keras, Kirim Ulang, ... */}
                {m.content && (
                  <div className="flex items-center gap-1 mt-1.5 ml-2 relative">
                    {/* Version Switcher if variants > 1 */}
                    {m.variants && m.variants.length > 1 && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-lyra-accent/10 text-lyra-text-secondary text-xs select-none font-medium mr-1">
                        <button
                          type="button"
                          onClick={() => handleSwitchVariant(i, (m.variantIndex ?? m.variants.length - 1) - 1)}
                          disabled={(m.variantIndex ?? m.variants.length - 1) <= 0}
                          className="p-0.5 rounded hover:bg-lyra-accent/20 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title={language === 'id' ? 'Versi sebelumnya' : 'Previous version'}
                        >
                          <ChevronLeft size={13} />
                        </button>
                        <span className="text-[11px] font-mono px-1">
                          {((m.variantIndex ?? m.variants.length - 1) + 1)} / {m.variants.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSwitchVariant(i, (m.variantIndex ?? m.variants.length - 1) + 1)}
                          disabled={(m.variantIndex ?? m.variants.length - 1) >= m.variants.length - 1}
                          className="p-0.5 rounded hover:bg-lyra-accent/20 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title={language === 'id' ? 'Versi berikutnya' : 'Next version'}
                        >
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    )}

                    {/* Salin */}
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(i, m.content)}
                      className="p-1.5 rounded-lg text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10 transition-colors cursor-pointer"
                      title={copiedMessageIndex === i ? (language === 'id' ? 'Tersalin!' : 'Copied!') : (language === 'id' ? 'Salin' : 'Copy')}
                    >
                      {copiedMessageIndex === i ? (
                        <Check size={14} className="text-emerald-400 stroke-[2.5]" />
                      ) : (
                        <Clipboard size={14} />
                      )}
                    </button>

                    {/* Tidak Suka */}
                    <button
                      type="button"
                      onClick={() => handleToggleDislike(i)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        dislikedMessageIndices.includes(i) ? 'text-rose-400 bg-rose-500/10' : 'text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10'
                      }`}
                      title={language === 'id' ? 'Tidak suka' : 'Dislike'}
                    >
                      <ThumbsDown size={14} />
                    </button>

                    {/* Bagikan */}
                    <button
                      type="button"
                      onClick={() => handleShareMessage(m.content)}
                      className="p-1.5 rounded-lg text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10 transition-colors cursor-pointer"
                      title={language === 'id' ? 'Bagikan' : 'Share'}
                    >
                      <Share2 size={14} />
                    </button>

                    {/* Baca Keras */}
                    <button
                      type="button"
                      onClick={() => handleSpeakMessage(i, m.content)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        speakingMessageIndex === i ? 'text-lyra-accent bg-lyra-accent/10 animate-pulse' : 'text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10'
                      }`}
                      title={speakingMessageIndex === i ? (language === 'id' ? 'Hentikan suara' : 'Stop voice') : (language === 'id' ? 'Baca keras' : 'Read aloud')}
                    >
                      <Volume2 size={14} />
                    </button>

                    {/* Kirim Ulang */}
                    <button
                      type="button"
                      onClick={() => handleRegenerateFrom(i)}
                      disabled={isLoading}
                      className="p-1.5 rounded-lg text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10 transition-colors cursor-pointer disabled:opacity-40"
                      title={language === 'id' ? 'Kirim ulang jawaban' : 'Regenerate response'}
                    >
                      <RotateCw size={14} />
                    </button>

                    {/* More options button (...) */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenMoreMenuIndex(openMoreMenuIndex === i ? null : i)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          openMoreMenuIndex === i ? 'bg-lyra-accent/20 text-lyra-accent' : 'text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10'
                        }`}
                        title={language === 'id' ? 'Opsi lainnya' : 'More options'}
                      >
                        <MoreHorizontal size={14} />
                      </button>

                      {/* Context Popover Card matching Gambar 2! */}
                      <AnimatePresence>
                        {openMoreMenuIndex === i && (
                          <>
                            {/* Backdrop */}
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setOpenMoreMenuIndex(null)} 
                            />
                            
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -4 }}
                              transition={{ duration: 0.12 }}
                              className="absolute left-0 top-[calc(100%+6px)] z-50 w-56 bg-lyra-surface border border-lyra-accent/20 rounded-2xl shadow-2xl p-2 backdrop-blur-md"
                            >
                              {/* Timestamp Header in Popover */}
                              <div className="text-[11px] text-lyra-text-secondary/70 px-3 py-1.5 font-medium border-b border-lyra-accent/10 mb-1">
                                {formatDetailTime(m.timestamp)}
                              </div>

                              {/* Branch Action Item */}
                              <button
                                type="button"
                                onClick={() => handleBranchSession(i)}
                                disabled={isBranching}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-lyra-text hover:bg-lyra-accent/15 hover:text-lyra-accent transition-colors text-left cursor-pointer"
                              >
                                <GitBranch size={15} className="text-lyra-accent shrink-0" />
                                <span>{language === 'id' ? 'Cabangkan ke obrolan baru' : 'Branch to new chat'}</span>
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>
            )
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-lyra-bg border-t border-white/5 relative">
          {/* Floating Scroll to Bottom button */}
          <AnimatePresence>
            {showScrollBottom && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                type="button"
                onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="absolute right-8 -top-12 z-30 p-2.5 rounded-full bg-lyra-surface border border-lyra-accent/30 text-lyra-accent shadow-2xl hover:bg-lyra-accent/10 active:scale-90 transition-all cursor-pointer backdrop-blur-md flex items-center justify-center"
                title={language === 'id' ? 'Scroll ke paling bawah' : 'Scroll to bottom'}
              >
                <ArrowDown size={18} />
              </motion.button>
            )}
          </AnimatePresence>

          <div className="max-w-4xl mx-auto relative flex flex-col gap-2">

            {/* Backdrop for open popovers */}
            {(isAttachMenuOpen || isModelMenuOpen || isEffortMenuOpen) && (
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => {
                  setIsAttachMenuOpen(false);
                  setIsModelMenuOpen(false);
                  setIsEffortMenuOpen(false);
                }}
              />
            )}

            <input type="file" id="fileUpload" multiple className="hidden" onChange={(e) => { handleFileUpload(e); setIsAttachMenuOpen(false); }} />

            {/* Composer Card */}
            <div 
              className={`relative z-40 bg-lyra-surface border border-lyra-accent/20 rounded-2xl shadow-xl overflow-visible focus-within:border-lyra-accent transition-colors ${isDraggingOver ? 'ring-2 ring-lyra-accent ring-inset bg-lyra-accent/10' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={handleDropOnComposer}
            >
              {isDraggingOver && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-lyra-surface/90 backdrop-blur-sm rounded-2xl pointer-events-none border-2 border-dashed border-lyra-accent">
                  <div className="text-lyra-accent font-bold flex items-center gap-2 text-base">
                    <Plus size={20} /> 
                    {language === 'id' ? 'Lepaskan file di sini' : 'Drop files here'}
                  </div>
                </div>
              )}

              {/* Active Mode / Attachment Chips */}
              {(attachments.length > 0 || isWebSearchEnabled || isDeepResearchEnabled) && (
                <div className="flex flex-wrap gap-1.5 px-3 pt-2.5 pb-1 items-center border-b border-lyra-accent/5">
                  {isWebSearchEnabled && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-xs">
                      <Globe size={12} />
                      {language === 'id' ? 'Pencarian Web' : 'Web Search'}
                      <button type="button" onClick={() => setIsWebSearchEnabled(false)} className="hover:text-white ml-0.5 cursor-pointer">
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {isDeepResearchEnabled && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs">
                      <Search size={12} />
                      {language === 'id' ? 'Riset Mendalam' : 'Deep Research'}
                      <button type="button" onClick={() => setIsDeepResearchEnabled(false)} className="hover:text-white ml-0.5 cursor-pointer">
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-lyra-accent/10 border border-lyra-accent/20 px-2.5 py-1 rounded-full text-xs">
                      {att.isWorkspaceRef ? (att.isDirectory ? <Folder size={12} className="text-lyra-accent" /> : <File size={12} className="text-lyra-accent" />) : att.isUrl ? <Link size={12} className="text-purple-400" /> : att.type?.startsWith('image/') ? <ImageIcon size={12} className="text-emerald-500"/> : <File size={12} className="text-blue-500"/>}
                      <span className="truncate max-w-[140px] text-[11px]">{att.name || att.path}</span>
                      <button type="button" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="hover:text-red-400 cursor-pointer">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Textarea */}
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isLoading) handleSendMessage();
                  }
                }}
                placeholder={language === 'id' ? 'Ketik pesan Anda di sini...' : 'Type your message here...'}
                className="w-full bg-transparent px-4 py-3 text-lyra-text placeholder:text-lyra-text-secondary focus:outline-none resize-none min-h-[56px] max-h-48 overflow-y-auto text-sm"
                rows={1}
              />

              {/* Bottom Toolbar Row (Matching Image 3 & Image 4) */}
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
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isAttachMenuOpen ? 'bg-lyra-accent text-white' : 'text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10'}`}
                      title="Lampirkan & Opsi Mode AI"
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
                          <div className="text-[10px] font-bold text-lyra-text-secondary opacity-60 px-4 py-1.5 uppercase tracking-wider">File & Media</div>
                          
                          <button type="button" onClick={() => { document.getElementById('fileUpload')?.click(); setIsAttachMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full cursor-pointer">
                            <FileText size={16} className="text-lyra-text" />
                            <div>
                              <div className="font-medium text-lyra-text">Unggah file atau gambar</div>
                            </div>
                          </button>
                          
                          <button type="button" onClick={() => { setActiveModal('folderPicker'); setIsAttachMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full cursor-pointer">
                            <Folder size={16} className="text-lyra-text" />
                            <div>
                              <div className="font-medium text-lyra-text">Unggah folder lokal...</div>
                            </div>
                          </button>

                          <button type="button" onClick={() => { setIsAttachMenuOpen(false); captureScreenshot(); }} className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full cursor-pointer">
                            <Monitor size={16} className="text-lyra-text" />
                            <div>
                              <div className="font-medium text-lyra-text">Ambil tangkapan layar</div>
                            </div>
                          </button>

                          <button type="button" onClick={handleClipboardPaste} className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full cursor-pointer">
                            <Clipboard size={16} className="text-lyra-text" />
                            <div>
                              <div className="font-medium text-lyra-text">Tempel dari clipboard</div>
                            </div>
                          </button>
                          
                          <button type="button" onClick={() => { setActiveModal('sketch'); setIsAttachMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full cursor-pointer">
                            <PenTool size={16} className="text-lyra-text" />
                            <div>
                              <div className="font-medium text-lyra-text">Sketsa manual</div>
                            </div>
                          </button>

                          <div className="h-px bg-lyra-accent/10 my-1 mx-2"></div>
                          <div className="text-[10px] font-bold text-lyra-text-secondary opacity-60 px-4 py-1.5 uppercase tracking-wider">Konteks & Proyek</div>

                          <button type="button" onClick={() => { setActiveModal('projectPicker'); setIsAttachMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full group cursor-pointer">
                            <Database size={16} className="text-lyra-text" />
                            <div className="flex-1">
                              <div className="font-medium text-lyra-text">Ganti / Tautkan Proyek</div>
                            </div>
                            <ChevronRight size={14} className="opacity-50 group-hover:translate-x-1 transition-transform" />
                          </button>

                          <button type="button" onClick={() => { setActiveModal('urlConnector'); setIsAttachMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full cursor-pointer">
                            <Link size={16} className="text-lyra-text" />
                            <div className="flex-1">
                              <div className="font-medium text-lyra-text">Tautkan URL / Konektor</div>
                            </div>
                          </button>

                          <button type="button" onClick={() => { setActiveModal('snippets'); setIsAttachMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full cursor-pointer">
                            <MessageSquare size={16} className="text-lyra-text" />
                            <div className="flex-1">
                              <div className="font-medium text-lyra-text">Prompt Snippets & Skills</div>
                            </div>
                          </button>

                          {/* Mode AI (Requirement 2 & Toggle Fix) */}
                          <div className="h-px bg-lyra-accent/10 my-1 mx-2"></div>
                          <div className="text-[10px] font-bold text-lyra-text-secondary opacity-60 px-4 py-1.5 uppercase tracking-wider">Mode AI</div>

                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsReasoningEnabled(prev => !prev);
                            }} 
                            className="flex items-center justify-between px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-3">
                              <BrainCircuit size={16} className={isReasoningEnabled ? "text-purple-400" : "text-lyra-text-secondary"} />
                              <div>
                                <div className="font-medium text-lyra-text">Pikirkan (Reasoning)</div>
                                <div className="text-[10px] text-lyra-text-secondary">{isReasoningEnabled ? `Aktif: ${thinkingEffort}` : 'Nonaktif'}</div>
                              </div>
                            </div>
                            <div className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                              isReasoningEnabled ? 'bg-purple-500' : 'bg-zinc-600'
                            }`}>
                              <motion.span 
                                animate={{ x: isReasoningEnabled ? 12 : 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                                className="inline-block h-3 w-3 rounded-full bg-white shadow-md pointer-events-none" 
                              />
                            </div>
                          </div>

                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsWebSearchEnabled(prev => !prev);
                            }} 
                            className="flex items-center justify-between px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-3">
                              <Globe size={16} className={isWebSearchEnabled ? "text-blue-400" : "text-lyra-text-secondary"} />
                              <div>
                                <div className="font-medium text-lyra-text">Pencarian Web</div>
                                <div className="text-[10px] text-lyra-text-secondary">{isWebSearchEnabled ? 'Aktif' : 'Nonaktif'}</div>
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

                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsDeepResearchEnabled(prev => !prev);
                            }} 
                            className="flex items-center justify-between px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-3">
                              <Search size={16} className={isDeepResearchEnabled ? "text-emerald-500" : "text-lyra-text-secondary"} />
                              <div>
                                <div className="font-medium text-lyra-text">Riset Mendalam</div>
                                <div className="text-[10px] text-lyra-text-secondary">{isDeepResearchEnabled ? 'Aktif' : 'Nonaktif'}</div>
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

                          <div className="h-px bg-lyra-accent/10 my-1 mx-2"></div>
                          <div className="text-[10px] font-bold text-lyra-text-secondary opacity-60 px-4 py-1.5 uppercase tracking-wider">Integrasi</div>
                          
                          <button type="button" onClick={() => { setActiveModal('github'); setIsAttachMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full cursor-pointer">
                            <GitBranch size={16} className={`text-lyra-text ${githubToken ? 'text-green-400' : ''}`} />
                            <div className="flex-1">
                              <div className="font-medium text-lyra-text">{githubToken ? 'GitHub Terhubung' : 'Hubungkan GitHub'}</div>
                            </div>
                          </button>
                          
                          <button type="button" onClick={() => { setActiveModal('notion'); setIsAttachMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 hover:bg-lyra-accent/10 text-sm text-left transition-colors w-full cursor-pointer">
                            <Library size={16} className={`text-lyra-text ${notionToken ? 'text-green-400' : ''}`} />
                            <div className="flex-1">
                              <div className="font-medium text-lyra-text">{notionToken ? 'Notion Terhubung' : 'Hubungkan Notion'}</div>
                            </div>
                          </button>

                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Model Selector Button (Matching Image 3 & Image 4) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModelMenuOpen(!isModelMenuOpen);
                        setIsEffortMenuOpen(false);
                        setIsAttachMenuOpen(false);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border cursor-pointer ${
                        isModelMenuOpen 
                          ? 'bg-lyra-accent/20 border-lyra-accent text-lyra-text' 
                          : 'bg-lyra-accent/5 border-lyra-accent/15 text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10'
                      }`}
                    >
                      <span className="truncate max-w-[130px]">{selectedModel}</span>
                      <ChevronDown size={13} className={`opacity-60 transition-transform ${isModelMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Model Popover (Matching Image 3) */}
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
                          {/* Search Input */}
                          <div className="relative mb-2">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lyra-text-secondary opacity-60" />
                            <input
                              type="text"
                              value={modelSearchQuery}
                              onChange={(e) => setModelSearchQuery(e.target.value)}
                              placeholder="Search models"
                              className="w-full bg-lyra-bg border border-lyra-accent/20 rounded-xl py-1.5 pl-8 pr-3 text-xs text-lyra-text placeholder:text-lyra-text-secondary focus:outline-none focus:border-lyra-accent"
                              autoFocus
                            />
                          </div>

                          <div className="h-px bg-lyra-accent/10 mx-1 mb-1.5" />

                          {/* Model Items */}
                          <div className="overflow-y-auto space-y-0.5 max-h-52 pr-1 custom-scrollbar">
                            {modelsList
                              .filter(m => m.name.toLowerCase().includes(modelSearchQuery.toLowerCase()))
                              .map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedModel(m.name);
                                    setIsModelMenuOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors text-left cursor-pointer ${
                                    selectedModel === m.name
                                      ? 'bg-lyra-accent/20 text-lyra-text font-semibold'
                                      : 'text-lyra-text hover:bg-lyra-accent/10'
                                  }`}
                                >
                                  <span className="truncate pr-2">{m.name}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/5 font-mono">
                                    {isReasoningEnabled ? getEffortBadge(thinkingEffort) : 'Off'}
                                  </span>
                                </button>
                              ))}
                          </div>

                          <div className="h-px bg-lyra-accent/10 my-1.5 mx-1" />

                          {/* Actions */}
                          <div className="space-y-0.5">
                            <button
                              type="button"
                              onClick={handleRefreshModels}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10 transition-colors text-left cursor-pointer"
                            >
                              <RefreshCw size={13} className={isRefreshingModels ? 'animate-spin' : ''} />
                              <span>Refresh models</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsModelMenuOpen(false);
                                router.push('/settings');
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10 transition-colors text-left cursor-pointer"
                            >
                              <Settings size={13} />
                              <span>Edit models...</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Effort Selector Button (Matching Image 4) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEffortMenuOpen(!isEffortMenuOpen);
                        setIsModelMenuOpen(false);
                        setIsAttachMenuOpen(false);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border cursor-pointer ${
                        isEffortMenuOpen
                          ? 'bg-lyra-accent/20 border-lyra-accent text-lyra-text'
                          : 'bg-lyra-accent/5 border-lyra-accent/15 text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10'
                      }`}
                    >
                      <span>{isReasoningEnabled ? getEffortBadge(thinkingEffort) : 'Off'}</span>
                      <ChevronDown size={13} className={`opacity-60 transition-transform ${isEffortMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Effort Popover (Matching Image 4) */}
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
                          {/* OPTIONS Header */}
                          <div className="text-[10px] font-bold text-lyra-text-secondary opacity-60 px-2.5 py-1 uppercase tracking-wider">
                            OPTIONS
                          </div>

                          {/* Thinking Toggle Row (Toggle Switch Fix) */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsReasoningEnabled(prev => !prev);
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-lyra-accent/10 transition-colors cursor-pointer select-none"
                          >
                            <span className="text-sm font-medium text-lyra-text">Thinking</span>
                            <div 
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                                isReasoningEnabled ? 'bg-[#D97757]' : 'bg-zinc-600'
                              }`}
                            >
                              <motion.span
                                animate={{ x: isReasoningEnabled ? 16 : 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                                className="inline-block h-4 w-4 rounded-full bg-white shadow-md pointer-events-none"
                              />
                            </div>
                          </div>

                          <div className="h-px bg-lyra-accent/10 my-2 mx-1" />

                          {/* EFFORT Header */}
                          <div className="text-[10px] font-bold text-lyra-text-secondary opacity-60 px-2.5 py-1 uppercase tracking-wider">
                            EFFORT
                          </div>

                          {/* Effort Levels */}
                          <div className="space-y-0.5">
                            {(['Minimal', 'Low', 'Medium', 'High', 'Extra High', 'Max', 'Ultra'] as const).map((lvl) => (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => {
                                  setThinkingEffort(lvl);
                                  setIsReasoningEnabled(true);
                                  setIsEffortMenuOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors text-left cursor-pointer ${
                                  thinkingEffort === lvl && isReasoningEnabled
                                    ? 'bg-lyra-accent/15 text-lyra-text font-medium'
                                    : 'text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10'
                                }`}
                              >
                                <span>{lvl}</span>
                                {thinkingEffort === lvl && isReasoningEnabled && (
                                  <Check size={15} className="text-lyra-accent stroke-[2.5]" />
                                )}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>

                {/* Right Send / Stop Button */}
                <div className="flex items-center shrink-0 ml-2">
                  {isLoading ? (
                    <button
                      type="button"
                      onClick={handleStopGeneration}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-white text-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-200 active:scale-95 transition-all shadow-md cursor-pointer shrink-0"
                      title={language === 'id' ? 'Hentikan pembuatan' : 'Stop generation'}
                    >
                      <Square size={12} className="fill-current text-zinc-900" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim()}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-lyra-accent hover:bg-lyra-accent/80 text-white disabled:opacity-25 disabled:cursor-not-allowed active:scale-95 transition-all shadow-sm cursor-pointer shrink-0"
                      title={language === 'id' ? 'Kirim pesan' : 'Send message'}
                    >
                      <ArrowUp size={16} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Minimal Toggle Workspace (Ketika Ditutup) */}
      {!isRightPanelOpen && (
        <button
          type="button"
          onClick={() => setIsRightPanelOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-30 w-5 h-11 hover:w-6 bg-lyra-surface/90 hover:bg-lyra-surface border-y border-l border-lyra-accent/30 hover:border-lyra-accent rounded-l-lg shadow-md backdrop-blur-md flex items-center justify-center text-lyra-text-secondary hover:text-lyra-accent transition-all duration-200 cursor-pointer group active:scale-95"
          title={language === 'id' ? 'Buka Workspace' : 'Open Workspace'}
        >
          <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform text-lyra-accent" />
        </button>
      )}

      {/* Workspace Right Panel */}
      {isRightPanelOpen && (
        <div 
          className="w-80 sm:w-96 bg-lyra-surface border-l border-lyra-accent/10 flex flex-col transition-all duration-300 relative z-20 shadow-2xl"
          onDragOver={(e) => { e.preventDefault(); setIsWorkspaceDragging(true); }}
          onDragLeave={(e) => {
            // Only deactivate if leaving the container
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsWorkspaceDragging(false);
            }
          }}
          onDrop={handleWorkspaceDrop}
        >
          {/* Toggle Collapse Workspace (Ketika Terbuka) */}
          <button
            type="button"
            onClick={() => setIsRightPanelOpen(false)}
            className="absolute -left-5 top-1/2 -translate-y-1/2 z-30 w-5 h-11 bg-lyra-surface border-y border-l border-lyra-accent/30 hover:border-lyra-accent rounded-l-lg shadow-md flex items-center justify-center text-lyra-text-secondary hover:text-lyra-accent transition-all cursor-pointer group active:scale-95"
            title={language === 'id' ? 'Tutup Workspace' : 'Close Workspace'}
          >
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform text-lyra-accent" />
          </button>
          {/* Drag Overlay */}
          {isWorkspaceDragging && (
            <div className="absolute inset-0 z-50 bg-lyra-surface/95 border-2 border-dashed border-lyra-accent flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm pointer-events-none">
              <Upload size={36} className="text-lyra-accent animate-bounce mb-2" />
              <p className="text-sm font-bold text-lyra-text">
                {language === 'id' ? 'Lepaskan file di sini' : 'Drop files here'}
              </p>
              <p className="text-xs text-lyra-text-secondary mt-1">
                {language === 'id' ? 'File akan langsung diunggah ke folder ini' : 'Files will be uploaded directly to this folder'}
              </p>
            </div>
          )}

          {/* Hidden File Input for Workspace Upload */}
          <input 
            ref={workspaceFileInputRef} 
            type="file" 
            multiple 
            className="hidden" 
            onChange={(e) => { 
              if (e.target.files && e.target.files.length > 0) {
                handleWorkspaceUpload(e.target.files);
              }
            }} 
          />

          {/* Panel Top Header & Toolbar */}
          <div className="p-3.5 border-b border-lyra-accent/10 flex items-center justify-between bg-lyra-bg/70 backdrop-blur-md">
            <div className="flex items-center gap-2 min-w-0">
              <FolderTree size={17} className="text-lyra-accent shrink-0" />
              <span className="font-semibold text-sm text-lyra-text truncate">Workspace</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Tombol Kembali / Naik Folder */}
              <button 
                type="button"
                onClick={handleWorkspaceBack} 
                disabled={!currentWorkspace || currentWorkspace === 'ROOT'}
                className="p-1.5 rounded-lg text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title={language === 'id' ? 'Naik satu tingkat folder (Kembali)' : 'Go up one folder'}
              >
                <CornerLeftUp size={15} />
              </button>

              {/* Tombol Upload */}
              <button 
                type="button"
                onClick={() => workspaceFileInputRef.current?.click()} 
                disabled={!currentWorkspace || currentWorkspace === 'ROOT' || isWorkspaceUploading}
                className="p-1.5 rounded-lg text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title={language === 'id' ? 'Unggah file ke folder ini' : 'Upload files here'}
              >
                <Upload size={15} className={isWorkspaceUploading ? 'animate-spin' : ''} />
              </button>

              {/* Tombol Refresh */}
              <button 
                type="button"
                onClick={handleWorkspaceRefresh} 
                className="p-1.5 rounded-lg text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10 transition-colors cursor-pointer"
                title={language === 'id' ? 'Muat ulang daftar file' : 'Refresh file list'}
              >
                <RotateCw size={15} />
              </button>

              {/* Tombol Buat File Baru */}
              <button 
                type="button"
                onClick={() => {
                  setCreatingType(creatingType === 'file' ? null : 'file');
                  setCreatingName('');
                }} 
                disabled={!currentWorkspace || currentWorkspace === 'ROOT'}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${creatingType === 'file' ? 'bg-lyra-accent/20 text-lyra-accent' : 'text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10'} disabled:opacity-30`}
                title={language === 'id' ? 'Buat file baru' : 'Create new file'}
              >
                <FilePlus size={15} />
              </button>

              {/* Tombol Buat Folder Baru */}
              <button 
                type="button"
                onClick={() => {
                  setCreatingType(creatingType === 'folder' ? null : 'folder');
                  setCreatingName('');
                }} 
                disabled={!currentWorkspace || currentWorkspace === 'ROOT'}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${creatingType === 'folder' ? 'bg-lyra-accent/20 text-lyra-accent' : 'text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10'} disabled:opacity-30`}
                title={language === 'id' ? 'Buat folder baru' : 'Create new folder'}
              >
                <FolderPlus size={15} />
              </button>

              {/* Tombol Buka di Windows Explorer */}
              <button 
                type="button"
                onClick={() => currentWorkspace && handleRevealInExplorer(currentWorkspace)} 
                disabled={!currentWorkspace || currentWorkspace === 'ROOT'}
                className="p-1.5 rounded-lg text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10 transition-colors disabled:opacity-30 cursor-pointer"
                title={language === 'id' ? 'Buka di Windows Explorer' : 'Reveal in Explorer'}
              >
                <ExternalLink size={15} />
              </button>

              {/* Tombol Tutup Panel */}
              <button 
                type="button"
                onClick={() => setIsRightPanelOpen(false)} 
                className="p-1.5 rounded-lg text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10 transition-colors cursor-pointer ml-1"
                title="Tutup panel"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Interactive Breadcrumb Bar */}
          <div className="px-3 py-2 border-b border-lyra-accent/10 bg-lyra-surface/40 flex items-center gap-1 overflow-x-auto text-[11px] font-mono no-scrollbar">
            {getBreadcrumbSegments(currentWorkspace).map((seg, idx, arr) => (
              <React.Fragment key={seg.path}>
                <button
                  type="button"
                  onClick={() => loadWorkspaceFiles(seg.path)}
                  className={`hover:text-lyra-accent hover:underline truncate max-w-[120px] transition-colors cursor-pointer ${
                    idx === arr.length - 1 ? 'font-semibold text-lyra-accent' : 'text-lyra-text-secondary'
                  }`}
                  title={seg.path}
                >
                  {seg.name}
                </button>
                {idx < arr.length - 1 && <span className="text-lyra-text-secondary/40 select-none">/</span>}
              </React.Fragment>
            ))}
          </div>

          {/* Quick Filter Search & Path Input */}
          <div className="p-2.5 border-b border-lyra-accent/10 flex flex-col gap-2">
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-2.5 text-lyra-text-secondary/60 pointer-events-none" />
              <input
                value={workspaceSearchQuery}
                onChange={e => setWorkspaceSearchQuery(e.target.value)}
                placeholder={language === 'id' ? 'Cari file/folder di sini...' : 'Filter files...'}
                className="w-full bg-lyra-bg border border-lyra-accent/15 text-xs pl-8 pr-2.5 py-1.5 rounded-xl focus:outline-none focus:border-lyra-accent text-lyra-text placeholder:text-lyra-text-secondary/50"
              />
              {workspaceSearchQuery && (
                <button
                  type="button"
                  onClick={() => setWorkspaceSearchQuery('')}
                  className="absolute right-2 text-lyra-text-secondary/60 hover:text-lyra-text"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Direct Path Input Form */}
            <form onSubmit={(e) => { e.preventDefault(); loadWorkspaceFiles(workspaceInput); }} className="flex gap-1.5">
              <input 
                value={workspaceInput} 
                onChange={e => setWorkspaceInput(e.target.value)} 
                placeholder="D:/project/..." 
                className="flex-1 bg-lyra-bg border border-lyra-accent/15 text-[11px] font-mono px-2.5 py-1 rounded-xl focus:outline-none focus:border-lyra-accent text-lyra-text"
              />
              <button type="submit" className="bg-lyra-accent/15 text-lyra-accent hover:bg-lyra-accent/25 px-2.5 py-1 rounded-xl text-xs font-medium cursor-pointer transition-colors">
                Buka
              </button>
            </form>
          </div>

          {/* Inline Form: Create File / Create Folder */}
          <AnimatePresence>
            {creatingType && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreateFileOrFolder}
                className="p-2.5 border-b border-lyra-accent/10 bg-lyra-accent/5 flex flex-col gap-2 overflow-hidden"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-lyra-accent">
                  <span>{creatingType === 'folder' ? '+ Folder Baru' : '+ File Baru'}</span>
                  <button type="button" onClick={() => setCreatingType(null)} className="text-lyra-text-secondary hover:text-lyra-text">
                    <X size={13} />
                  </button>
                </div>
                <input
                  autoFocus
                  value={creatingName}
                  onChange={e => setCreatingName(e.target.value)}
                  placeholder={creatingType === 'folder' ? 'Nama folder...' : 'Nama file (misal: script.py)...'}
                  className="w-full bg-lyra-bg border border-lyra-accent/30 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-lyra-accent text-lyra-text"
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCreatingType(null)}
                    className="px-2.5 py-1 rounded-md text-xs text-lyra-text-secondary hover:text-lyra-text cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={!creatingName.trim()}
                    className="px-3 py-1 rounded-md text-xs font-medium bg-lyra-accent text-white hover:bg-lyra-accent/90 disabled:opacity-40 cursor-pointer shadow-sm"
                  >
                    Buat
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Delete Confirmation Modal / Banner */}
          <AnimatePresence>
            {deleteConfirmFile && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 border-b border-rose-500/20 bg-rose-500/10 flex flex-col gap-2"
              >
                <div className="text-xs text-rose-300 font-medium truncate">
                  Hapus permanent: <span className="font-bold">{deleteConfirmFile.name}</span>?
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmFile(null)}
                    className="px-2 py-1 text-xs text-lyra-text-secondary hover:text-lyra-text cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteWorkspaceItem(deleteConfirmFile.path)}
                    className="px-2.5 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-md cursor-pointer shadow-sm"
                  >
                    Hapus
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Files List Area */}
          <div className="flex-1 overflow-y-auto p-2 text-sm space-y-0.5">
            {workspaceFiles.length === 0 ? (
              <div className="text-center text-xs text-lyra-text-secondary/60 py-10 px-4">
                <Folder size={28} className="mx-auto mb-2 opacity-30" />
                <p>{language === 'id' ? 'Direktori kosong atau belum dimuat.' : 'Directory is empty or not loaded.'}</p>
                <p className="text-[11px] mt-1 opacity-70">
                  {language === 'id' ? 'Gunakan drag & drop untuk mengunggah file.' : 'Use drag & drop to upload files.'}
                </p>
              </div>
            ) : (
              workspaceFiles
                .filter(f => !workspaceSearchQuery || f.name.toLowerCase().includes(workspaceSearchQuery.toLowerCase()))
                .map((f, i) => (
                  <div 
                    key={f.path || i}
                    draggable
                    onDragStart={(e) => handleDragStartWorkspaceItem(e, f)}
                    className="flex items-center gap-2 p-1.5 hover:bg-lyra-accent/10 rounded-xl cursor-pointer text-lyra-text-secondary hover:text-lyra-text transition-colors group relative"
                    onClick={() => {
                      if (f.isDirectory) {
                        loadWorkspaceFiles(f.path);
                      } else {
                        openFileInWorkspace(f.path);
                        router.push('/workspace');
                      }
                    }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity -ml-0.5 text-lyra-text-secondary/40 cursor-grab active:cursor-grabbing text-xs select-none">
                      ⋮⋮
                    </div>

                    {/* Smart File Icon */}
                    {getFileIcon(f.name, f.isDirectory)}

                    <span className="truncate flex-1 text-xs select-none font-medium text-lyra-text" title={f.name}>
                      {f.name}
                    </span>

                    {/* Hover Quick Action Buttons */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
                      {/* Mention in Chat */}
                      <button
                        type="button"
                        onClick={() => handleMentionInChat(f)}
                        className="p-1 rounded-md hover:bg-lyra-accent/20 text-lyra-text-secondary hover:text-lyra-accent transition-colors cursor-pointer"
                        title={language === 'id' ? 'Sebutkan di percakapan chat' : 'Mention in chat'}
                      >
                        <MessageSquare size={13} />
                      </button>

                      {/* Copy Path */}
                      <button
                        type="button"
                        onClick={() => handleCopyPath(f.path)}
                        className="p-1 rounded-md hover:bg-lyra-accent/20 text-lyra-text-secondary hover:text-lyra-accent transition-colors cursor-pointer"
                        title={language === 'id' ? 'Salin path file' : 'Copy path'}
                      >
                        <Clipboard size={13} />
                      </button>

                      {/* Reveal in Explorer */}
                      <button
                        type="button"
                        onClick={() => handleRevealInExplorer(f.path)}
                        className="p-1 rounded-md hover:bg-lyra-accent/20 text-lyra-text-secondary hover:text-lyra-accent transition-colors cursor-pointer"
                        title={language === 'id' ? 'Buka di Explorer' : 'Reveal in Explorer'}
                      >
                        <ExternalLink size={13} />
                      </button>

                      {/* Delete Item */}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmFile(f)}
                        className="p-1 rounded-md hover:bg-rose-500/20 text-lyra-text-secondary hover:text-rose-400 transition-colors cursor-pointer"
                        title={language === 'id' ? 'Hapus item ini' : 'Delete'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
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

export default function NativeChatPage() {
  return (
    <React.Suspense fallback={<div className="h-full flex items-center justify-center bg-lyra-bg text-lyra-text font-mono text-xs">Memuat Chat...</div>}>
      <NativeChatContent />
    </React.Suspense>
  );
}