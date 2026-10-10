'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { io, Socket } from 'socket.io-client';
import { NeoPanel } from './NeoPanel';
import '@xterm/xterm/css/xterm.css';

export function TerminalPanel({ height = '400px' }: { height?: string }) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: 'transparent',
        foreground: '#e2e8f0', // slate-200
        cursor: '#3b82f6', // blue-500
        selectionBackground: 'rgba(59, 130, 246, 0.3)',
      },
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 13,
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    term.open(terminalRef.current);
    
    // Fit must be called after opening and waiting for render
    setTimeout(() => fitAddon.fit(), 50);

    const newSocket = io({
      transports: ['websocket', 'polling']
    });
    setSocket(newSocket);

    newSocket.on('terminal.data', (data: string) => {
      term.write(data);
    });

    term.onData((data) => {
      newSocket.emit('terminal.write', data);
    });

    const handleResize = () => {
      try { fitAddon.fit(); } catch(e) {}
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      newSocket.disconnect();
      term.dispose();
    };
  }, []);

  return (
    <NeoPanel className="w-full overflow-hidden p-3 flex flex-col relative group border border-white/5 bg-[#0f1115]" style={{ height }}>
      <div className="absolute top-2 right-4 text-[10px] text-white/20 uppercase tracking-widest font-mono z-10 select-none pointer-events-none">
        Integrated Terminal
      </div>
      <div className="w-full h-full [&>.terminal]:h-full" ref={terminalRef} />
    </NeoPanel>
  );
}
