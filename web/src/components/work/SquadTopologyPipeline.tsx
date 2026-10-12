'use client';

import React from 'react';
import { 
  Compass, 
  Layers, 
  Code2, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useI18nStore } from '@/i18n';

export type SquadPhase = 'dispatch' | 'architect' | 'engineering' | 'qa' | 'verification';

interface SquadTopologyPipelineProps {
  currentPhase: SquadPhase;
  activeAgentId?: string;
  isStreaming?: boolean;
}

interface PhaseDefinition {
  id: SquadPhase;
  labelId: string;
  labelEn: string;
  agentName: string;
  role: string;
  icon: React.ElementType;
}

const PHASES: PhaseDefinition[] = [
  {
    id: 'dispatch',
    labelId: 'Komando & Strategi',
    labelEn: 'Dispatch & Strategy',
    agentName: 'Aster',
    role: 'Coordinator',
    icon: Compass,
  },
  {
    id: 'architect',
    labelId: 'Rancang Arsitektur',
    labelEn: 'System Architecture',
    agentName: 'Atlas',
    role: 'Architect',
    icon: Layers,
  },
  {
    id: 'engineering',
    labelId: 'Penulisan Kode',
    labelEn: 'Software Engineering',
    agentName: 'Forge',
    role: 'Engineer',
    icon: Code2,
  },
  {
    id: 'qa',
    labelId: 'Uji & Mutu',
    labelEn: 'QA & Testing',
    agentName: 'Iris',
    role: 'QA Lead',
    icon: ShieldCheck,
  },
  {
    id: 'verification',
    labelId: 'Verifikasi Akhir',
    labelEn: 'Final Verification',
    agentName: 'Nova',
    role: 'Verifier',
    icon: CheckCircle2,
  }
];

export const SquadTopologyPipeline: React.FC<SquadTopologyPipelineProps> = ({
  currentPhase,
  activeAgentId,
  isStreaming = false
}) => {
  const { language } = useI18nStore();
  const currentIndex = PHASES.findIndex(p => p.id === currentPhase);

  return (
    <div className="w-full bg-lyra-surface border border-lyra-accent/20 rounded-2xl p-3 sm:p-3.5 shadow-sm">
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-lyra-accent/15 flex items-center justify-center text-lyra-accent">
            <Sparkles size={12} />
          </div>
          <span className="text-xs font-bold tracking-wide uppercase text-lyra-text font-mono">
            {language === 'id' ? 'Alur Delegasi Skuad Otonom' : 'Autonomous Squad Topology'}
          </span>
        </div>
        <div className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-lyra-accent/15 text-lyra-accent border border-lyra-accent/30 shadow-2xs">
          {language === 'id' ? `Tahap ${currentIndex + 1} dari 5` : `Phase ${currentIndex + 1} of 5`}
        </div>
      </div>

      {/* High-Contrast Pipeline Graph Steps */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {PHASES.map((phase, idx) => {
          const Icon = phase.icon;
          const isActive = phase.id === currentPhase;
          const isDone = idx < currentIndex;
          const isPending = idx > currentIndex;

          return (
            <div
              key={phase.id}
              className={`relative flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left ${
                isActive
                  ? 'bg-lyra-accent/15 border-lyra-accent text-lyra-text shadow-sm ring-1 ring-lyra-accent/30'
                  : isDone
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-lyra-surface/70 border-lyra-accent/15 text-lyra-text-secondary hover:border-lyra-accent/30'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-lyra-accent text-white shadow-xs animate-pulse'
                    : isDone
                    ? 'bg-emerald-500 text-white shadow-2xs'
                    : 'bg-lyra-bg border border-lyra-accent/20 text-lyra-text-secondary'
                }`}
              >
                <Icon size={16} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold truncate leading-tight ${
                    isActive 
                      ? 'text-lyra-text' 
                      : isDone 
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
                      : 'text-lyra-text font-semibold'
                  }`}>
                    @{phase.agentName}
                  </span>
                  {isActive && isStreaming && (
                    <span className="w-1.5 h-1.5 rounded-full bg-lyra-accent animate-ping shrink-0" />
                  )}
                </div>
                <p className={`text-[10px] truncate leading-tight mt-0.5 font-medium ${
                  isActive
                    ? 'text-lyra-accent font-semibold'
                    : isDone
                    ? 'text-emerald-600/80 dark:text-emerald-400/80'
                    : 'text-lyra-text-secondary'
                }`}>
                  {language === 'id' ? phase.labelId : phase.labelEn}
                </p>
              </div>

              {/* Arrow connector between items for sm screens */}
              {idx < PHASES.length - 1 && (
                <div className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-lyra-accent/40 pointer-events-none">
                  <ArrowRight size={11} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
