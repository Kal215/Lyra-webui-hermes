'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderTree, 
  CornerLeftUp, 
  Upload, 
  RotateCw, 
  FilePlus, 
  FolderPlus, 
  ExternalLink, 
  X, 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  File, 
  Folder, 
  Trash2, 
  Copy, 
  Code, 
  Check,
  Eye
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace';

interface WorkspacePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onMentionFile?: (path: string) => void;
  targetPreviewPath?: string | null;
}

export function WorkspacePanel({ isOpen, onToggle, onMentionFile, targetPreviewPath }: WorkspacePanelProps) {
  const { currentWorkspace, setCurrentWorkspace, openFileInWorkspace } = useWorkspaceStore();
  const [workspaceFiles, setWorkspaceFiles] = useState<any[]>([]);
  const [workspaceInput, setWorkspaceInput] = useState(currentWorkspace || '');
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState('');
  const [isWorkspaceDragging, setIsWorkspaceDragging] = useState(false);
  const [isWorkspaceUploading, setIsWorkspaceUploading] = useState(false);
  const [creatingType, setCreatingType] = useState<'file' | 'folder' | null>(null);
  const [creatingName, setCreatingName] = useState('');
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<string | null>(null);
  const [activeFileMenu, setActiveFileMenu] = useState<string | null>(null);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<{ path: string; name: string; content: string } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (targetPreviewPath) {
      const fileName = targetPreviewPath.split(/[\/\\]/).pop() || 'file';
      handlePreviewFile({ path: targetPreviewPath, name: fileName, isDirectory: false });
    }
  }, [targetPreviewPath]);

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
    } catch (e) {
      console.error('Failed to load workspace files:', e);
    }
  };

  useEffect(() => {
    if (currentWorkspace) {
      loadWorkspaceFiles(currentWorkspace);
    } else {
      loadWorkspaceFiles('ROOT');
    }
  }, [currentWorkspace]);

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

  const handleDeleteItem = async (targetPath: string) => {
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
    } catch (err) {
      console.error(err);
    }
  };

  const handlePreviewFile = async (f: any) => {
    if (f.isDirectory) return;
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/workspace/file?path=${encodeURIComponent(f.path)}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewContent({ path: f.path, name: f.name, content: data.content ?? data.error ?? '' });
      } else {
        setPreviewContent({ path: f.path, name: f.name, content: '// Tidak dapat membaca berkas biner atau izin ditolak.' });
      }
    } catch (e: any) {
      setPreviewContent({ path: f.path, name: f.name, content: `Error: ${e.message}` });
    } finally {
      setLoadingPreview(false);
    }
  };

  const getBreadcrumbSegments = (p: string) => {
    if (!p || p === 'ROOT') return [{ name: 'ROOT (Drives)', path: 'ROOT' }];
    const norm = p.replace(/\\/g, '/');
    const segs = norm.split('/').filter(Boolean);
    const results: { name: string; path: string }[] = [{ name: 'ROOT', path: 'ROOT' }];
    let accum = '';
    segs.forEach((s, idx) => {
      accum += (idx === 0 && s.endsWith(':') ? s : (accum === '' ? s : `/${s}`));
      results.push({ name: s, path: accum });
    });
    return results;
  };

  return (
    <>
      {/* Floating Minimal Edge Toggle (Ketika Ditutup) */}
      {!isOpen && (
        <button
          type="button"
          onClick={onToggle}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-30 w-5 h-12 hover:w-6 bg-lyra-surface/90 hover:bg-lyra-surface border-y border-l border-lyra-accent/30 hover:border-lyra-accent rounded-l-lg shadow-md backdrop-blur-md flex items-center justify-center text-lyra-text-secondary hover:text-lyra-accent transition-all duration-200 cursor-pointer group active:scale-95"
          title="Buka Workspace"
        >
          <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform text-lyra-accent" />
        </button>
      )}

      {/* Main Drawer */}
      {isOpen && (
        <div 
          className="w-80 sm:w-96 bg-lyra-surface border-l border-lyra-accent/15 flex flex-col h-full min-h-0 overflow-hidden transition-all duration-300 relative z-20 shadow-2xl select-none shrink-0"
          onDragOver={(e) => { e.preventDefault(); setIsWorkspaceDragging(true); }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsWorkspaceDragging(false);
            }
          }}
          onDrop={handleWorkspaceDrop}
        >
          {/* Toggle Button Inside Drawer Border */}
          <button
            type="button"
            onClick={onToggle}
            className="absolute -left-5 top-1/2 -translate-y-1/2 z-30 w-5 h-12 bg-lyra-surface border-y border-l border-lyra-accent/30 hover:border-lyra-accent rounded-l-lg shadow-md flex items-center justify-center text-lyra-text-secondary hover:text-lyra-accent transition-all cursor-pointer group active:scale-95"
            title="Tutup Workspace"
          >
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform text-lyra-accent" />
          </button>

          {/* Drag Overlay */}
          {isWorkspaceDragging && (
            <div className="absolute inset-0 z-50 bg-lyra-surface/95 border-2 border-dashed border-lyra-accent flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm pointer-events-none">
              <Upload size={36} className="text-lyra-accent animate-bounce mb-2" />
              <p className="text-sm font-bold text-lyra-text">Lepaskan file di sini</p>
              <p className="text-xs text-lyra-text-secondary mt-1">File akan diunggah ke workspace saat ini</p>
            </div>
          )}

          <input 
            ref={fileInputRef} 
            type="file" 
            multiple 
            className="hidden" 
            onChange={(e) => { 
              if (e.target.files && e.target.files.length > 0) {
                handleWorkspaceUpload(e.target.files);
              }
            }} 
          />

          {/* Header & Toolbar */}
          <div className="p-3 border-b border-lyra-accent/10 flex items-center justify-between bg-lyra-bg/70 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <FolderTree size={16} className="text-lyra-accent shrink-0" />
              <span className="font-semibold text-xs text-lyra-text uppercase tracking-wider">Workspace Explorer</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button 
                type="button"
                onClick={handleWorkspaceBack} 
                disabled={!currentWorkspace || currentWorkspace === 'ROOT'}
                className="p-1.5 rounded-lg text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10 transition-colors disabled:opacity-30 cursor-pointer"
                title="Naik satu tingkat folder"
              >
                <CornerLeftUp size={14} />
              </button>

              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()} 
                disabled={!currentWorkspace || currentWorkspace === 'ROOT' || isWorkspaceUploading}
                className="p-1.5 rounded-lg text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10 transition-colors disabled:opacity-30 cursor-pointer"
                title="Unggah file"
              >
                <Upload size={14} className={isWorkspaceUploading ? 'animate-spin' : ''} />
              </button>

              <button 
                type="button"
                onClick={() => loadWorkspaceFiles(currentWorkspace)} 
                className="p-1.5 rounded-lg text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10 transition-colors cursor-pointer"
                title="Muat ulang"
              >
                <RotateCw size={14} />
              </button>

              <button 
                type="button"
                onClick={() => {
                  setCreatingType(creatingType === 'file' ? null : 'file');
                  setCreatingName('');
                }} 
                disabled={!currentWorkspace || currentWorkspace === 'ROOT'}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${creatingType === 'file' ? 'bg-lyra-accent/20 text-lyra-accent' : 'text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10'} disabled:opacity-30`}
                title="Buat berkas baru"
              >
                <FilePlus size={14} />
              </button>

              <button 
                type="button"
                onClick={() => {
                  setCreatingType(creatingType === 'folder' ? null : 'folder');
                  setCreatingName('');
                }} 
                disabled={!currentWorkspace || currentWorkspace === 'ROOT'}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${creatingType === 'folder' ? 'bg-lyra-accent/20 text-lyra-accent' : 'text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10'} disabled:opacity-30`}
                title="Buat folder baru"
              >
                <FolderPlus size={14} />
              </button>

              <button 
                type="button"
                onClick={() => currentWorkspace && handleRevealInExplorer(currentWorkspace)} 
                disabled={!currentWorkspace || currentWorkspace === 'ROOT'}
                className="p-1.5 rounded-lg text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10 transition-colors disabled:opacity-30 cursor-pointer"
                title="Buka di Explorer"
              >
                <ExternalLink size={14} />
              </button>

              <button 
                type="button"
                onClick={onToggle} 
                className="p-1.5 rounded-lg text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10 transition-colors cursor-pointer ml-0.5"
                title="Tutup"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Breadcrumbs */}
          <div className="px-3 py-1.5 border-b border-lyra-accent/10 bg-lyra-surface/40 flex items-center gap-1 overflow-x-auto text-[11px] font-mono no-scrollbar shrink-0">
            {getBreadcrumbSegments(currentWorkspace).map((seg, idx, arr) => (
              <React.Fragment key={seg.path}>
                <button
                  type="button"
                  onClick={() => loadWorkspaceFiles(seg.path)}
                  className={`hover:text-lyra-accent hover:underline truncate max-w-[110px] transition-colors cursor-pointer ${
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

          {/* Search & Path Input */}
          <div className="p-2 border-b border-lyra-accent/10 flex flex-col gap-1.5 shrink-0">
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-2.5 text-lyra-text-secondary/60 pointer-events-none" />
              <input
                value={workspaceSearchQuery}
                onChange={e => setWorkspaceSearchQuery(e.target.value)}
                placeholder="Cari berkas/folder..."
                className="w-full bg-lyra-bg border border-lyra-accent/15 text-xs pl-8 pr-2.5 py-1 rounded-xl focus:outline-none focus:border-lyra-accent text-lyra-text placeholder:text-lyra-text-secondary/50 font-mono"
              />
              {workspaceSearchQuery && (
                <button
                  type="button"
                  onClick={() => setWorkspaceSearchQuery('')}
                  className="absolute right-2 text-lyra-text-secondary/60 hover:text-lyra-text cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Quick path bar */}
            <form onSubmit={(e) => { e.preventDefault(); loadWorkspaceFiles(workspaceInput); }} className="flex gap-1">
              <input
                value={workspaceInput}
                onChange={e => setWorkspaceInput(e.target.value)}
                placeholder="Masukkan path..."
                className="flex-1 bg-lyra-bg border border-lyra-accent/15 text-[11px] px-2 py-0.5 rounded-lg focus:outline-none focus:border-lyra-accent text-lyra-text font-mono truncate"
              />
              <button type="submit" className="px-2 py-0.5 rounded-lg bg-lyra-accent/15 hover:bg-lyra-accent/25 text-lyra-accent text-[10px] font-mono cursor-pointer">
                Buka
              </button>
            </form>
          </div>

          {/* Creation input form */}
          {creatingType && (
            <form onSubmit={handleCreateFileOrFolder} className="p-2.5 border-b border-lyra-accent/15 bg-lyra-accent/5 flex flex-col gap-1.5 shrink-0">
              <div className="text-[11px] font-semibold text-lyra-accent flex items-center justify-between">
                <span>{creatingType === 'folder' ? 'Buat Folder Baru' : 'Buat Berkas Baru'}</span>
                <button type="button" onClick={() => setCreatingType(null)} className="text-lyra-text-secondary hover:text-lyra-text cursor-pointer">
                  <X size={12} />
                </button>
              </div>
              <div className="flex gap-1.5">
                <input
                  autoFocus
                  value={creatingName}
                  onChange={e => setCreatingName(e.target.value)}
                  placeholder={creatingType === 'folder' ? 'Nama folder...' : 'Nama file (misal: test.ts)...'}
                  className="flex-1 bg-lyra-bg border border-lyra-accent/30 text-xs px-2 py-1 rounded-lg focus:outline-none focus:border-lyra-accent text-lyra-text font-mono"
                />
                <button type="submit" className="px-2.5 py-1 bg-lyra-accent text-white text-xs rounded-lg font-medium cursor-pointer">
                  Buat
                </button>
              </div>
            </form>
          )}

          {/* Files List View */}
          <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-0.5 text-xs font-mono">
            {workspaceFiles.length === 0 ? (
              <div className="py-12 text-center text-lyra-text-secondary/50 text-[11px]">
                Direktori kosong atau belum dimuat.
              </div>
            ) : (
              workspaceFiles
                .filter(f => !workspaceSearchQuery || f.name.toLowerCase().includes(workspaceSearchQuery.toLowerCase()))
                .map((f, idx) => {
                  const isDir = f.isDirectory;
                  const isMenuOpen = activeFileMenu === f.path;

                  return (
                    <div
                      key={idx}
                      className="group relative flex items-center justify-between p-1.5 rounded-lg hover:bg-lyra-accent/10 transition-colors cursor-pointer"
                      onClick={() => {
                        if (isDir) {
                          loadWorkspaceFiles(f.path);
                        } else {
                          handlePreviewFile(f);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                        {isDir ? (
                          <Folder size={14} className="text-amber-400 shrink-0" />
                        ) : (
                          <File size={14} className="text-sky-400 shrink-0" />
                        )}
                        <span className="truncate text-lyra-text text-[11px] group-hover:text-lyra-accent transition-colors">
                          {f.name}
                        </span>
                      </div>

                      {/* Action buttons on hover */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {!isDir && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewFile(f);
                            }}
                            className="p-1 rounded text-lyra-text-secondary hover:text-lyra-accent hover:bg-lyra-accent/20 cursor-pointer"
                            title="Lihat isi file"
                          >
                            <Eye size={12} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(f.path);
                            setCopiedPath(f.path);
                            setTimeout(() => setCopiedPath(null), 1500);
                          }}
                          className="p-1 rounded text-lyra-text-secondary hover:text-lyra-accent hover:bg-lyra-accent/20 cursor-pointer"
                          title="Salin path"
                        >
                          {copiedPath === f.path ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRevealInExplorer(f.path);
                          }}
                          className="p-1 rounded text-lyra-text-secondary hover:text-lyra-accent hover:bg-lyra-accent/20 cursor-pointer"
                          title="Buka di folder"
                        >
                          <ExternalLink size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Hapus ${f.name}?`)) {
                              handleDeleteItem(f.path);
                            }
                          }}
                          className="p-1 rounded text-lyra-text-secondary hover:text-red-400 hover:bg-red-500/15 cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-lyra-surface border border-lyra-accent/25 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-3.5 border-b border-lyra-accent/15 flex items-center justify-between bg-lyra-bg/80">
              <div className="flex items-center gap-2 min-w-0">
                <Code size={16} className="text-lyra-accent shrink-0" />
                <span className="font-mono text-xs text-lyra-text font-semibold truncate">{previewContent.name}</span>
                <span className="text-[10px] text-lyra-text-secondary/60 truncate font-mono">({previewContent.path})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(previewContent.content);
                    alert('Konten disalin ke clipboard!');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-lyra-accent/15 hover:bg-lyra-accent/25 text-lyra-accent text-xs font-mono cursor-pointer"
                >
                  Salin Teks
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewContent(null)}
                  className="p-1 rounded-lg text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-black/40 font-mono text-xs text-lyra-text leading-relaxed select-text">
              <pre className="whitespace-pre-wrap">{previewContent.content}</pre>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
