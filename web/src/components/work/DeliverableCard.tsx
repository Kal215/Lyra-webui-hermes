'use client';

import React, { useState } from 'react';
import { 
  FolderCheck, 
  FileCode, 
  Copy, 
  Check, 
  ExternalLink, 
  Eye,
  CornerDownRight
} from 'lucide-react';
import { DeliverableArtifact } from '@/types/agent-studio';
import { useI18nStore } from '@/i18n';

interface DeliverableCardProps {
  artifact: DeliverableArtifact;
  onSelectFile?: (path: string) => void;
  onOpenInWorkspace?: (path: string) => void;
}

export const DeliverableCard: React.FC<DeliverableCardProps> = ({ 
  artifact,
  onSelectFile,
  onOpenInWorkspace
}) => {
  const { language } = useI18nStore();
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const getFileBadge = (action: string) => {
    switch (action) {
      case 'created':
        return {
          label: language === 'id' ? 'Baru' : 'New',
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        };
      case 'modified':
        return {
          label: language === 'id' ? 'Diubah' : 'Modified',
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        };
      default:
        return {
          label: action.toUpperCase(),
          color: 'bg-zinc-800 text-zinc-400 border-zinc-700/60'
        };
    }
  };

  const files = artifact.changedFiles || [];

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 text-zinc-100 shadow-xl transition-all">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 bg-zinc-900/60 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FolderCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono truncate">
              {language === 'id' ? 'Artefak Berkas Tersimpan' : 'Saved Output Artifacts'}
            </h3>
            <p className="text-[11px] text-zinc-500 font-mono truncate">
              {artifact.title || (language === 'id' ? 'Hasil eksekusi berkas' : 'Execution deliverables')}
            </p>
          </div>
        </div>

        {/* Saved Status Indicator */}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {language === 'id' ? 'Tersimpan di Workspace' : 'Saved to Workspace'}
        </span>
      </div>

      {/* Main Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Description / Summary */}
        {artifact.summary && (
          <p className="text-xs leading-relaxed text-zinc-400">
            {artifact.summary}
          </p>
        )}

        {/* Changed Files List */}
        {files.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between pb-1">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {language === 'id' ? 'Berkas Dihasilkan' : 'Generated Files'} ({files.length})
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {language === 'id' ? 'Klik berkas untuk membuka Canvas' : 'Click to inspect in Canvas'}
              </span>
            </div>

            <div className="divide-y divide-zinc-800/60 rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              {files.map((file) => {
                const badge = getFileBadge(file.action);
                const fileName = file.path.split(/[\/\\]/).pop() || file.path;
                const isCopied = copiedPath === file.path;

                return (
                  <div
                    key={file.path}
                    onClick={() => onSelectFile?.(file.path)}
                    className="group flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 px-3.5 py-2.5 hover:bg-zinc-800/40 cursor-pointer transition-colors"
                  >
                    {/* Left: Icon & Path */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <FileCode className="h-4 w-4 shrink-0 text-blue-400 group-hover:text-blue-300 transition-colors" />
                      <div className="flex items-baseline gap-2 min-w-0 font-mono text-xs">
                        <span className="font-medium text-zinc-200 group-hover:text-white transition-colors truncate">
                          {fileName}
                        </span>
                        <span className="text-[10px] text-zinc-500 truncate hidden md:inline">
                          ({file.path})
                        </span>
                      </div>
                      <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-medium border ${badge.color} shrink-0`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                      {/* Open in Canvas */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectFile?.(file.path);
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-mono cursor-pointer transition-colors"
                        title={language === 'id' ? 'Buka di Canvas Code Viewer' : 'Open in Canvas'}
                      >
                        <Eye className="h-3 w-3 text-zinc-400" />
                        <span>Canvas</span>
                      </button>

                      {/* Copy Path */}
                      <button
                        type="button"
                        onClick={(e) => handleCopy(e, file.path)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono cursor-pointer transition-colors"
                        title={isCopied ? 'Tersalin' : 'Salin path'}
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400 text-[10px]">OK</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 text-zinc-400" />
                            <span className="text-[10px]">{language === 'id' ? 'Salin' : 'Copy'}</span>
                          </>
                        )}
                      </button>

                      {/* Open in Full IDE */}
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
                        className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors"
                        title={language === 'id' ? 'Buka di IDE Editor penuh' : 'Open in Workspace IDE'}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Notice */}
      <div className="flex items-center justify-between gap-3 border-t border-zinc-800/80 bg-zinc-900/40 px-4 py-2.5 sm:px-5 text-[11px] text-zinc-500 font-mono">
        <div className="flex items-center gap-1.5 truncate">
          <CornerDownRight className="h-3 w-3 text-zinc-600 shrink-0" />
          <span className="truncate">
            {language === 'id' 
              ? 'Untuk revisi, ketik instruksi di composer pesan atau gunakan In-Line Edit di Canvas.' 
              : 'To revise, send a message in the composer or use Canvas In-Line Edit.'}
          </span>
        </div>
      </div>
    </div>
  );
};
