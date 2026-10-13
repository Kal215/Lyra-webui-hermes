'use client';

import React, { useState } from 'react';
import { MermaidBlock } from './MermaidBlock';
import { VisualChartBlock } from './VisualChartBlock';
import { ExecutiveCallout } from './ExecutiveCallout';
import { SmartActionPill } from './SmartActionPill';
import { Check, Clipboard, ChevronRight } from 'lucide-react';

interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function StandardCodeBlock({ inline, className, children, ...props }: CodeProps) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const lang = (match ? match[1] : '').toLowerCase();
  const codeString = String(children || '').replace(/\n$/, '');

  // 1. Mermaid Flowcharts / Sequence / Architecture
  if (!inline && lang === 'mermaid') {
    return <MermaidBlock code={codeString} />;
  }

  // 2. Interactive Visual Charts (bar, line, donut, kpi)
  if (!inline && (lang === 'chart' || lang === 'json-chart' || lang === 'dataviz')) {
    return <VisualChartBlock code={codeString} />;
  }

  // 3. Inline code
  if (inline) {
    return (
      <code className="px-1.5 py-0.5 rounded bg-black/20 dark:bg-white/10 text-lyra-accent font-mono text-xs border border-lyra-accent/20" {...props}>
        {children}
      </code>
    );
  }

  // 4. Standard Block Code with Copy & Language Tag
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-white/10 bg-zinc-950/90 text-xs font-mono shadow-md">
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-white/5 text-[11px] text-zinc-400">
        <span>{lang || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check size={11} className="text-emerald-400" />
              <span className="text-emerald-400 font-medium">Tersalin</span>
            </>
          ) : (
            <>
              <Clipboard size={11} />
              <span>Salin</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3 overflow-x-auto text-zinc-200 leading-relaxed">
        <pre className="!bg-transparent !p-0 !m-0 !border-none font-mono">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    </div>
  );
}

// Parse smart action syntax in paragraphs / list items: [action:make_slides] Buat Slide ...
function parseActionPills(content: React.ReactNode): React.ReactNode {
  if (typeof content !== 'string') return content;
  const actionRegex = /\[action:([a-zA-Z0-9_\-:]+)\]\s*([^,\n\r\]]+)/g;
  if (!actionRegex.test(content)) return content;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = /\[action:([a-zA-Z0-9_\-:]+)\]\s*([^,\n\r\]]+)/g;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }
    const rawAction = match[1];
    const label = match[2].trim();
    let actionType = rawAction;
    let payload = '';

    if (rawAction.startsWith('prompt:')) {
      actionType = 'prompt';
      payload = rawAction.substring('prompt:'.length);
    }

    parts.push(
      <SmartActionPill
        key={`${match.index}_${rawAction}`}
        actionType={actionType}
        label={label}
        payload={payload}
      />
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return <>{parts}</>;
}

export const createExecutiveMarkdownComponents = (overrides: Record<string, any> = {}) => ({
  code: StandardCodeBlock,
  pre: ({ children }: any) => <>{children}</>,
  blockquote: ({ children }: any) => <ExecutiveCallout>{children}</ExecutiveCallout>,
  a: ({ href, children, ...props }: any) => {
    const isExternal = href?.startsWith('http') || href?.startsWith('//');
    return (
      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 font-semibold underline underline-offset-2 decoration-blue-500/50 hover:decoration-blue-500 transition-colors cursor-pointer inline-flex items-center gap-0.5"
        {...props}
      >
        {children}
      </a>
    );
  },
  h1: ({ children }: any) => <h1 className="text-xl font-bold tracking-tight text-lyra-text mt-6 mb-3 border-b border-lyra-accent/15 pb-2">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-lg font-bold tracking-tight text-lyra-text mt-5 mb-2.5">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-base font-semibold text-lyra-text mt-4 mb-2">{children}</h3>,
  hr: () => <hr className="my-6 border-lyra-accent/15" />,
  strong: ({ children }: any) => <strong className="font-semibold text-lyra-text">{children}</strong>,
  ul: ({ children }: any) => <ul className="list-disc list-outside ml-5 space-y-1.5 my-2.5">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal list-outside ml-5 space-y-1.5 my-2.5">{children}</ol>,
  li: ({ children }: any) => {
    return <li className="leading-relaxed pl-0.5">{parseActionPills(children)}</li>;
  },
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-4 rounded-xl border border-lyra-accent/20 bg-lyra-surface/40 shadow-sm">
      <table className="w-full text-sm text-left border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="bg-lyra-accent/10 border-b border-lyra-accent/20 text-xs font-semibold uppercase text-lyra-text">{children}</thead>,
  th: ({ children }: any) => <th className="px-4 py-3 font-semibold">{children}</th>,
  td: ({ children }: any) => <td className="px-4 py-3 border-t border-lyra-accent/10">{children}</td>,
  details: ({ children }: any) => (
    <details className="group my-3 rounded-xl border border-lyra-accent/20 bg-lyra-surface/40 overflow-hidden transition-all">
      {children}
    </details>
  ),
  summary: ({ children }: any) => (
    <summary className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-lyra-accent/5 cursor-pointer select-none transition-colors">
      <ChevronRight size={14} className="text-zinc-500 transition-transform group-open:rotate-90" />
      <span>{children}</span>
    </summary>
  ),
  p: ({ children }: any) => {
    return <div className="leading-relaxed my-2">{parseActionPills(children)}</div>;
  },
  ...overrides
});
