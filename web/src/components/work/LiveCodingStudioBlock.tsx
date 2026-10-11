'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Bot, ExternalLink, ChevronDown, Check, Sparkles } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace';
import Link from 'next/link';

export function LiveCodingStudioBlock() {
  const { liveTyping } = useWorkspaceStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!liveTyping || !liveTyping.active) {
      return;
    }

    const fullContent = liveTyping.diffOrContent || '// Menginisialisasi modifikasi berkas...';
    setIsTyping(true);
    let currentIdx = 0;
    setDisplayedText('');

    const interval = setInterval(() => {
      currentIdx += 6;
      if (currentIdx >= fullContent.length) {
        setDisplayedText(fullContent);
        setIsTyping(false);
        clearInterval(interval);
      } else {
        setDisplayedText(fullContent.slice(0, currentIdx));
      }
    }, 25);

    return () => {
      clearInterval(interval);
      setIsTyping(false);
    };
  }, [liveTyping]);

  if (!liveTyping) return null;

  const fileName = liveTyping.filePath ? liveTyping.filePath.split(/[\/\\]/).pop() : 'script.ts';

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-blue-500/30 bg-[#0d1117] shadow-xl">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-blue-950/30 border-b border-blue-500/20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
            <Code2 size={14} />
          </div>
          <div className="flex items-center gap-2 min-w-0 font-mono text-xs">
            <span className="font-semibold text-blue-300 truncate">{fileName}</span>
            <span className="text-[10px] text-blue-400/70 truncate hidden sm:inline">({liveTyping.filePath})</span>
          </div>
          {isTyping ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-mono animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
              @{liveTyping.agentName} sedang menulis live...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
              <Check size={10} /> Selesai ditulis
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/workspace?activeAgent=coder`}
            className="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 text-xs font-mono transition-colors flex items-center gap-1.5"
            title="Buka di Workspace IDE Penuh"
          >
            <ExternalLink size={12} />
            <span className="hidden sm:inline">Buka di Workspace</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-lyra-text-secondary hover:text-lyra-text hover:bg-white/5 transition-colors"
          >
            <ChevronDown size={14} className={isExpanded ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </button>
        </div>
      </div>

      {/* Code viewport */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-3.5 font-mono text-xs text-lyra-text bg-black/60 overflow-x-auto max-h-80 leading-relaxed select-text"
          >
            <pre className="whitespace-pre-wrap font-mono text-[11px] text-gray-200">
              {displayedText}
              {isTyping && <span className="inline-block w-2 h-3.5 bg-blue-400 ml-0.5 animate-pulse" />}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
