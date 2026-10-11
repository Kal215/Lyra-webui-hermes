'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AgentTerminalRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();

  useEffect(() => {
    params.then(p => {
      const targetAgent = p.id || 'default';
      // Redirect permanen ke /workspace dengan activeAgent yang dipilih
      router.replace(`/workspace?activeAgent=${encodeURIComponent(targetAgent)}`);
    });
  }, [params, router]);

  return (
    <div className="flex items-center justify-center h-screen w-full bg-lyra-bg text-lyra-text font-mono text-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-lyra-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-lyra-text-secondary">Mengalihkan ke Workspace Editor...</span>
      </div>
    </div>
  );
}
