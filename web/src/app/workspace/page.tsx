'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Folder, File, ChevronLeft, Save, RefreshCw, FolderTree, Code, X, Bot, Sparkles, Terminal } from 'lucide-react';
import { NeoPanel } from '@/components/NeoPanel';
import { NeoButton } from '@/components/NeoButton';
import { useWorkspaceStore } from '@/store/workspace';
import Prism from 'prismjs';

// Import essential Prism language modules
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-markdown';

interface FileNode {
  name: string;
  isDirectory: boolean;
  path: string;
}

interface OpenFile {
  path: string;
  name: string;
  content: string;
  isDirty: boolean;
}

function SyntaxCodeEditor({
  value,
  onChange,
  filename
}: {
  value: string;
  onChange: (val: string) => void;
  filename: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const getLanguage = (file: string) => {
    const ext = file.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'js':
      case 'jsx':
      case 'mjs':
      case 'cjs':
        return 'javascript';
      case 'py':
        return 'python';
      case 'json':
        return 'json';
      case 'css':
      case 'scss':
        return 'css';
      case 'sh':
      case 'bash':
      case 'ps1':
        return 'bash';
      case 'md':
      case 'mdx':
        return 'markdown';
      case 'html':
      case 'xml':
      case 'svg':
        return 'markup';
      default:
        return 'plaintext';
    }
  };

  const lang = getLanguage(filename);

  const highlighted = useMemo(() => {
    try {
      const safeValue = value || '';
      // If exact grammar not found, fallback to javascript or plaintext
      const grammar = Prism.languages[lang] || Prism.languages.javascript || {};
      const highlightLang = Prism.languages[lang] ? lang : 'javascript';

      return Prism.highlight(safeValue, grammar, highlightLang);
    } catch (e) {
      console.warn('Prism highlighting failed:', e);
      return (value || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  }, [value, lang]);

  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  return (
    <div className="relative flex-1 w-full h-full font-mono text-sm overflow-hidden bg-lyra-editor-bg">
      {/* Syntax highlighted background layer */}
      <pre
        ref={preRef}
        aria-hidden="true"
        className="absolute inset-0 p-4 m-0 font-mono text-sm leading-relaxed whitespace-pre overflow-hidden pointer-events-none select-none text-lyra-editor-text z-0"
        dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
      />
      {/* Transparent editing layer with mandatory WebKit transparent fill */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        spellCheck={false}
        className="absolute inset-0 p-4 m-0 font-mono text-sm leading-relaxed whitespace-pre overflow-auto bg-transparent caret-lyra-accent resize-none outline-none focus:outline-none selection:bg-lyra-accent/30 selection:text-transparent z-10"
        style={{
          fontFamily: 'inherit',
          tabSize: 2,
          color: 'transparent',
          WebkitTextFillColor: 'transparent',
          caretColor: 'var(--accent, #3b82f6)',
        }}
      />
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <React.Suspense fallback={<div className="h-screen flex items-center justify-center bg-lyra-bg text-lyra-text font-mono text-xs">Memuat Workspace...</div>}>
      <WorkspaceView />
    </React.Suspense>
  );
}

function WorkspaceView() {
  const searchParams = useSearchParams();
  const activeAgentParam = searchParams ? searchParams.get('activeAgent') : null;
  const { currentWorkspace, setCurrentWorkspace, activeFilePath, liveTyping, setLiveTyping } = useWorkspaceStore();

  const [files, setFiles] = useState<FileNode[]>([]);
  const [currentDir, setCurrentDir] = useState<string>(currentWorkspace || '');
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(-1);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [simulatingTyping, setSimulatingTyping] = useState(false);

  const getAgentBadge = (id: string | null) => {
    if (!id) return null;
    const map: Record<string, { name: string; role: string; color: string }> = {
      default: { name: 'Aster', role: 'Coordinator', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
      coder: { name: 'Forge', role: 'Software Engineer', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      planner: { name: 'Atlas', role: 'System Architect', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
      researcher: { name: 'Scout', role: 'Researcher', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      qa: { name: 'Iris', role: 'QA & Test', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      'qa-kanban': { name: 'Patch', role: 'QA Lead', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
      verifier: { name: 'Nova', role: 'Verifier', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
      synthesizer: { name: 'Echo', role: 'Synthesizer', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
      security: { name: 'Sentinel', role: 'Security', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
      'security-kanban': { name: 'Cipher', role: 'Security Lead', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    };
    return map[id] || { name: id, role: 'Specialist', color: 'bg-lyra-accent/20 text-lyra-accent border-lyra-accent/30' };
  };

  const currentAgent = getAgentBadge(activeAgentParam);

  // Cross-tab auto-sync workspace theme
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lyra-appearance' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const newWorkspace = parsed.state?.workspaceTheme;
          if (newWorkspace) {
            document.documentElement.setAttribute('data-workspace', newWorkspace);
          }
        } catch (err) { }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchFiles = async (dir: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workspace/ls?dir=${encodeURIComponent(dir)}`);
      const data = await res.json();
      if (data.files) {
        setFiles(data.files);
        setCurrentDir(data.cwd);
        setCurrentWorkspace(data.cwd);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadFile = async (path: string, name: string) => {
    // Check if already open
    const existingIndex = openFiles.findIndex(f => f.path.toLowerCase() === path.toLowerCase());
    if (existingIndex !== -1) {
      setActiveFileIndex(existingIndex);
      return;
    }

    try {
      const res = await fetch(`/api/workspace/file?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.content !== undefined) {
        setOpenFiles(prev => {
          const idx = prev.findIndex(f => f.path.toLowerCase() === path.toLowerCase());
          if (idx !== -1) {
            setActiveFileIndex(idx);
            return prev;
          }
          const newFile = { path, name, content: data.content, isDirty: false };
          const updated = [...prev, newFile];
          setActiveFileIndex(updated.length - 1);
          return updated;
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveFile = async () => {
    if (activeFileIndex === -1) return;
    const activeFile = openFiles[activeFileIndex];

    setIsSaving(true);
    try {
      await fetch(`/api/workspace/file?path=${encodeURIComponent(activeFile.path)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: activeFile.content })
      });

      const newOpenFiles = [...openFiles];
      newOpenFiles[activeFileIndex].isDirty = false;
      setOpenFiles(newOpenFiles);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const closeTab = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const newOpenFiles = openFiles.filter((_, i) => i !== index);
    setOpenFiles(newOpenFiles);
    if (activeFileIndex === index) {
      setActiveFileIndex(newOpenFiles.length > 0 ? newOpenFiles.length - 1 : -1);
    } else if (activeFileIndex > index) {
      setActiveFileIndex(activeFileIndex - 1);
    }
  };

  const updateContent = (content: string) => {
    if (activeFileIndex === -1) return;
    const newOpenFiles = [...openFiles];
    newOpenFiles[activeFileIndex].content = content;
    newOpenFiles[activeFileIndex].isDirty = true;
    setOpenFiles(newOpenFiles);
  };

  useEffect(() => {
    fetchFiles(currentWorkspace || '');
  }, [currentWorkspace]);

  const loadedFilesRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeFilePath) {
      if (loadedFilesRef.current === activeFilePath) return;
      loadedFilesRef.current = activeFilePath;
      const name = activeFilePath.split(/[\/\\]/).pop() || 'file';
      loadFile(activeFilePath, name);
    } else if (activeAgentParam && files.length > 0) {
      // Auto-open first project file once when arrived from agent deep link
      if (loadedFilesRef.current) return;
      const firstFile = files.find(f => !f.isDirectory);
      if (firstFile) {
        loadedFilesRef.current = firstFile.path;
        loadFile(firstFile.path, firstFile.name);
      }
    }
  }, [activeFilePath, activeAgentParam, files]);

  const handleNavigateUp = () => {
    if (!currentDir || currentDir === 'ROOT') return;
    const normalized = currentDir.replace(/\\/g, '/');
    const parts = normalized.split('/').filter(Boolean);
    if (parts.length > 1) {
      parts.pop();
      fetchFiles(parts.join('/'));
    } else {
      fetchFiles('ROOT');
    }
  };

  // Reactive agent live-coding simulation
  useEffect(() => {
    if (!liveTyping || !liveTyping.active) return;
    const targetPath = liveTyping.filePath;
    const targetName = targetPath.split(/[\/\\]/).pop() || 'file';

    // If file is already open, simulate streaming typing
    const idx = openFiles.findIndex(f => f.path.toLowerCase() === targetPath.toLowerCase());
    if (idx !== -1) {
      setActiveFileIndex(idx);
      if (liveTyping.diffOrContent) {
        setSimulatingTyping(true);
        const incomingText = liveTyping.diffOrContent;
        let charIndex = 0;
        const baseContent = openFiles[idx].content ? openFiles[idx].content + '\n' : '';
        
        const timer = setInterval(() => {
          charIndex += 4;
          if (charIndex >= incomingText.length) {
            clearInterval(timer);
            setSimulatingTyping(false);
            updateContent(baseContent + incomingText);
          } else {
            updateContent(baseContent + incomingText.slice(0, charIndex));
          }
        }, 30);

        return () => {
          clearInterval(timer);
          setSimulatingTyping(false);
        };
      }
    } else {
      // Load file into editor tabs first
      loadFile(targetPath, targetName);
    }
  }, [liveTyping]);

  const activeFile = activeFileIndex !== -1 ? openFiles[activeFileIndex] : null;

  return (
    <div className="flex flex-col lg:flex-row w-full h-[calc(100vh-8rem)] gap-4">
      {/* File Explorer Sidebar */}
      <NeoPanel className="w-full lg:w-72 h-64 lg:h-full flex flex-col p-0 overflow-hidden bg-lyra-editor-bg shrink-0 border border-lyra-editor-border shadow-sm">
        <div className="p-3 border-b border-lyra-editor-border bg-lyra-editor-header flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-lyra-editor-text">
            <FolderTree className="w-4 h-4 text-lyra-accent" />
            EXPLORER
          </div>
          <button onClick={() => fetchFiles(currentDir)} className="text-lyra-editor-muted hover:text-lyra-editor-text transition">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-2 flex items-center gap-2 text-xs text-lyra-editor-muted border-b border-lyra-editor-border bg-lyra-editor-bg">
          <button
            disabled={!currentDir || currentDir === 'ROOT'}
            onClick={handleNavigateUp}
            className="flex items-center hover:text-lyra-editor-text disabled:opacity-30 transition px-1 py-0.5 rounded hover:bg-lyra-editor-header"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <span className="truncate opacity-70 ml-1">{currentDir}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="text-xs text-lyra-editor-muted p-2">Loading contents...</div>
          ) : (
            files.map((file, idx) => (
              <div 
                key={`workspace-file-${file.path}-${idx}`}
                onClick={() => file.isDirectory ? fetchFiles(file.path) : loadFile(file.path, file.name)}
                className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-sm transition-colors
                  ${activeFile?.path === file.path ? 'bg-lyra-accent/20 text-lyra-accent font-medium' : 'text-lyra-editor-text/80 hover:bg-lyra-editor-header hover:text-lyra-editor-text'}
                `}
              >
                {file.isDirectory ? (
                  <Folder className="w-4 h-4 text-blue-400 fill-blue-400/20" />
                ) : (
                  <File className="w-4 h-4 text-lyra-editor-muted" />
                )}
                <span className="truncate select-none">{file.name}</span>
              </div>
            ))
          )}
          {!loading && files.length === 0 && (
            <div className="text-xs text-lyra-editor-muted p-2 text-center mt-4">Folder is empty</div>
          )}
        </div>
      </NeoPanel>

      {/* Code Editor Panel */}
      <NeoPanel className="flex-1 h-full flex flex-col p-0 overflow-hidden bg-lyra-editor-bg border border-lyra-editor-border shadow-sm">
        {openFiles.length > 0 && (
          <div className="flex items-end h-10 border-b border-lyra-editor-border bg-lyra-editor-header overflow-x-auto no-scrollbar shrink-0">
            {openFiles.map((f, i) => (
              <div 
                key={`workspace-tab-${f.path}-${i}`}
                onClick={() => setActiveFileIndex(i)}
                className={`h-full flex items-center gap-2 px-4 text-xs cursor-pointer border-r border-lyra-editor-border transition-colors min-w-[120px] max-w-[200px]
                  ${activeFileIndex === i ? 'bg-lyra-editor-bg text-lyra-editor-text border-t-2 border-t-lyra-accent' : 'text-lyra-editor-muted hover:bg-lyra-editor-bg/50 hover:text-lyra-editor-text'}
                `}
              >
                <Code className={`w-3.5 h-3.5 ${activeFileIndex === i ? 'text-lyra-accent' : ''}`} />
                <span className="truncate flex-1">{f.name}</span>
                {f.isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                <button onClick={(e) => closeTab(e, i)} className="p-0.5 rounded-sm opacity-50 hover:opacity-100 hover:bg-lyra-editor-header ml-2">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeFile ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Top Bar - Path indicator & Agent Presence Badge */}
            <div className="h-9 border-b border-lyra-editor-border bg-lyra-editor-header/40 flex items-center justify-between px-4 shrink-0 text-xs text-lyra-editor-muted">
              <span className="truncate">{activeFile.path}</span>
              {simulatingTyping && liveTyping ? (
                <div className="flex items-center gap-2 px-3 py-0.5 rounded-full border border-blue-500/40 bg-blue-500/20 text-blue-400 font-mono text-[11px] shadow-sm animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  <span>@{liveTyping.agentName} sedang menulis kode secara realtime...</span>
                </div>
              ) : currentAgent ? (
                <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono ${currentAgent.color} shadow-sm shrink-0`}>
                  <Bot size={13} className="text-lyra-accent" />
                  <span className="font-semibold">{currentAgent.name}</span>
                  <span className="opacity-60">({currentAgent.role})</span>
                </div>
              ) : null}
            </div>

            {/* Core Syntax Highlighted Editor */}
            <SyntaxCodeEditor
              value={activeFile.content}
              onChange={updateContent}
              filename={activeFile.name}
            />

            {/* Bottom Footer Bar with Moveable SAVE button */}
            <div className="h-11 border-t border-lyra-editor-border bg-lyra-editor-header flex items-center justify-between px-4 shrink-0 shadow-sm">
              <div className="flex items-center gap-4 text-xs text-lyra-editor-muted">
                <span className="font-mono bg-lyra-editor-bg px-2 py-0.5 rounded border border-lyra-editor-border">
                  {activeFile.name.split('.').pop()?.toUpperCase() || 'TXT'}
                </span>
                <span>{activeFile.content.split('\n').length} Baris</span>
                {activeFile.isDirty && (
                  <span className="text-amber-500 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Belum disimpan
                  </span>
                )}
              </div>

              {/* SAVE BUTTON AT THE BOTTOM */}
              <NeoButton
                onClick={saveFile}
                disabled={!activeFile.isDirty && !isSaving}
                className={`h-8 px-4 text-xs flex items-center gap-2 border-0 transition-all font-medium ${activeFile.isDirty
                  ? 'bg-lyra-accent text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] cursor-pointer'
                  : 'bg-lyra-editor-border/50 text-lyra-editor-muted cursor-not-allowed opacity-60'
                  }`}
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </NeoButton>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-lyra-editor-muted">
            <FolderTree className="w-20 h-20 mb-6 opacity-20" />
            <p className="text-lg text-lyra-editor-text">Tidak ada file yang terbuka</p>
            <p className="text-sm opacity-60 mt-2">Pilih berkas dari explorer di sisi kiri untuk membaca atau mengedit kode</p>
          </div>
        )}
      </NeoPanel>
    </div>
  );
}