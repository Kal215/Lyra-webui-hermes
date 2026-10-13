'use client';

import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, Copy, Check, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ToolCallLog } from '@/types/agent-studio';

interface ExecutionConsoleDrawerProps {
  toolLogs: ToolCallLog[];
  isExecuting: boolean;
  language?: string;
}

export function ExecutionConsoleDrawer({
  toolLogs,
  isExecuting,
  language = 'id'
}: ExecutionConsoleDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'terminal' | 'errors'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const hasErrors = toolLogs.some((l) => l.status === 'failed');
  const runningCount = toolLogs.filter((l) => l.status === 'running').length;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = toolLogs.filter((log) => {
    if (activeTab === 'errors') return log.status === 'failed';
    if (activeTab === 'terminal') return log.toolName === 'bash_executor' || String(log.toolName).includes('bash');
    return true;
  });

  if (toolLogs.length === 0 && !isExecuting) return null;

  return (
    <div className="border border-lyra-accent/20 bg-[#0d1117] rounded-xl overflow-hidden shadow-lg transition-all duration-200">
      {/* Console Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors border-b border-zinc-800/80 bg-[#161b22]"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-700 flex items-center justify-center text-emerald-400">
            <Terminal size={13} />
          </div>
          <span className="font-mono text-xs font-semibold text-zinc-200">
            {language === 'en' ? 'Live Execution Console & Sandbox Logs' : 'Konsol Eksekusi & Log Sandbox'}
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
            {toolLogs.length} {language === 'id' ? 'peristiwa' : 'events'}
          </span>
          {isExecuting && runningCount > 0 && (
            <span className="flex items-center gap-1.5 text-[11px] text-amber-500 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-mono animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              {language === 'en' ? 'Executing live sandbox' : 'Sandbox sedang berjalan'}
            </span>
          )}
          {hasErrors && (
            <span className="flex items-center gap-1 text-[11px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full font-mono">
              <AlertCircle size={11} />
              Errors
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400">
            {isOpen
              ? (language === 'en' ? 'Hide console' : 'Sembunyikan log')
              : (language === 'en' ? 'View live sandbox output' : 'Buka log output')}
          </span>
          <div className="text-zinc-400 hover:text-zinc-200 transition-transform duration-200">
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {/* Expanded Console Window */}
      {isOpen && (
        <div className="p-3 bg-zinc-950 font-mono text-xs text-zinc-300">
          {/* Sub-Tabs */}
          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-zinc-800 text-[11px]">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'all'
                  ? 'bg-zinc-800 text-white font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {language === 'id' ? 'Semua Panggilan' : 'All Calls'} ({toolLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('terminal')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'terminal'
                  ? 'bg-zinc-800 text-white font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {language === 'id' ? 'Perintah / Bash' : 'Commands / Bash'} ({toolLogs.filter((l) => l.toolName === 'bash_executor' || String(l.toolName).includes('bash')).length})
            </button>
            <button
              onClick={() => setActiveTab('errors')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'errors'
                  ? 'bg-rose-950/50 text-rose-300 font-medium'
                  : 'text-zinc-400 hover:text-rose-400'
              }`}
            >
              {language === 'id' ? 'Galat / Error' : 'Errors'} ({toolLogs.filter((l) => l.status === 'failed').length})
            </button>
          </div>

          {/* Logs List */}
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredLogs.length === 0 ? (
              <div className="py-6 text-center text-zinc-500 italic">
                {language === 'en' ? 'No execution events in this filter' : 'Tidak ada event pada filter ini'}
              </div>
            ) : (
              filteredLogs.map((log) => {
                const inputStr = log.commandPreview || (log.rawInput ? JSON.stringify(log.rawInput, null, 2) : '');
                const outputStr = typeof log.output === 'object' ? JSON.stringify(log.output, null, 2) : String(log.output || '');

                return (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        {log.status === 'running' && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        )}
                        {log.status === 'success' && (
                          <CheckCircle2 size={13} className="text-emerald-400" />
                        )}
                        {log.status === 'failed' && (
                          <AlertCircle size={13} className="text-rose-400" />
                        )}
                        <span className="font-bold text-emerald-400 uppercase tracking-wider">
                          [{log.toolName}]
                        </span>
                        {log.durationMs && (
                          <span className="text-zinc-500">
                            {log.durationMs}ms
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleCopy(outputStr || inputStr, log.id)}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                        title="Copy payload"
                      >
                        {copiedId === log.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>

                    {/* Input invocation */}
                    {inputStr && (
                      <div className="text-zinc-400 text-[11px] bg-zinc-950/60 p-2 rounded border border-zinc-800/50 overflow-x-auto">
                        <span className="text-zinc-500 select-none">$ </span>
                        {inputStr}
                      </div>
                    )}

                    {/* Output result */}
                    {outputStr && (
                      <div className="text-zinc-300 text-[11px] bg-zinc-950/90 p-2 rounded border border-zinc-800/70 overflow-x-auto max-h-36">
                        <pre className="whitespace-pre-wrap">{outputStr}</pre>
                      </div>
                    )}

                    {/* Error trace */}
                    {log.status === 'failed' && outputStr && (
                      <div className="text-rose-400 text-[11px] bg-rose-950/20 p-2 rounded border border-rose-900/40 overflow-x-auto">
                        <pre className="whitespace-pre-wrap">{outputStr}</pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
