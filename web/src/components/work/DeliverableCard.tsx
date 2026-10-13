'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  GitBranch, 
  FileCode, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  SendHorizontal, 
  X,
  FolderGit2,
  ChevronRight
} from 'lucide-react';
import { DeliverableArtifact } from '@/types/agent-studio';
import { useI18nStore } from '@/i18n';

interface DeliverableCardProps {
  artifact: DeliverableArtifact;
  onApprove?: () => void;
  onRequestRevision?: (revisionPrompt: string) => void;
  onReject?: () => void;
  onSelectFile?: (path: string) => void;
  onOpenInWorkspace?: (path: string) => void;
  isRevising?: boolean;
}

export const DeliverableCard: React.FC<DeliverableCardProps> = ({ 
  artifact,
  onApprove,
  onRequestRevision,
  onReject,
  onSelectFile,
  onOpenInWorkspace,
  isRevising = false
}) => {
  const { language } = useI18nStore();
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const [revisionText, setRevisionText] = useState('');
  const [isApproved, setIsApproved] = useState(false);

  const handleCopy = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const handleSendRevision = (textToSend?: string) => {
    const text = textToSend || revisionText;
    if (!text.trim()) return;
    if (onRequestRevision) {
      onRequestRevision(text.trim());
    } else if (onReject) {
      onReject();
    }
    setIsRevisionOpen(false);
    setRevisionText('');
  };

  const handleApproveAction = () => {
    setIsApproved(true);
    if (onApprove) {
      onApprove();
    }
  };

  const quickPills = language === 'id' ? [
    'Perbaiki penanganan error & edge cases',
    'Tambahkan dokumentasi komentar & types',
    'Refactor agar kode lebih modular',
    'Optimalkan logika eksekusi'
  ] : [
    'Fix error handling & edge cases',
    'Add documentation comments & types',
    'Refactor to be more modular',
    'Optimize execution logic'
  ];

  const getFileBadge = (action: string) => {
    switch (action) {
      case 'created':
        return {
          label: language === 'id' ? 'Baru' : 'New',
          color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
        };
      case 'modified':
        return {
          label: language === 'id' ? 'Diubah' : 'Modified',
          color: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
        };
      default:
        return {
          label: action.toUpperCase(),
          color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
        };
    }
  };

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-700/60 bg-[#0d1117] text-zinc-100 shadow-2xl transition-all">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800 bg-zinc-900/60 px-5 py-4">
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            {isApproved ? (
              <Check className="h-5 w-5 stroke-[2.5]" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isApproved 
                  ? (language === 'id' ? 'Disetujui & Digabungkan' : 'Approved & Merged')
                  : (language === 'id' ? 'Selesai & Terverifikasi' : 'Completed & Verified')}
              </span>
              {artifact.gitBranch && (
                <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-zinc-800/80 px-2 py-0.5 font-mono text-[11px] text-zinc-300 border border-zinc-700/60">
                  <GitBranch className="h-3 w-3 text-zinc-400" />
                  {artifact.gitBranch}
                </span>
              )}
            </div>
            <h2 className="mt-1.5 text-base font-semibold tracking-tight text-white">
              {artifact.title}
            </h2>
          </div>
        </div>

        {artifact.gitBranch && (
          <div className="sm:hidden flex items-center gap-1 font-mono text-xs text-zinc-400">
            <GitBranch className="h-3 w-3" />
            <span>{artifact.gitBranch}</span>
          </div>
        )}
      </div>

      {/* Main Content Body */}
      <div className="p-5 space-y-5">
        {/* Summary Description */}
        <p className="text-xs leading-relaxed text-zinc-400 whitespace-pre-wrap">
          {artifact.summary}
        </p>

        {/* Changed Files Row (Linear/Vercel Style) */}
        {artifact.changedFiles && artifact.changedFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                {language === 'id' ? 'Perubahan Berkas' : 'File Changes'} ({artifact.changedFiles.length})
              </span>
              <span className="text-[11px] text-zinc-400">
                {language === 'id' ? 'Klik untuk pratinjau' : 'Click to preview'}
              </span>
            </div>

            <div className="divide-y divide-zinc-800/80 rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
              {artifact.changedFiles.map((file) => {
                const badge = getFileBadge(file.action);
                const fileName = file.path.split(/[\/\\]/).pop() || file.path;
                const isCopied = copiedPath === file.path;

                return (
                  <div
                    key={file.path}
                    onClick={() => onSelectFile?.(file.path)}
                    className="group flex items-center justify-between px-3.5 py-2.5 hover:bg-zinc-800/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileCode className="h-4 w-4 shrink-0 text-blue-400 group-hover:text-blue-300 transition-colors" />
                      <div className="flex items-baseline gap-2 min-w-0 font-mono text-xs">
                        <span className="font-medium text-zinc-200 group-hover:text-white transition-colors truncate">
                          {fileName}
                        </span>
                        <span className="text-[11px] text-zinc-400 truncate hidden md:inline">
                          ({file.path})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-medium border ${badge.color}`}>
                        {badge.label}
                      </span>
                      
                      <button
                        type="button"
                        onClick={(e) => handleCopy(e, file.path)}
                        className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors cursor-pointer"
                        title={isCopied ? 'Tersalin!' : 'Salin path'}
                      >
                        {isCopied ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenInWorkspace) {
                            onOpenInWorkspace(file.path);
                          } else {
                            window.location.href = `/workspace?activeAgent=coder`;
                          }
                        }}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-700/60 transition-colors cursor-pointer"
                        title={language === 'id' ? 'Buka langsung di Workspace IDE' : 'Open directly in Workspace IDE'}
                      >
                        <ExternalLink className="h-3 w-3" />
                        <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Inline Revision Form (Opens when Request Revision is clicked) */}
        {isRevisionOpen && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-mono text-xs font-semibold text-amber-300">
                <RefreshCw className="h-3.5 w-3.5" />
                {language === 'id' ? 'Instruksi Revisi untuk Agen' : 'Revision Instructions for Agent'}
              </span>
              <button
                type="button"
                onClick={() => setIsRevisionOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Prompt Pills */}
            <div className="flex flex-wrap gap-1.5">
              {quickPills.map((pill, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRevisionText(prev => prev ? `${prev}. ${pill}` : pill)}
                  className="rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 px-2 py-1 text-[11px] text-zinc-300 transition-colors text-left cursor-pointer"
                >
                  + {pill}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={revisionText}
                onChange={(e) => setRevisionText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendRevision();
                  }
                }}
                placeholder={language === 'id' ? 'Jelaskan apa yang ingin disesuaikan atau diperbaiki...' : 'Describe what should be refined or fixed...'}
                className="flex-1 rounded-lg border border-zinc-700/80 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-400 focus:border-amber-500/60 focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => handleSendRevision()}
                disabled={!revisionText.trim() || isRevising}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-3 py-2 text-xs font-medium text-black disabled:opacity-50 transition-colors cursor-pointer"
              >
                <SendHorizontal className="h-3.5 w-3.5" />
                <span>{language === 'id' ? 'Kirim' : 'Send'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-950/70 px-5 py-3.5">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <FolderGit2 className="h-4 w-4 text-zinc-400" />
          <span className="font-mono text-[11px]">
            {language === 'id' ? 'Target cabang:' : 'Target branch:'}{' '}
            <strong className="font-semibold text-zinc-300">
              {artifact.gitBranch || 'feature/autonomous-task'}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2.5 ml-auto">
          {/* Reject / Request Revision Button */}
          {!isApproved && (
            <button
              type="button"
              onClick={() => setIsRevisionOpen(!isRevisionOpen)}
              disabled={isRevising}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-zinc-400 ${isRevisionOpen ? 'rotate-180 transition-transform' : ''}`} />
              <span>{language === 'id' ? 'Minta Revisi' : 'Request Revision'}</span>
            </button>
          )}

          {/* Approve & Merge Button */}
          {isApproved ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-3.5 py-1.5 text-xs font-medium text-emerald-400 font-mono">
                <Check className="h-3.5 w-3.5" />
                {language === 'id' ? 'Telah Disetujui' : 'Merged & Approved'}
              </span>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/workspace?activeAgent=coder';
                }}
                className="flex items-center gap-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-medium text-white transition-colors cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>{language === 'id' ? 'Buka IDE' : 'Open IDE'}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleApproveAction}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3.5 py-1.5 text-xs font-semibold text-black shadow-md shadow-emerald-950/40 transition-all cursor-pointer hover:shadow-lg"
            >
              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>{language === 'id' ? 'Setujui & Gabungkan' : 'Approve & Merge'}</span>
              <kbd className="hidden sm:inline-block ml-1 rounded bg-black/20 px-1 py-0.2 font-mono text-[9px] text-black/80 font-normal">
                ↵
              </kbd>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
