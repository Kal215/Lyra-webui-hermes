'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Terminal as TerminalIcon, Shield, Activity, X, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AgentTerminalPage({ params }: { params: Promise<{ id: string }> }) {
  const [logs, setLogs] = useState<{ id: string, text: string, type: string }[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const logsEndRef = useRef<HTMLDivElement>(null);

  // unwrap params
  const [agentId, setAgentId] = useState<string>('default');
  useEffect(() => { params.then(p => setAgentId(p.id)); }, [params]);

  useEffect(() => {
    const liveSource = searchParams?.get('liveSource') || 'hermes-live';
    const es = new EventSource(`/api/live/hermes/events?source=${liveSource}`);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.payload?.chunk) {
          setLogs(prev => [...prev.slice(-499), { 
            id: data.eventId, 
            text: data.payload.chunk,
            type: data.type
          }]);
        } else if (data && data.payload?.command) {
          setLogs(prev => [...prev.slice(-499), { 
            id: data.eventId, 
            text: `> ${data.payload.command}\n`,
            type: data.type
          }]);
        }
      } catch (e) {}
    };

    return () => es.close();
  }, [searchParams]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Cross-tab auto-sync workspace theme
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lyra-appearance' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const newWorkspace = parsed.state?.workspaceTheme;
          if (newWorkspace) {
            document.documentElement.setAttribute('data-workspace', newWorkspace);
          }
        } catch (err) {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // VS Code style syntax highlighting
  const syntaxHighlight = (text: string) => {
    let highlighted = text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2},\d{3})/g, '<span class="text-lyra-editor-muted opacity-80">$1</span>') // Dates
      .replace(/\b(INFO|DEBUG|SUCCESS)\b/g, '<span class="text-emerald-500 font-bold">$1</span>') // Greenish blue
      .replace(/\b(ERROR|WARN|CRITICAL)\b/g, '<span class="text-red-500 font-bold">$1</span>') // Red
      .replace(/\[([^\]]+)\]/g, '[<span class="text-lyra-editor-accent opacity-90">$1</span>]') // brackets
      .replace(/&gt; tool_call.*/g, '<span class="text-lyra-editor-accent font-bold">$&</span>'); // blue
      
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  const handleClose = () => {
    // Jika history kosong (dibuka via tab baru / _blank), tutup tab-nya
    if (window.history.length <= 2) {
      window.close();
      // Fallback pencegahan popup blocker
      setTimeout(() => router.push('/'), 100);
    } else {
      router.back();
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-lyra-editor-bg text-lyra-editor-text font-mono text-sm overflow-hidden z-[9999] fixed inset-0">
      
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 h-14 bg-lyra-editor-header border-b border-lyra-editor-border shrink-0 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-sans rounded-md bg-lyra-editor-bg border border-lyra-editor-border hover:border-lyra-editor-accent text-lyra-editor-text transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Kembali</span>
          </button>
          
          <div className="h-4 w-[1px] bg-lyra-editor-border" />

          <TerminalIcon size={18} className="text-lyra-editor-accent" />
          <span className="font-semibold text-sm tracking-wider uppercase text-lyra-editor-text opacity-90">
            Observation Deck - Node: {agentId}
          </span>
          <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-sm text-[10px] flex items-center gap-2 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)] font-sans">
            <Activity size={10} className="animate-pulse" /> LIVE STREAM
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleClose} 
            title="Tutup Jendela"
            className="p-2 text-lyra-editor-muted hover:text-white hover:bg-red-500 rounded-lg transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Terminal View */}
      <div className="flex-1 overflow-y-auto p-4 bg-lyra-editor-bg">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-40 gap-4 text-center">
            <Shield size={48} className="text-lyra-editor-accent" />
            <p className="text-lg text-lyra-editor-text">Menunggu koneksi data dari Node {agentId}...</p>
            <p className="text-sm text-lyra-editor-muted">Sistem akan menangkap pergerakan log Hermes secara real-time.<br/>Pastikan mesin agent sedang bekerja (memiliki proses di latar belakang).</p>
          </div>
        ) : (
          <pre className="whitespace-pre-wrap break-all leading-relaxed font-mono text-xs sm:text-sm text-lyra-editor-terminal-text">
            {logs.map((log, i) => (
              <div key={log.id + i} className="hover:bg-lyra-editor-header/50 px-3 py-1 -mx-3 rounded transition-colors duration-150 border-l-2 border-transparent hover:border-lyra-editor-accent">
                {syntaxHighlight(log.text)}
              </div>
            ))}
            <div ref={logsEndRef} className="h-4" />
          </pre>
        )}
      </div>

    </div>
  );
}