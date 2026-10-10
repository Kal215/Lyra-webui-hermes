import React from 'react';
import { Surface } from '@/store/preferences';

interface Props {
  surface: Surface;
  title: string;
  selected: boolean;
  onClick: () => void;
}

export function SurfacePreviewCard({ surface, title, selected, onClick }: Props) {
  const getColors = () => {
    switch (surface) {
      case 'stone':
        return {
          bg: '#EAECF0',
          raised: '#F2F4F7',
          inset: '#E2E4E8',
          accent: '#6569A8',
          border: 'rgba(80, 85, 95, 0.18)'
        };
      case 'pearl':
        return {
          bg: '#F5F5F7',
          raised: '#FFFFFF',
          inset: '#EAEAEA',
          accent: '#5A5F7A',
          border: 'rgba(0, 0, 0, 0.1)'
        };
      case 'sand':
        return {
          bg: '#F4F1EC',
          raised: '#FDFBF7',
          inset: '#EBE6DF',
          accent: '#8B7355',
          border: 'rgba(120, 110, 100, 0.15)'
        };
    }
  };

  const c = getColors();

  return (
    <button 
      onClick={onClick}
      className={`relative flex flex-col items-center gap-3 w-full max-w-[160px] group transition-all duration-300 ${selected ? 'scale-105' : 'hover:scale-[1.02] opacity-80 hover:opacity-100'}`}
    >
      <div 
        className={`w-full aspect-square rounded-lg overflow-hidden shadow-lg transition-colors flex items-center justify-center p-4`}
        style={{ backgroundColor: c.bg, border: `2px solid ${selected ? c.accent : c.border}` }}
      >
        <div className="w-full h-full flex flex-col gap-3">
          <div className="flex-1 rounded-lg flex items-center justify-center" style={{ backgroundColor: c.raised, boxShadow: `0 4px 6px ${c.border}, -2px -2px 4px rgba(255,255,255,0.5)` }}>
             <div className="w-8 h-8 rounded-full" style={{ backgroundColor: c.accent, opacity: 0.8 }}></div>
          </div>
          <div className="h-1/3 rounded-lg" style={{ backgroundColor: c.inset, boxShadow: `inset 2px 2px 4px ${c.border}, inset -2px -2px 4px rgba(255,255,255,0.5)` }}></div>
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