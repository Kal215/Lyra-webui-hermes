'use client';

import React from 'react';
import { 
  Lightbulb, 
  AlertTriangle, 
  Info, 
  ShieldAlert, 
  Flame, 
  Sparkles,
  Quote
} from 'lucide-react';

interface ExecutiveCalloutProps {
  children: React.ReactNode;
}

export const ExecutiveCallout: React.FC<ExecutiveCalloutProps> = ({ children }) => {
  // Extract text representation to check for [!TYPE] markers
  const extractText = (node: any): string => {
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(extractText).join('');
    if (node?.props?.children) return extractText(node.props.children);
    return '';
  };

  const rawText = extractText(children).trim();

  // Match GitHub Admonition syntax: [!TYPE] or [!TL;DR] or [!BLUF]
  const match = rawText.match(/^\[!(NOTE|TIP|WARNING|PITFALL|CAUTION|DANGER|IMPORTANT|TL;DR|BLUF)\]/i);

  if (!match) {
    // Normal styled quote
    return (
      <blockquote className="my-3.5 flex items-start gap-3 rounded-r-xl border-l-4 border-lyra-accent/60 bg-lyra-accent/5 px-4 py-3 italic text-lyra-text-secondary">
        <Quote size={16} className="mt-0.5 shrink-0 text-lyra-accent/50 not-italic" />
        <div className="flex-1 not-italic">{children}</div>
      </blockquote>
    );
  }

  const type = match[1].toUpperCase();

  // Filter out the raw [!TYPE] text from rendered children to prevent duplicate display
  const cleanChildren = React.Children.map(children, (child: any) => {
    if (typeof child === 'string') {
      return child.replace(/^\[!(NOTE|TIP|WARNING|PITFALL|CAUTION|DANGER|IMPORTANT|TL;DR|BLUF)\]\s*/i, '');
    }
    if (child?.props?.children) {
      const childText = extractText(child);
      if (childText.startsWith(`[!${type}]`)) {
        // Strip marker from inside the first paragraph/element
        return React.cloneElement(child, {
          children: React.Children.map(child.props.children, (nested: any) => {
            if (typeof nested === 'string') {
              return nested.replace(/^\[!(NOTE|TIP|WARNING|PITFALL|CAUTION|DANGER|IMPORTANT|TL;DR|BLUF)\]\s*/i, '');
            }
            return nested;
          })
        });
      }
    }
    return child;
  });

  if (type === 'TL;DR' || type === 'BLUF') {
    return (
      <div className="my-4 overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
          <Sparkles size={15} className="text-amber-400" />
          <span>Intisari Utama (Bottom Line Up Front)</span>
        </div>
        <div className="text-sm font-medium leading-relaxed text-zinc-100 dark:text-zinc-100">
          {cleanChildren}
        </div>
      </div>
    );
  }

  if (type === 'TIP') {
    return (
      <div className="my-3.5 overflow-hidden rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3.5 shadow-sm">
        <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-emerald-400">
          <Lightbulb size={14} className="text-emerald-400" />
          <span>Rekomendasi Praktis (Tip)</span>
        </div>
        <div className="text-xs leading-relaxed text-zinc-200">
          {cleanChildren}
        </div>
      </div>
    );
  }

  if (type === 'WARNING' || type === 'PITFALL') {
    return (
      <div className="my-3.5 overflow-hidden rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5 shadow-sm">
        <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-amber-400">
          <AlertTriangle size={14} className="text-amber-400" />
          <span>Jebakan Umum & Peringatan (Watch Out)</span>
        </div>
        <div className="text-xs leading-relaxed text-zinc-200">
          {cleanChildren}
        </div>
      </div>
    );
  }

  if (type === 'CAUTION' || type === 'DANGER') {
    return (
      <div className="my-3.5 overflow-hidden rounded-xl border border-rose-500/25 bg-rose-500/5 p-3.5 shadow-sm">
        <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-rose-400">
          <ShieldAlert size={14} className="text-rose-400" />
          <span>Peringatan Kritis (Critical Notice)</span>
        </div>
        <div className="text-xs leading-relaxed text-zinc-200">
          {cleanChildren}
        </div>
      </div>
    );
  }

  if (type === 'IMPORTANT') {
    return (
      <div className="my-3.5 overflow-hidden rounded-xl border border-purple-500/25 bg-purple-500/5 p-3.5 shadow-sm">
        <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-purple-400">
          <Flame size={14} className="text-purple-400" />
          <span>Poin Krusial (Important)</span>
        </div>
        <div className="text-xs leading-relaxed text-zinc-200">
          {cleanChildren}
        </div>
      </div>
    );
  }

  // Default: NOTE
  return (
    <div className="my-3.5 overflow-hidden rounded-xl border border-blue-500/25 bg-blue-500/5 p-3.5 shadow-sm">
      <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-blue-400">
        <Info size={14} className="text-blue-400" />
        <span>Catatan & Konteks Teknis</span>
      </div>
      <div className="text-xs leading-relaxed text-zinc-200">
        {cleanChildren}
      </div>
    </div>
  );
};
