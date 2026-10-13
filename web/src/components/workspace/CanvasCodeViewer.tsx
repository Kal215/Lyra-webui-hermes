'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Edit3, 
  HelpCircle, 
  FileCode, 
  Check, 
  X, 
  CornerDownLeft, 
  Loader2, 
  Copy, 
  CheckCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useI18nStore } from '@/i18n';

interface CanvasCodeViewerProps {
  filePath: string;
  fileName: string;
  content: string;
  onContentChange: (newContent: string) => void;
  onSaveToFile?: (path: string, newContent: string) => Promise<boolean>;
}

interface SelectionRange {
  text: string;
  top: number;
  left: number;
}

export function CanvasCodeViewer({
  filePath,
  fileName,
  content,
  onContentChange,
  onSaveToFile
}: CanvasCodeViewerProps) {
  const { language } = useI18nStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const codePreRef = useRef<HTMLPreElement>(null);

  // Selection & floating bar state
  const [selection, setSelection] = useState<SelectionRange | null>(null);
  const [activeAction, setActiveAction] = useState<'none' | 'prompt' | 'diff' | 'explain'>('none');
  const [promptInput, setPromptInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Diff & explanation results
  const [diffResult, setDiffResult] = useState<{
    original: string;
    replacement: string;
  } | null>(null);
  const [explanationResult, setExplanationResult] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Split lines for line numbers
  const lines = content.split('\n');

  // Handle selection on mouse up
  const handleMouseUp = () => {
    // If modal/action is already open and busy, avoid interrupting
    if (activeAction !== 'none') return;

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setSelection(null);
      return;
    }

    const selectedStr = sel.toString().trim();
    if (selectedStr.length < 3) {
      setSelection(null);
      return;
    }

    try {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();

      if (containerRect) {
        // Calculate relative coordinates
        const top = Math.max(10, rect.top - containerRect.top - 44);
        const left = Math.max(10, Math.min(containerRect.width - 240, rect.left - containerRect.left));

        setSelection({
          text: selectedStr,
          top,
          left
        });
      }
    } catch (e) {
      setSelection(null);
    }
  };

  // Close toolbar on click outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (activeAction !== 'none') return;
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSelection(null);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [activeAction]);

  // Execute in-line canvas request
  const handleExecuteAction = async (actionType: 'edit' | 'explain' | 'docs' | 'optimize', customInstruction?: string) => {
    if (!selection?.text) return;
    setIsLoading(true);
    setErrorMessage(null);

    let finalInstruction = customInstruction || promptInput.trim();
    if (actionType === 'explain') {
      finalInstruction = finalInstruction || (language === 'id' ? 'Jelaskan logika dan fungsionalitas potongan kode ini secara teknis' : 'Explain the technical logic and functionality of this code snippet');
    } else if (actionType === 'docs') {
      finalInstruction = finalInstruction || (language === 'id' ? 'Tambahkan dokumentasi JSDoc/komentar formal dan anotasi tipe yang tepat' : 'Add formal JSDoc/comments and exact type annotations');
    } else if (actionType === 'optimize') {
      finalInstruction = finalInstruction || (language === 'id' ? 'Optimasi performa dan sederhanakan kode ini tanpa mengubah fungsionalitasnya' : 'Optimize performance and clean up code without altering behavior');
    }

    try {
      const res = await fetch('/api/workspace/canvas-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath,
          fullContent: content,
          selectedSnippet: selection.text,
          instruction: finalInstruction,
          actionType: actionType === 'explain' ? 'explain' : 'edit',
          language
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process in-line edit');
      }

      if (actionType === 'explain') {
        setExplanationResult(data.explanation || data.replacementSnippet);
        setActiveAction('explain');
      } else {
        setDiffResult({
          original: selection.text,
          replacement: data.replacementSnippet
        });
        setActiveAction('diff');
      }
    } catch (err: any) {
      console.error('Canvas edit error:', err);
      setErrorMessage(err.message || 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply diff replacement to file
  const handleApplyDiff = async () => {
    if (!diffResult) return;

    const { original, replacement } = diffResult;
    // Perform exact replacement
    const newContent = content.replace(original, replacement);
    onContentChange(newContent);

    // Persist to disk if save handler provided
    if (onSaveToFile) {
      setSaveStatus(language === 'id' ? 'Menyimpan...' : 'Saving...');
      const ok = await onSaveToFile(filePath, newContent);
      if (ok) {
        setSaveStatus(language === 'id' ? '✓ Tersimpan ke berkas' : '✓ Saved to file');
      } else {
        setSaveStatus(language === 'id' ? 'Gagal menyimpan' : 'Save failed');
      }
      setTimeout(() => setSaveStatus(null), 2500);
    }

    // Reset state
    setDiffResult(null);
    setSelection(null);
    setActiveAction('none');
    setPromptInput('');
  };

  // Discard diff or close explanation
  const handleDiscard = () => {
    setDiffResult(null);
    setExplanationResult(null);
    setActiveAction('none');
    setSelection(null);
    setPromptInput('');
    setErrorMessage(null);
  };

  return (
    <div ref={containerRef} className="relative flex flex-col h-full w-full bg-zinc-950 text-zinc-100 font-mono text-xs select-text overflow-hidden">
      {/* Save Status Notification */}
      {saveStatus && (
        <div className="absolute top-2 right-4 z-40 px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 text-[11px] shadow-lg animate-fade-in flex items-center gap-1.5 font-mono">
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Floating Canvas Action Bar */}
      {selection && activeAction === 'none' && !isLoading && (
        <div 
          style={{ top: `${selection.top}px`, left: `${selection.left}px` }}
          className="absolute z-30 flex items-center gap-1 bg-zinc-900/95 border border-zinc-700/80 shadow-2xl rounded-lg p-1 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            type="button"
            onClick={() => setActiveAction('prompt')}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors cursor-pointer text-[11px] font-medium"
            title={language === 'id' ? 'Edit bagian ini' : 'In-line Edit'}
          >
            <Edit3 size={12} className="text-zinc-400" />
            <span>{language === 'id' ? 'Edit' : 'Edit'}</span>
          </button>

          <div className="w-[1px] h-3 bg-zinc-700 mx-0.5" />

          <button
            type="button"
            onClick={() => handleExecuteAction('explain')}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors cursor-pointer text-[11px]"
            title={language === 'id' ? 'Jelaskan logika bagian ini' : 'Explain snippet'}
          >
            <HelpCircle size={12} className="text-zinc-400" />
            <span>{language === 'id' ? 'Jelaskan' : 'Explain'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleExecuteAction('docs')}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors cursor-pointer text-[11px]"
            title={language === 'id' ? 'Tambahkan tipe & dokumentasi' : 'Add types & docs'}
          >
            <FileCode size={12} className="text-zinc-400" />
            <span>{language === 'id' ? 'Tipe' : 'Types'}</span>
          </button>
        </div>
      )}

      {/* In-Line Prompt Input Popover */}
      {selection && activeAction === 'prompt' && (
        <div 
          style={{ top: `${selection.top}px`, left: `${selection.left}px` }}
          className="absolute z-30 w-80 bg-zinc-900 border border-zinc-700 shadow-2xl rounded-xl p-2.5 backdrop-blur-md animate-in fade-in zoom-in-95"
        >
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (promptInput.trim()) {
                handleExecuteAction('edit', promptInput);
              }
            }}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
              <span>{language === 'id' ? 'Instruksi Transformasi' : 'Targeted Instruction'}</span>
              <button 
                type="button" 
                onClick={handleDiscard}
                className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                autoFocus
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder={language === 'id' ? 'Contoh: Tambahkan type safety, ganti ke async...' : 'e.g. Add type safety, rewrite to async...'}
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 pr-8"
              />
              <button
                type="submit"
                disabled={!promptInput.trim() || isLoading}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-40 cursor-pointer transition-colors"
              >
                <CornerDownLeft size={11} />
              </button>
            </div>

            {errorMessage && (
              <span className="text-[10px] text-rose-400 font-mono">{errorMessage}</span>
            )}
          </form>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div 
          style={{ top: `${selection?.top || 20}px`, left: `${selection?.left || 20}px` }}
          className="absolute z-30 flex items-center gap-2 bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-lg shadow-xl text-zinc-300 text-[11px]"
        >
          <Loader2 size={12} className="animate-spin text-zinc-400" />
          <span>{language === 'id' ? 'Menjalankan patch...' : 'Computing surgical patch...'}</span>
        </div>
      )}

      {/* Visual Diff Review Bar */}
      {diffResult && activeAction === 'diff' && (
        <div className="p-3 border-b border-zinc-800 bg-zinc-900/90 shrink-0 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-300">
              {language === 'id' ? 'Pratinjau Patch (Unified Diff)' : 'Targeted Patch Review'}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleDiscard}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] cursor-pointer flex items-center gap-1"
              >
                <X size={11} />
                <span>{language === 'id' ? 'Batal' : 'Discard'}</span>
              </button>
              <button
                type="button"
                onClick={handleApplyDiff}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold cursor-pointer flex items-center gap-1 shadow-sm"
              >
                <Check size={11} />
                <span>{language === 'id' ? 'Terapkan Perubahan' : 'Apply Patch'}</span>
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 max-h-40 overflow-auto font-mono text-[11px] leading-relaxed">
            <div className="p-1 rounded bg-rose-950/30 text-rose-300/90 border-l-2 border-rose-500 mb-1.5 whitespace-pre-wrap">
              {diffResult.original.split('\n').map((l, i) => (
                <div key={i}>- {l}</div>
              ))}
            </div>
            <div className="p-1 rounded bg-emerald-950/30 text-emerald-300/90 border-l-2 border-emerald-500 whitespace-pre-wrap">
              {diffResult.replacement.split('\n').map((l, i) => (
                <div key={i}>+ {l}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Code Viewer with Line Numbers */}
      <div 
        onMouseUp={handleMouseUp}
        className="flex-1 overflow-auto flex select-text bg-zinc-950"
      >
        {/* Line Numbers Gutter */}
        <div className="select-none py-4 px-3 text-right bg-zinc-950/80 border-r border-zinc-800/80 text-zinc-600 text-[11px] leading-relaxed font-mono shrink-0 min-w-[40px]">
          {lines.map((_, idx) => (
            <div key={idx}>{idx + 1}</div>
          ))}
        </div>

        {/* Code Content Body */}
        <div className="flex-1 p-4 overflow-x-auto">
          <pre 
            ref={codePreRef}
            className="whitespace-pre font-mono text-xs text-zinc-200 leading-relaxed"
          >
            {content}
          </pre>
        </div>
      </div>

      {/* Explanation Drawer */}
      {explanationResult && activeAction === 'explain' && (
        <div className="border-t border-zinc-800 bg-zinc-900/95 max-h-60 overflow-auto p-4 shrink-0 shadow-xl">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
              <HelpCircle size={13} className="text-blue-400" />
              {language === 'id' ? 'Analisis Teknis Kode' : 'Technical Code Analysis'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(explanationResult);
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                }}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                {isCopied ? <CheckCheck size={11} className="text-emerald-400" /> : <Copy size={11} />}
                <span>{isCopied ? (language === 'id' ? 'Tersalin' : 'Copied') : (language === 'id' ? 'Salin' : 'Copy')}</span>
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                className="text-zinc-400 hover:text-zinc-200 p-0.5 rounded cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          </div>
          <div className="text-xs text-zinc-300 leading-relaxed select-text font-sans">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {explanationResult}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
