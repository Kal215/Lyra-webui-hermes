'use client';

import React from 'react';
import { PackageCheck, ArrowRight, GitCommit, FileCheck } from 'lucide-react';
import { DeliverableArtifact } from '@/types/agent-studio';
import { useI18nStore } from '@/i18n';

interface DeliverableCardProps {
  artifact: DeliverableArtifact;
  onApprove?: () => void;
  onReject?: () => void;
  onSelectFile?: (path: string) => void;
}

export const DeliverableCard: React.FC<DeliverableCardProps> = ({ 
  artifact,
  onApprove,
  onReject,
  onSelectFile
}) => {
  const { language } = useI18nStore();

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-500/20 bg-lyra-surface/90 p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
          <PackageCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-lyra-text">
            {artifact.title}
          </h2>
          <p className="text-xs text-lyra-text-secondary">
            {language === 'id' 
              ? 'Tahapan kerja selesai dan terverifikasi. Siap untuk integrasi.' 
              : 'Work phases completed and verified. Ready for integration.'}
          </p>
        </div>
      </div>

      <div className="mt-4 text-xs leading-relaxed text-lyra-text-secondary whitespace-pre-wrap">
        {artifact.summary}
      </div>

      {artifact.changedFiles && artifact.changedFiles.length > 0 && (
        <div className="mt-5">
          <span className="font-mono text-[11px] uppercase tracking-wider text-lyra-text-secondary/70">
            {language === 'id' ? 'Berkas & Perubahan yang Dihasilkan' : 'Generated Files & Changes'}
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {artifact.changedFiles.map((file) => (
              <button
                key={file.path}
                type="button"
                onClick={() => onSelectFile?.(file.path)}
                className="flex items-center gap-1.5 rounded-lg border border-lyra-accent/20 bg-lyra-bg/80 hover:bg-lyra-accent/15 hover:border-lyra-accent/40 px-2.5 py-1 font-mono text-[11px] text-lyra-text transition-all cursor-pointer group"
                title={language === 'id' ? 'Buka berkas di workspace' : 'Open file in workspace'}
              >
                <FileCheck className="h-3 w-3 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="group-hover:text-lyra-accent transition-colors">{file.path}</span>
                <span className="text-[9px] uppercase text-lyra-text-secondary">({file.action})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {artifact.nextActionableSteps && artifact.nextActionableSteps.length > 0 && (
        <div className="mt-5 border-t border-lyra-accent/10 pt-4">
          <span className="font-mono text-[11px] uppercase tracking-wider text-lyra-text-secondary/70">
            {language === 'id' ? 'Langkah Rekomendasi Selanjutnya' : 'Recommended Next Steps'}
          </span>
          <ul className="mt-2 space-y-1.5">
            {artifact.nextActionableSteps.map((step, idx) => (
              <li
                key={idx}
                className="flex items-center gap-2 text-xs text-lyra-text-secondary"
              >
                <ArrowRight className="h-3 w-3 shrink-0 text-lyra-accent" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex items-center justify-end gap-3 border-t border-lyra-accent/10 pt-4">
        {artifact.gitBranch && (
          <div className="mr-auto flex items-center gap-1 font-mono text-xs text-lyra-text-secondary">
            <GitCommit className="h-3.5 w-3.5" />
            <span>branch: {artifact.gitBranch}</span>
          </div>
        )}
        {onReject && (
          <button 
            type="button"
            onClick={onReject}
            className="rounded-xl border border-lyra-accent/20 px-3.5 py-1.5 text-xs font-medium text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10 transition-colors cursor-pointer"
          >
            {language === 'id' ? 'Tolak / Minta Revisi' : 'Reject / Request Revision'}
          </button>
        )}
        {onApprove && (
          <button 
            type="button"
            onClick={onApprove}
            className="rounded-xl bg-lyra-accent hover:bg-lyra-accent/90 px-4 py-1.5 text-xs font-semibold text-white shadow-md transition-all cursor-pointer"
          >
            {language === 'id' ? 'Setujui & Gabungkan' : 'Approve & Merge'}
          </button>
        )}
      </div>
    </div>
  );
};
