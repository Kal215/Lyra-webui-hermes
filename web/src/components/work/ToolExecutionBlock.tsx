'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronDown, Check, Terminal, FileCode2, Clock, Globe } from 'lucide-react';
import { ToolCallLog } from '@/types/agent-studio';

interface ToolExecutionGroupProps {
  toolLogs: ToolCallLog[];
  defaultExpanded?: boolean;
}

export const ToolExecutionBlock: React.FC<ToolExecutionGroupProps> = ({ 
  toolLogs,
  defaultExpanded = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const totalCount = toolLogs.length;
  const isRunning = toolLogs.some((t) => t.status === 'running');

  if (totalCount === 0) return null;

  const getToolIcon = (toolName: ToolCallLog['toolName']) => {
    switch (toolName) {
      case 'bash_executor':
        return <Terminal className="h-3.5 w-3.5 text-lyra-accent" />;
      case 'web_search':
        return <Globe className="h-3.5 w-3.5 text-cyan-400" />;
      default:
        return <FileCode2 className="h-3.5 w-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="my-2.5 overflow-hidden rounded-xl border border-lyra-accent/15 bg-lyra-surface/70 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-3.5 py-2 text-left text-xs text-lyra-text transition-colors hover:bg-lyra-accent/5 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/10 text-amber-500">
            <Zap className="h-3 w-3 fill-current" />
          </div>
          <span className="font-medium text-lyra-text">
            Menjalankan {totalCount} operasi sistem
          </span>
          <span className="text-lyra-text-secondary/50">•</span>
          {isRunning ? (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-lyra-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-lyra-accent animate-ping" />
              Running...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400 font-semibold">
              <Check className="h-3 w-3" /> Done
            </span>
          )}
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-3.5 w-3.5 text-lyra-text-secondary" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-lyra-accent/10 bg-lyra-bg/40 px-3.5 py-3"
          >
            <div className="relative ml-2.5 space-y-3 border-l border-lyra-accent/20 pl-4">
              {toolLogs.map((tool) => (
                <div key={tool.id} className="group relative">
                  {/* Tree branch line */}
                  <div className="absolute -left-[21px] top-2 h-px w-3.5 bg-lyra-accent/20" />

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      {getToolIcon(tool.toolName)}
                      <code className="rounded bg-lyra-surface border border-lyra-accent/15 px-1.5 py-0.5 font-mono text-[11px] text-lyra-text truncate">
                        {tool.commandPreview}
                      </code>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[10px] text-lyra-text-secondary shrink-0">
                      {tool.durationMs !== undefined && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {tool.durationMs}ms
                        </span>
                      )}
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          tool.status === 'success'
                            ? 'bg-emerald-500'
                            : tool.status === 'failed'
                            ? 'bg-rose-500'
                            : 'animate-ping bg-lyra-accent'
                        }`}
                      />
                    </div>
                  </div>

                  {tool.output && (
                    <div className="mt-1.5 max-h-36 overflow-x-auto rounded-lg border border-lyra-accent/10 bg-black/40 p-2 font-mono text-[11px] text-lyra-text-secondary">
                      <pre className="whitespace-pre-wrap leading-relaxed">{tool.output}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
