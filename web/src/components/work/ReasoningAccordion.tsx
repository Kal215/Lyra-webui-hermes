'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronDown, Sparkles } from 'lucide-react';

interface ReasoningAccordionProps {
  thought: string;
  isStreaming: boolean;
  defaultOpen?: boolean;
}

export const ReasoningAccordion: React.FC<ReasoningAccordionProps> = ({
  thought,
  isStreaming,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-lyra-accent/15 bg-lyra-surface/60 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-medium text-lyra-text-secondary hover:text-lyra-text transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Brain className={`h-4 w-4 ${isStreaming ? 'animate-pulse text-lyra-accent' : 'text-lyra-text-secondary/70'}`} />
          <span className="font-mono uppercase tracking-wider text-[11px] text-lyra-text-secondary">
            Thought Process
          </span>
          {isStreaming && (
            <span className="inline-flex items-center gap-1 rounded-full bg-lyra-accent/10 px-2 py-0.5 text-[10px] font-medium text-lyra-accent">
              <Sparkles className="h-2.5 w-2.5 animate-spin" /> Sedang Berpikir...
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-3.5 w-3.5 text-lyra-text-secondary/70" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
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
