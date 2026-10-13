'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Check, Clipboard, Quote } from 'lucide-react';
import { useI18nStore } from '@/i18n';
import { ReasoningAccordion } from './ReasoningAccordion';

interface AutonomousMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  agentName?: string;
  attachments?: any[];
  quotedSnippet?: string;
  thought?: string;
}

interface AutonomousConversationViewProps {
  messages: AutonomousMessage[];
  isStreaming?: boolean;
  onQuoteSnippet?: (snippet: string) => void;
  reasoningNodes?: Record<string, { id: string; thought: string; isStreaming?: boolean }>;
  reasoningOrder?: string[];
  activeReasoningId?: string | null;
}

function InlineCodeBlock({ inline, className, children, ...props }: any) {
  const { language } = useI18nStore();
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
              <span className="text-emerald-400 font-medium">
                {language === 'id' ? 'Tersalin' : 'Copied'}
              </span>
            </>
          ) : (
            <>
              <Clipboard size={11} />
              <span>{language === 'id' ? 'Salin' : 'Copy'}</span>
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

import { createExecutiveMarkdownComponents } from '@/components/markdown/MarkdownComponents';

const markdownComponents = createExecutiveMarkdownComponents();

export const AutonomousConversationView: React.FC<AutonomousConversationViewProps> = ({
  messages,
  isStreaming,
  onQuoteSnippet,
  reasoningNodes = {},
  reasoningOrder = [],
  activeReasoningId = null
}) => {
  const { language } = useI18nStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectionQuote, setSelectionQuote] = useState<{
    text: string;
    top: number;
    left: number;
  } | null>(null);

  // Active thought text compiled from reasoning nodes
  const activeThoughtText = reasoningOrder
    .map((id) => reasoningNodes[id]?.thought)
    .filter(Boolean)
    .join('\n\n');

  const hasPendingAssistantTurn = isStreaming && messages.length > 0 && messages[messages.length - 1].role === 'user';

  // Listen to mouseup inside assistant response messages to display quote toolbar
  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setSelectionQuote(null);
      return;
    }

    const selectedText = sel.toString().trim();
    if (selectedText.length < 3) {
      setSelectionQuote(null);
      return;
    }

    // Verify that selection is inside an assistant message
    const anchorNode = sel.anchorNode;
    const assistantEl = anchorNode?.parentElement?.closest('[data-message-role="assistant"]');
    if (!assistantEl) {
      setSelectionQuote(null);
      return;
    }

    try {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();

      if (containerRect) {
        const top = Math.max(10, rect.top - containerRect.top - 40);
        const left = Math.max(10, Math.min(containerRect.width - 170, rect.left - containerRect.left));
        setSelectionQuote({
          text: selectedText,
          top,
          left
        });
      }
    } catch (e) {
      setSelectionQuote(null);
    }
  };

  // Close floating quote bar on outside click
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSelectionQuote(null);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  if (!messages || messages.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      onMouseUp={handleMouseUp}
      className="relative space-y-4 my-4"
    >
      {/* Floating Quote Micro Toolbar */}
      {selectionQuote && (
        <button
          type="button"
          style={{ top: `${selectionQuote.top}px`, left: `${selectionQuote.left}px` }}
          onClick={(e) => {
            e.stopPropagation();
            onQuoteSnippet?.(selectionQuote.text);
            setSelectionQuote(null);
            window.getSelection()?.removeAllRanges();
          }}
          className="absolute z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 shadow-2xl text-zinc-100 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer backdrop-blur-md animate-in fade-in zoom-in-95 text-xs font-medium"
        >
          <Quote size={12} className="text-blue-400" />
          <span>{language === 'id' ? 'Kutip ke Pertanyaan' : 'Quote to Prompt'}</span>
        </button>
      )}

      {messages.map((msg, idx) => {
        const isUser = msg.role === 'user';
        const isAssistant = msg.role === 'assistant';
        const isLatest = idx === messages.length - 1;
        const isLatestAssistant = isAssistant && isLatest;

        // Thought associated with this assistant message
        const messageThought = (isLatestAssistant && activeThoughtText) 
          ? activeThoughtText 
          : (msg.thought || '');

        return (
          <div
            key={msg.id || idx}
            data-message-role={msg.role}
            className={`flex gap-3 p-4 rounded-2xl border transition-all ${
              isUser
                ? 'bg-lyra-accent/10 border-lyra-accent/20 ml-6'
                : 'bg-lyra-surface/70 border-lyra-accent/15 mr-2 shadow-sm'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isUser ? (
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
                  {isUser ? (language === 'id' ? 'Anda' : 'You') : (msg.agentName || 'Lyra Specialist')}
                </span>
                {msg.timestamp && (
                  <span className="text-[10px] text-lyra-text-secondary/60 font-mono">
                    {msg.timestamp}
                  </span>
                )}
              </div>

              {/* 1. Prompt dari user: Quoted Snippet Indicator */}
              {isUser && msg.quotedSnippet && (
                <div className="mb-2 px-3 py-1.5 rounded-lg border-l-2 border-lyra-accent bg-lyra-accent/10 text-lyra-text-secondary font-mono text-[11px] flex items-start gap-1.5">
                  <Quote size={11} className="text-lyra-accent shrink-0 mt-0.5" />
                  <span className="line-clamp-3 italic">"{msg.quotedSnippet}"</span>
                </div>
              )}

              {/* Format Urutan untuk Asisten:
                  1. prompt dari user (di bubble user sebelumnya)
                  2. agen sedang menyusun respon & mengeksekusi...
                  3. proses penalaran
                  4. jawaban
              */}
              {isAssistant && isStreaming && isLatestAssistant && (
                <div className="flex items-center gap-2 text-xs text-lyra-accent/80 font-mono pl-0.5 my-2 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-lyra-accent shrink-0" />
                  <span>
                    {language === 'id' 
                      ? 'Agen sedang menyusun respon & mengeksekusi...' 
                      : 'Agent is compiling response & executing...'}
                  </span>
                </div>
              )}

              {/* 3. Proses Penalaran */}
              {isAssistant && messageThought && (
                <div className="my-2">
                  <ReasoningAccordion
                    thought={messageThought}
                    isStreaming={isStreaming && isLatestAssistant && Boolean(activeReasoningId)}
                  />
                </div>
              )}

              {/* 4. Jawaban (Markdown Content) */}
              {msg.content && (
                <div className="text-xs text-lyra-text leading-relaxed select-text mt-1">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}

              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {msg.attachments.map((att: any, aIdx: number) => (
                    <span
                      key={aIdx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-lyra-accent/15 border border-lyra-accent/25 text-lyra-text font-mono"
                    >
                      {att.type?.startsWith('image/') ? '🖼️' : '📄'} {att.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Ketika prompt user baru saja dikirim dan respon assistant masih dalam tahap inisiasi */}
      {hasPendingAssistantTurn && (
        <div
          data-message-role="assistant"
          className="flex gap-3 p-4 rounded-2xl border bg-lyra-surface/70 border-lyra-accent/15 mr-2 shadow-sm transition-all"
        >
          <div className="shrink-0 mt-0.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-xs">
              <Bot size={15} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-lyra-text">
                Lyra Specialist
              </span>
            </div>

            {/* 2. Agen sedang menyusun respon & mengeksekusi... */}
            <div className="flex items-center gap-2 text-xs text-lyra-accent/80 font-mono pl-0.5 my-2 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-lyra-accent shrink-0" />
              <span>
                {language === 'id' 
                  ? 'Agen sedang menyusun respon & mengeksekusi...' 
                  : 'Agent is compiling response & executing...'}
              </span>
            </div>

            {/* 3. Proses Penalaran */}
            {activeThoughtText && (
              <div className="my-2">
                <ReasoningAccordion
                  thought={activeThoughtText}
                  isStreaming={true}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
