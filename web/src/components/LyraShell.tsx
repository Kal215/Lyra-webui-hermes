/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import { cn } from './NeoPanel';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { NeoButton } from './NeoButton';
import { usePathname } from 'next/navigation';

export function LyraShell({ children }: { children: React.ReactNode }) { 
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem('lyra-sidebar-collapsed');
    if (saved === '1') setCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('lyra-sidebar-collapsed', next ? '1' : '0');
  };

  return (
    <div className="flex min-h-screen w-full bg-lyra-bg text-lyra-text selection:bg-lyra-accent-soft overflow-hidden">
      
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col bg-lyra-surface shadow-[4px_0_15px_rgba(0,0,0,0.3)] z-40 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
          collapsed ? 'w-[68px]' : 'w-[228px]'
        )}
      >
        <Sidebar collapsed={collapsed} onToggle={toggleCollapse} />
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <div 
            className="w-[240px] h-full bg-lyra-surface shadow-neo-floating"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar collapsed={false} onMobileClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1 flex flex-col min-w-0 h-screen",
        (pathname?.startsWith('/chat') || pathname?.startsWith('/work') || pathname?.startsWith('/workspace')) ? "overflow-hidden" : "overflow-y-auto"
      )}>
        
        {/* Mobile Header */}
        <header className="md:hidden flex items-center h-14 px-4 bg-lyra-surface/80 backdrop-blur-md sticky top-0 z-30 shadow-sm">
          <NeoButton variant="flat" className="p-2 -ml-2" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </NeoButton>
          <span className="font-bold tracking-widest uppercase ml-2 text-lyra-text">LYRA</span>
        </header>

        <div className={cn("flex-1", (pathname?.startsWith('/chat') || pathname?.startsWith('/work') || pathname?.startsWith('/workspace')) ? "h-full overflow-hidden p-0 md:p-0" : "p-4 md:p-8")}>
          {children}
        </div>
      </main>
    </div>
  );
}