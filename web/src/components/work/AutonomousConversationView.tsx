'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Check, Clipboard } from 'lucide-react';

interface AutonomousMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  agentName?: string;
}

interface AutonomousConversationViewProps {
  messages: AutonomousMessage[];
  isStreaming?: boolean;
}

function InlineCodeBlock({ inline, className, children, ...props }: any) {
  const [copied, setCopied] = React.useState(false);
  const codeString = String(children).replace(/\n$/, '');
  const match = /language-(\w+)/.exec(className || '');
  const languageName = match ? match[1] : '';

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

  if (inline) {
    return (
      <code className="px-1.5 py-0.5 rounded bg-black/20 dark:bg-white/10 text-lyra-accent font-mono text-xs border border-lyra-accent/20" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-white/10 bg-zinc-950/90 text-xs font-mono shadow-md">
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-white/5 text-[11px] text-zinc-400">
        <span>{languageName || 'code'}</span>
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

const markdownComponents = {
  code: InlineCodeBlock,
  pre: ({ children }: any) => <>{children}</>,
  p: ({ children }: any) => {
    const hasBlock = React.Children.toArray(children).some((child: any) => {
      return (
        React.isValidElement(child) &&
        (child.type === InlineCodeBlock || (child.props as any)?.className?.includes('language-'))
      );
    });
    if (hasBlock) {
      return <div className="leading-relaxed my-2">{children}</div>;
    }
    return <p className="leading-relaxed my-2">{children}</p>;
  }
};

export const AutonomousConversationView: React.FC<AutonomousConversationViewProps> = ({
  messages,
  isStreaming
}) => {
  if (!messages || messages.length === 0) return null;

  return (
    <div className="space-y-4 my-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex gap-3 p-4 rounded-2xl border transition-all ${
            msg.role === 'user'
              ? 'bg-lyra-accent/10 border-lyra-accent/20 ml-6'
              : 'bg-lyra-surface/70 border-lyra-accent/15 mr-2 shadow-sm'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {msg.role === 'user' ? (
              <div className="w-7 h-7 rounded-lg bg-lyra-accent text-white flex items-center justify-center shadow-xs">
                <User size={15} />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-xs">
                <Bot size={15} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-lyra-text">
                {msg.role === 'user' ? 'Anda' : (msg.agentName || 'Lyra Specialist')}
              </span>
              {msg.timestamp && (
                <span className="text-[10px] text-lyra-text-secondary/60 font-mono">
                  {msg.timestamp}
                </span>
              )}
            </div>

            <div className="text-xs text-lyra-text leading-relaxed select-text">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      ))}
      {isStreaming && (
        <div className="flex items-center gap-2 text-xs text-lyra-accent/80 font-mono pl-3 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-lyra-accent" />
          <span>Agen sedang menyusun respon & mengeksekusi...</span>
        </div>
      )}
    </div>
  );
};
