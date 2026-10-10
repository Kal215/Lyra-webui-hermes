import React from 'react';
import { NeoPanel } from '@/components/NeoPanel';
import { WorkspaceTheme } from '@/store/preferences';

interface Props {
  theme: WorkspaceTheme;
  title: string;
  selected: boolean;
  onClick: () => void;
}

export function ThemePreviewCard({ theme, title, selected, onClick }: Props) {
  // Define mock color values just for the preview card rendering
  const getThemeColors = () => {
    switch (theme) {
      case 'light':
        return {
          bg: '#E2E4E8', // lyra surface inset
          header: '#DDE0E5',
          text: '#292C32',
          border: 'rgba(80, 85, 95, 0.18)',
          accent: '#6569A8',
          success: '#4E9F76'
        };
      case 'dark':
        return {
          bg: '#1e1e1e',
          header: '#252526',
          text: '#d4d4d4',
          border: '#333333',
          accent: '#007acc',
          success: '#4E9F76'
        };
      case 'vscode':
        return {
          bg: '#1e1e1e',
          header: '#252526',
          text: '#d4d4d4',
          border: '#3c3c3c',
          accent: '#007acc',
          success: '#89d185'
        };
      case 'paper':
        return {
          bg: '#f4f0e6',
          header: '#e8e2d2',
          text: '#4a4539',
          border: '#d3cbb8',
          accent: '#b05c3c',
          success: '#3c6e4e'
        };
    }
  };

  const c = getThemeColors();

  return (
    <button 
      onClick={onClick}
      className={`relative flex flex-col items-center gap-3 w-full max-w-[200px] group transition-all duration-300 ${selected ? 'scale-105' : 'hover:scale-[1.02] opacity-80 hover:opacity-100'}`}
    >
      <div 
        className={`w-full aspect-[4/3] rounded-lg overflow-hidden border-2 shadow-lg transition-colors`}
        style={{ borderColor: selected ? c.accent : 'transparent' }}
      >
        <div className="w-full h-full flex flex-col text-[10px]" style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border, borderWidth: 1 }}>
          {/* Header */}
          <div className="h-6 w-full flex items-center px-2 border-b" style={{ backgroundColor: c.header, borderColor: c.border }}>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.border }}></div>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.border }}></div>
            </div>
            <span className="ml-2 font-mono text-[8px] opacity-70">editor.tsx</span>
          </div>
          {/* Body */}
          <div className="p-2 font-mono flex flex-col gap-1 flex-1">
            <div className="flex gap-2">
              <span className="opacity-30">1</span>
              <span><span style={{ color: c.accent }}>import</span> {'{ useState }'}</span>
            </div>
            <div className="flex gap-2">
              <span className="opacity-30">2</span>
              <span><span style={{ color: c.success }}>{'// Live preview'}</span></span>
            </div>
            <div className="flex gap-2 mt-auto border-t pt-1" style={{ borderColor: c.border }}>
              <span><span style={{ color: c.accent }}>$</span> npm run build</span>
            </div>
          </div>
        </div>
      </div>
      <div className="font-medium text-sm text-lyra-text">{title}</div>
      {selected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: c.accent }}>
          ✓
        </div>
      )}
    </button>
  );
}