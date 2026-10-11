'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, ChevronDown, Sparkles } from 'lucide-react';
import { useI18nStore } from '@/i18n';

interface ReasoningAccordionProps {
  thought?: string;
  isStreaming?: boolean;
}

export const ReasoningAccordion: React.FC<ReasoningAccordionProps> = ({ 
  thought,
  isStreaming = false 
}) => {
  const { language } = useI18nStore();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!thought) return null;

  return (
    <div className="my-2.5 overflow-hidden rounded-xl border border-lyra-accent/15 bg-lyra-surface/60 backdrop-blur-sm transition-all hover:border-lyra-accent/30">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-3.5 py-2 text-left text-xs text-lyra-text transition-colors hover:bg-lyra-accent/5 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-3.5 w-3.5 text-lyra-accent shrink-0" />
          <span className="font-semibold text-lyra-text">
            {language === 'id' ? 'Proses Penalaran (Thought Process)' : 'Thought Process'}
          </span>
          {isStreaming && (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-lyra-accent">
              <Sparkles className="h-2.5 w-2.5 animate-spin" /> {language === 'id' ? 'Sedang Berpikir...' : 'Thinking...'}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-3.5 w-3.5 text-lyra-text-secondary/70" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="reasoning-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="border-t border-lyra-accent/10 px-4 py-3 font-mono text-[12px] leading-relaxed text-lyra-text-secondary/90 whitespace-pre-wrap">
              {thought}
              {isStreaming && (
                <span className="ml-1 inline-block h-3.5 w-1.5 animate-pulse bg-lyra-accent align-middle" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
