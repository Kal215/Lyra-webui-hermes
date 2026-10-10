'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from './NeoPanel';
import { useTactileSound, useSoundStore } from '@/hooks/use-tactile-sound';
import { 
  Home, ListTodo, UsersRound, Globe2, Server, History, FolderTree, 
  Settings, ChevronLeft, ChevronRight, X, MessageSquare, Command, Zap, Brain
} from 'lucide-react';
import { useTranslation, useI18nStore } from '@/i18n';

interface SidebarProps {
  collapsed: boolean;
  onToggle?: () => void;
  onMobileClose?: () => void;
}

export function Sidebar({ collapsed, onToggle, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { playClick, playPress } = useTactileSound();
  const [profileOpen, setProfileOpen] = useState(false);
  const { enabled, setEnabled } = useSoundStore();
  const t = useTranslation();
  const { language } = useI18nStore();

  const handleLinkClick = () => {
    playClick();
    if (onMobileClose) onMobileClose();
  };

  const MENU_ITEMS = [
    { label: t('nav.home'), href: '/', icon: Home },
    { label: language === 'id' ? 'Proyek' : 'Projects', href: '/projects', icon: Command },
    { label: language === 'id' ? 'Percakapan' : 'Chat', href: '/chat', icon: MessageSquare },
    { label: t('nav.work'), href: '/work', icon: ListTodo },
    { label: 'Workspace', href: '/workspace', icon: FolderTree },
    { label: language === 'id' ? 'Profil' : 'Profiles', href: '/profiles', icon: UsersRound },
    { label: language === 'id' ? 'Perintah' : 'Skills', href: '/skills', icon: Zap },
    { label: language === 'id' ? 'Ingatan' : 'Memory', href: '/memory', icon: Brain },
    { label: t('nav.world'), href: '/world', icon: Globe2 },
    { label: t('nav.systems'), href: '/systems', icon: Server },
    { label: t('nav.activity'), href: '/activity', icon: History },
  ];

  return (
    <div className="flex flex-col h-full py-6 select-none relative bg-lyra-surface">
      {/* Brand & Mobile Close */}
      <div className={cn("px-6 flex items-center justify-between mb-10", collapsed && "px-0 justify-center")}>
        <span className="font-bold tracking-[0.2em] text-lg uppercase text-lyra-text">
          {collapsed ? 'L' : 'LYRA'}
        </span>
        {onMobileClose && (
          <button 
            onClick={() => { playClick(); onMobileClose(); }}
            className="md:hidden p-2 text-lyra-text-muted hover:text-lyra-text"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-2">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              onPointerDown={() => playPress()}
              className={cn(
                "flex items-center gap-4 px-3 py-3 rounded-lyra-md transition-all duration-200 group",
                isActive 
                  ? "shadow-neo bg-lyra-surface text-lyra-text font-medium" 
                  : "text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-surface hover:shadow-neo",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={20} className={cn(isActive && "text-lyra-accent", "shrink-0")} />
              {!collapsed && (
                <span className="font-medium text-sm">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Profile */}
      <div className="px-3 mt-auto relative space-y-2">
        <Link
          href="/settings"
          onClick={handleLinkClick}
          onPointerDown={() => playPress()}
          className={cn(
            "flex items-center gap-4 px-3 py-3 rounded-lyra-md transition-all duration-200 active:shadow-neo-active-inset active:translate-y-[1px]",
            pathname === '/settings'
              ? "shadow-neo-shallow-inset bg-lyra-surface-inset text-lyra-text" 
              : "text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-surface-inset hover:shadow-neo-shallow-inset hover:-translate-y-[1px]",
            collapsed && "justify-center"
          )}
          title={collapsed ? t('nav.settings') : undefined}
        >
          <Settings size={20} className={cn(pathname === '/settings' && "text-lyra-accent", "shrink-0")} />
          {!collapsed && (
            <span className="font-medium text-sm">
              {t('nav.settings')}
            </span>
          )}
        </Link>
        
        {/* User Profile */}
        <div className="pt-2">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            onPointerDown={() => playPress()}
            className={cn(
              "w-full flex items-center gap-3 p-2 rounded-lyra-md transition-all duration-200 active:shadow-neo-active-inset active:translate-y-[1px]",
              profileOpen 
                ? "shadow-neo-shallow-inset bg-lyra-surface-inset" 
                : "shadow-neo bg-lyra-surface hover:shadow-neo-shallow-inset hover:bg-lyra-surface-inset hover:-translate-y-[1px]",
              collapsed && "justify-center"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-lyra-bg shadow-neo-inset flex items-center justify-center shrink-0">
              <span className="font-bold text-xs">RK</span>
            </div>
            {!collapsed && (
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span className="font-medium text-sm truncate">Riskal</span>
                <div className="w-2 h-2 rounded-full bg-lyra-success shadow-[0_0_8px_var(--color-lyra-success)]"></div>
              </div>
            )}
          </button>
          
          {/* Glassmorphism Profile Popover */}
          {profileOpen && !collapsed && (
            <div className="absolute bottom-full left-3 mb-2 w-[calc(100%-24px)] bg-lyra-glass-bg backdrop-blur-md border border-lyra-glass-border rounded-lyra-lg shadow-xl p-4 z-50">
              <div className="text-sm font-medium mb-1">Riskal Agent</div>
              <div className="text-xs text-lyra-text-muted mb-4">{t('status.allNormal')}</div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-lyra-text-secondary">{t('settings.sound')}</span>
                <button 
                  onClick={() => {
                    setEnabled(!enabled);
                    if (!enabled) playClick();
                  }}
                  className={cn(
                    "w-10 h-5 rounded-full relative transition-colors duration-200",
                    enabled ? "bg-lyra-accent" : "bg-lyra-surface-inset shadow-neo-inset"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-200",
                    enabled ? "translate-x-5" : ""
                  )} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Desktop Collapse Toggle */}
      {onToggle && (
        <button
          onClick={() => {
            playClick();
            onToggle();
          }}
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-lyra-surface shadow-neo rounded-r-lyra-sm items-center justify-center text-lyra-text-muted hover:text-lyra-text hover:shadow-neo-shallow-inset transition-all duration-200"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      )}
    </div>
  );
}
