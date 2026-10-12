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
  color: string;
}

const PHASES: PhaseDefinition[] = [
  {
    id: 'dispatch',
    labelId: 'Komando & Koordinasi',
    labelEn: 'Dispatch & Strategy',
    agentName: 'Aster',
    role: 'Coordinator',
    icon: Compass,
    color: 'indigo'
  },
  {
    id: 'architect',
    labelId: 'Rancang Arsitektur',
    labelEn: 'System Architecture',
    agentName: 'Atlas',
    role: 'Architect',
    icon: Layers,
    color: 'amber'
  },
  {
    id: 'engineering',
    labelId: 'Penulisan Kode',
    labelEn: 'Software Engineering',
    agentName: 'Forge',
    role: 'Engineer',
    icon: Code2,
    color: 'blue'
  },
  {
    id: 'qa',
    labelId: 'Uji & Penjaminan Mutu',
    labelEn: 'QA & Testing',
    agentName: 'Iris',
    role: 'QA Lead',
    icon: ShieldCheck,
    color: 'purple'
  },
  {
    id: 'verification',
    labelId: 'Verifikasi Akhir',
    labelEn: 'Deliverable Verification',
    agentName: 'Nova',
    role: 'Verifier',
    icon: CheckCircle2,
    color: 'emerald'
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
    <div className="w-full bg-lyra-surface/60 border border-lyra-accent/15 rounded-2xl p-2.5 sm:p-3 shadow-xs backdrop-blur-md">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold tracking-wider uppercase text-lyra-text-secondary">
          <Sparkles size={12} className="text-lyra-accent" />
          <span>{language === 'id' ? 'Alur Delegasi Skuad Otonom' : 'Autonomous Squad Topology'}</span>
        </div>
        <div className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-lyra-accent/10 text-lyra-accent border border-lyra-accent/20">
          {language === 'id' ? `Tahap ${currentIndex + 1} dari 5` : `Phase ${currentIndex + 1} of 5`}
        </div>
      </div>

      {/* Pipeline Graph Steps */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
        {PHASES.map((phase, idx) => {
          const Icon = phase.icon;
          const isActive = phase.id === currentPhase;
          const isDone = idx < currentIndex;
          const isPending = idx > currentIndex;

          return (
            <div
              key={phase.id}
              className={`relative flex items-center gap-2 p-2 rounded-xl border transition-all text-left ${
                isActive
                  ? 'bg-lyra-accent/15 border-lyra-accent/40 shadow-sm ring-1 ring-lyra-accent/20'
                  : isDone
                  ? 'bg-lyra-surface/90 border-emerald-500/30 text-emerald-400/90'
                  : 'bg-lyra-surface/40 border-lyra-accent/10 opacity-60'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                  isActive
                    ? 'bg-lyra-accent text-white shadow-xs animate-pulse'
                    : isDone
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-lyra-surface border border-lyra-accent/15 text-lyra-text-secondary'
                }`}
              >
                <Icon size={14} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className={`text-[11px] font-semibold truncate ${
                    isActive ? 'text-lyra-text font-bold' : isDone ? 'text-emerald-400' : 'text-lyra-text-secondary'
                  }`}>
                    @{phase.agentName}
                  </span>
                  {isActive && isStreaming && (
                    <span className="w-1.5 h-1.5 rounded-full bg-lyra-accent animate-ping shrink-0" />
                  )}
                </div>
                <p className="text-[9px] text-lyra-text-secondary truncate leading-tight">
                  {language === 'id' ? phase.labelId : phase.labelEn}
                </p>
              </div>

              {/* Arrow connector between items for sm screens */}
              {idx < PHASES.length - 1 && (
                <div className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-lyra-text-secondary/30 pointer-events-none">
                  <ArrowRight size={10} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
