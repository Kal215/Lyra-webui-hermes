import React from 'react';

interface Props {
  mode: 'light' | 'dark';
  title: string;
  selected: boolean;
  onClick: () => void;
}

export function ModePreviewCard({ mode, title, selected, onClick }: Props) {
  const c = mode === 'light' ? {
    bg: '#EAECF0',
    raised: '#F2F4F7',
    inset: '#E2E4E8',
    text: '#292C32',
    accent: '#6569A8',
    border: 'rgba(80, 85, 95, 0.18)'
  } : {
    bg: '#141517',
    raised: '#1C1D21',
    inset: '#101113',
    text: '#E2E4E8',
    accent: '#8B8DC2',
    border: 'rgba(0,0,0,0.5)'
  };

  return (
    <button 
      onClick={onClick}
      className={`relative flex flex-col items-center gap-3 w-full max-w-[200px] group transition-all duration-300 ${selected ? 'scale-105' : 'hover:scale-[1.02] opacity-80 hover:opacity-100'}`}
    >
      <div 
        className={`w-full aspect-[4/3] rounded-lg overflow-hidden shadow-lg transition-colors`}
        style={{ backgroundColor: c.bg, border: `2px solid ${selected ? c.accent : c.border}` }}
      >
        <div className="w-full h-full flex flex-col p-2 gap-2">
          {/* Header */}
          <div className="w-full h-4 rounded" style={{ backgroundColor: c.raised, boxShadow: `0 1px 2px ${c.border}` }}></div>
          {/* Layout */}
          <div className="flex gap-2 flex-1">
            <div className="w-1/3 h-full rounded" style={{ backgroundColor: c.inset, boxShadow: `inset 0 1px 2px ${c.border}` }}></div>
            <div className="flex-1 flex flex-col gap-2">
              <div className="w-full h-1/2 rounded" style={{ backgroundColor: c.raised, boxShadow: `0 2px 4px ${c.border}` }}>
                <div className="m-1 w-1/2 h-2 rounded" style={{ backgroundColor: c.text, opacity: 0.8 }}></div>
                <div className="m-1 w-3/4 h-2 rounded" style={{ backgroundColor: c.text, opacity: 0.4 }}></div>
              </div>
              <div className="w-full flex-1 rounded flex items-center justify-center" style={{ backgroundColor: c.raised, boxShadow: `0 2px 4px ${c.border}` }}>
                 <div className="w-6 h-4 rounded" style={{ backgroundColor: c.accent }}></div>
              </div>
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