'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Edit3, 
  HelpCircle, 
  FileCode, 
  FileText,
  Check, 
  X, 
  CornerDownLeft, 
  Loader2, 
  Copy, 
  CheckCheck,
  History,
  RotateCcw,
  GitCompare,
  ChevronLeft,
  ChevronRight,
  Code2,
  Eye,
  Download,
  Printer,
  ChevronDown,
  Monitor,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createExecutiveMarkdownComponents } from '@/components/markdown/MarkdownComponents';
import { useI18nStore } from '@/i18n';

function downloadTextFile(filename: string, content: string) {
  try {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Download error:', e);
  }
}

function printContentToPdf(title: string, content: string) {
  try {
    const printWindow = window.open('', '_blank', 'width=850,height=900');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            @page { size: auto; margin: 15mm; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif; 
              margin: 0; 
              padding: 24px; 
              color: #09090b; 
              background: #ffffff; 
              line-height: 1.6; 
            }
            .header { 
              border-bottom: 2px solid #e4e4e7; 
              padding-bottom: 12px; 
              margin-bottom: 20px; 
              display: flex;
              justify-content: space-between;
              align-items: baseline;
            }
            .title { font-size: 18px; font-weight: 700; font-family: monospace; }
            .date { font-size: 11px; color: #71717a; }
            pre { 
              background: #f4f4f5; 
              border: 1px solid #e4e4e7; 
              border-radius: 8px; 
              padding: 16px; 
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; 
              font-size: 11px; 
              line-height: 1.5; 
              white-space: pre-wrap; 
              word-break: break-all; 
            }
            @media print {
              body { padding: 0; }
              pre { border: none; background: transparent; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${title}</div>
            <div class="date">Lyra Autonomous Studio • ${new Date().toLocaleDateString()}</div>
          </div>
          <pre>${content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  } catch (e) {
    console.error('Print error:', e);
  }
}

export interface FileSnapshot {
  id: string;
  versionNumber: number;
  content: string;
  timestamp: number;
  label?: string;
}

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

interface DiffLine {
  type: 'unchanged' | 'added' | 'removed';
  text: string;
  oldLine?: number;
  newLine?: number;
}

/**
 * Fast prefix/suffix trimmed LCS line diff algorithm (zero external dependencies)
 */
function computeFastLineDiff(oldStr: string, newStr: string): DiffLine[] {
  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');

  let start = 0;
  while (start < oldLines.length && start < newLines.length && oldLines[start] === newLines[start]) {
    start++;
  }

  let oldEnd = oldLines.length - 1;
  let newEnd = newLines.length - 1;
  while (oldEnd >= start && newEnd >= start && oldLines[oldEnd] === newLines[newEnd]) {
    oldEnd--;
    newEnd--;
  }

  const result: DiffLine[] = [];
  for (let i = 0; i < start; i++) {
    result.push({ type: 'unchanged', text: oldLines[i], oldLine: i + 1, newLine: i + 1 });
  }

  const midOld = oldLines.slice(start, oldEnd + 1);
  const midNew = newLines.slice(start, newEnd + 1);

  if (midOld.length > 0 || midNew.length > 0) {
    const dp = Array(midOld.length + 1).fill(null).map(() => Array(midNew.length + 1).fill(0));
    for (let i = 0; i < midOld.length; i++) {
      for (let j = 0; j < midNew.length; j++) {
        if (midOld[i] === midNew[j]) {
          dp[i + 1][j + 1] = dp[i][j] + 1;
        } else {
          dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
      }
    }

    let i = midOld.length;
    let j = midNew.length;
    const midRes: DiffLine[] = [];
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && midOld[i - 1] === midNew[j - 1]) {
        midRes.unshift({ type: 'unchanged', text: midOld[i - 1], oldLine: start + i, newLine: start + j });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        midRes.unshift({ type: 'added', text: midNew[j - 1], newLine: start + j });
        j--;
      } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
        midRes.unshift({ type: 'removed', text: midOld[i - 1], oldLine: start + i });
        i--;
      }
    }
    result.push(...midRes);
  }

  for (let i = 0; i < (oldLines.length - 1 - oldEnd); i++) {
    const oldIdx = oldEnd + 1 + i;
    const newIdx = newEnd + 1 + i;
    result.push({ type: 'unchanged', text: oldLines[oldIdx], oldLine: oldIdx + 1, newLine: newIdx + 1 });
  }

  return result;
}

function formatSnapshotTime(timestamp: number): string {
  try {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  } catch (e) {
    return '';
  }
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

  // Snapshot History (Time-Machine) State
  const storageKey = useMemo(() => `lyra_canvas_snaps_${encodeURIComponent(filePath)}`, [filePath]);
  const [snapshots, setSnapshots] = useState<FileSnapshot[]>([]);
  const [activeVersionIndex, setActiveVersionIndex] = useState<number>(0);
  const [diffCompareTarget, setDiffCompareTarget] = useState<'prev' | 'latest'>('prev');

  // Preview & Export State (Phase 3)
  const isHtml = fileName.endsWith('.html') || fileName.endsWith('.htm');
  const isSvg = fileName.endsWith('.svg');
  const isMarkdown = fileName.endsWith('.md') || fileName.endsWith('.markdown');
  const isPreviewable = isHtml || isSvg || isMarkdown;

  const [viewMode, setViewMode] = useState<'code' | 'diff' | 'preview'>('code');
  const [previewDevice, setPreviewDevice] = useState<'full' | 'tablet' | 'mobile'>('full');
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    if (isExportMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [isExportMenuOpen]);

  // Initialize or synchronize snapshot history for current file
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: FileSnapshot[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const last = parsed[parsed.length - 1];
          // If the disk/active content is different from the last snapshot, record a new snapshot
          if (last.content !== content) {
            const nextVer = last.versionNumber + 1;
            const newSnap: FileSnapshot = {
              id: `v${nextVer}`,
              versionNumber: nextVer,
              content,
              timestamp: Date.now(),
              label: language === 'id' ? 'Diperbarui' : 'Updated'
            };
            const updated = [...parsed, newSnap].slice(-25);
            localStorage.setItem(storageKey, JSON.stringify(updated));
            setSnapshots(updated);
            setActiveVersionIndex(updated.length - 1);
            return;
          } else {
            setSnapshots(parsed);
            setActiveVersionIndex(parsed.length - 1);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load canvas snapshots:', e);
    }

    // Default initial snapshot
    const initialSnap: FileSnapshot = {
      id: 'v1',
      versionNumber: 1,
      content,
      timestamp: Date.now(),
      label: language === 'id' ? 'Inisial' : 'Initial'
    };
    setSnapshots([initialSnap]);
    setActiveVersionIndex(0);
    try {
      localStorage.setItem(storageKey, JSON.stringify([initialSnap]));
    } catch (e) {}
  }, [filePath, storageKey]);

  // Derived state for current snapshot
  const currentSnapshot = snapshots[activeVersionIndex] || snapshots[snapshots.length - 1] || null;
  const isLatestVersion = activeVersionIndex === snapshots.length - 1;
  const displayedContent = currentSnapshot ? currentSnapshot.content : content;

  // Selection & floating bar state (only operable on latest version to prevent conflicts)
  const [selection, setSelection] = useState<SelectionRange | null>(null);
  const [activeAction, setActiveAction] = useState<'none' | 'prompt' | 'diff' | 'explain'>('none');
  const [promptInput, setPromptInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // In-line Diff & explanation results
  const [diffResult, setDiffResult] = useState<{
    original: string;
    replacement: string;
  } | null>(null);
  const [explanationResult, setExplanationResult] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Split lines for line numbers
  const lines = displayedContent.split('\n');

  // Compute visual diff between versions for Time-Machine Diff view
  const computedVersionDiff = useMemo<DiffLine[]>(() => {
    if (viewMode !== 'diff' || snapshots.length === 0) return [];

    const activeSnap = snapshots[activeVersionIndex];
    if (!activeSnap) return [];

    let baseSnap: FileSnapshot | null = null;
    if (diffCompareTarget === 'latest') {
      baseSnap = snapshots[snapshots.length - 1];
    } else {
      // Compare with previous version if available, otherwise latest
      if (activeVersionIndex > 0) {
        baseSnap = snapshots[activeVersionIndex - 1];
      } else {
        baseSnap = snapshots[snapshots.length - 1];
      }
    }

    if (!baseSnap || baseSnap.id === activeSnap.id) {
      // If comparing with itself, return unchanged lines
      return activeSnap.content.split('\n').map((line, idx) => ({
        type: 'unchanged',
        text: line,
        oldLine: idx + 1,
        newLine: idx + 1
      }));
    }

    return computeFastLineDiff(baseSnap.content, activeSnap.content);
  }, [viewMode, snapshots, activeVersionIndex, diffCompareTarget]);

  // Handle selection on mouse up (active only on latest version)
  const handleMouseUp = () => {
    if (!isLatestVersion) return;
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

  // Apply surgical diff replacement to file & create new snapshot
  const handleApplyDiff = async () => {
    if (!diffResult) return;

    const { original, replacement } = diffResult;
    const newContent = content.replace(original, replacement);

    // Save and create snapshot
    const lastSnap = snapshots[snapshots.length - 1];
    const nextVer = (lastSnap?.versionNumber || snapshots.length) + 1;
    const newSnap: FileSnapshot = {
      id: `v${nextVer}`,
      versionNumber: nextVer,
      content: newContent,
      timestamp: Date.now(),
      label: language === 'id' ? 'AI Surgical Patch' : 'AI Surgical Patch'
    };

    const updatedSnapshots = [...snapshots, newSnap].slice(-25);
    setSnapshots(updatedSnapshots);
    setActiveVersionIndex(updatedSnapshots.length - 1);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedSnapshots));
    } catch (e) {}

    onContentChange(newContent);

    // Persist to disk if save handler provided
    if (onSaveToFile) {
      setSaveStatus(language === 'id' ? 'Menyimpan berkas...' : 'Saving file...');
      const ok = await onSaveToFile(filePath, newContent);
      if (ok) {
        setSaveStatus(language === 'id' ? '✓ Tersimpan (v' + nextVer + ')' : '✓ Saved (v' + nextVer + ')');
      } else {
        setSaveStatus(language === 'id' ? 'Gagal menyimpan' : 'Save failed');
      }
      setTimeout(() => setSaveStatus(null), 2500);
    }

    // Reset selection and action state
    setDiffResult(null);
    setSelection(null);
    setActiveAction('none');
    setPromptInput('');
  };

  // Rollback to historic snapshot (Time-Machine 1-Click Restore)
  const handleRollbackToActiveVersion = async () => {
    if (isLatestVersion || !currentSnapshot) return;

    const restoredContent = currentSnapshot.content;
    const lastSnap = snapshots[snapshots.length - 1];
    const nextVer = (lastSnap?.versionNumber || snapshots.length) + 1;
    const newSnap: FileSnapshot = {
      id: `v${nextVer}`,
      versionNumber: nextVer,
      content: restoredContent,
      timestamp: Date.now(),
      label: language === 'id' ? `Dipulihkan dari v${currentSnapshot.versionNumber}` : `Restored from v${currentSnapshot.versionNumber}`
    };

    const updatedSnapshots = [...snapshots, newSnap].slice(-25);
    setSnapshots(updatedSnapshots);
    setActiveVersionIndex(updatedSnapshots.length - 1);
    setViewMode('code');
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedSnapshots));
    } catch (e) {}

    onContentChange(restoredContent);

    if (onSaveToFile) {
      setSaveStatus(language === 'id' ? 'Memulihkan & menyimpan berkas...' : 'Restoring & saving file...');
      const ok = await onSaveToFile(filePath, restoredContent);
      if (ok) {
        setSaveStatus(language === 'id' ? `✓ Dipulihkan ke v${currentSnapshot.versionNumber}` : `✓ Restored to v${currentSnapshot.versionNumber}`);
      } else {
        setSaveStatus(language === 'id' ? 'Gagal memulihkan' : 'Restore failed');
      }
      setTimeout(() => setSaveStatus(null), 2500);
    }
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

      {/* Version History Slider & Time-Machine Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-zinc-900/95 border-b border-zinc-800 text-[11px] gap-2 select-none shrink-0 backdrop-blur-md">
        {/* Left: Time-Machine Version Stepper */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-zinc-400 font-medium">
            <History size={12} className="text-zinc-400" />
            <span className="hidden sm:inline">{language === 'id' ? 'Riwayat' : 'Timeline'}:</span>
          </span>

          {/* Stepper Navigator */}
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-md p-0.5 shadow-sm">
            <button
              type="button"
              disabled={activeVersionIndex <= 0}
              onClick={() => setActiveVersionIndex((prev) => Math.max(0, prev - 1))}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-25 disabled:hover:bg-transparent cursor-pointer transition-colors"
              title={language === 'id' ? 'Versi Sebelumnya' : 'Previous version'}
            >
              <ChevronLeft size={12} />
            </button>

            <div className="flex items-center gap-1.5 px-2 font-mono text-[11px]">
              <span className="text-zinc-100 font-semibold">
                v{currentSnapshot?.versionNumber || 1}
              </span>
              {isLatestVersion ? (
                <span className="px-1 py-0.2 text-[9px] rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-sans">
                  {language === 'id' ? 'Terkini' : 'Latest'}
                </span>
              ) : (
                <span className="px-1 py-0.2 text-[9px] rounded bg-amber-950/80 text-amber-400 border border-amber-800/60 font-sans">
                  {language === 'id' ? 'Snapshot' : 'Snapshot'}
                </span>
              )}
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-500 font-mono text-[10px]">
                {snapshots.length}
              </span>
            </div>

            <button
              type="button"
              disabled={isLatestVersion}
              onClick={() => setActiveVersionIndex((prev) => Math.min(snapshots.length - 1, prev + 1))}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-25 disabled:hover:bg-transparent cursor-pointer transition-colors"
              title={language === 'id' ? 'Versi Selanjutnya' : 'Next version'}
            >
              <ChevronRight size={12} />
            </button>
          </div>

          {/* Timestamp & Label */}
          {currentSnapshot && (
            <span className="text-zinc-500 text-[10px] hidden md:inline-block">
              {formatSnapshotTime(currentSnapshot.timestamp)} • {currentSnapshot.label || 'Snapshot'}
            </span>
          )}
        </div>

        {/* Right: Mode Toggle (Code | Preview | Diff), Rollback & Export */}
        <div className="flex items-center gap-2">
          {/* Mode Switch (Code vs Preview vs Diff) */}
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-md p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('code')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                viewMode === 'code' 
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Code2 size={11} />
              <span>{language === 'id' ? 'Kode' : 'Code'}</span>
            </button>
            {isPreviewable && (
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  viewMode === 'preview' 
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Eye size={11} />
                <span>Preview</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setViewMode('diff')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                viewMode === 'diff' 
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <GitCompare size={11} />
              <span>{language === 'id' ? 'Diff' : 'Diff'}</span>
            </button>
          </div>

          {/* Quick Export Dropdown */}
          <div ref={exportMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium cursor-pointer transition-colors shadow-sm"
              title={language === 'id' ? 'Menu Ekspor Berkas' : 'Export File Menu'}
            >
              <Download size={11} className="text-zinc-400" />
              <span>{language === 'id' ? 'Ekspor' : 'Export'}</span>
              <ChevronDown size={10} className="text-zinc-400 ml-0.5" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-zinc-900 border border-zinc-700 shadow-2xl rounded-xl py-1 z-50 animate-in fade-in zoom-in-95 font-sans text-xs">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(displayedContent);
                    setSaveStatus(language === 'id' ? '✓ Teks disalin ke clipboard' : '✓ Copied to clipboard');
                    setTimeout(() => setSaveStatus(null), 2500);
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white text-left cursor-pointer transition-colors"
                >
                  <Copy size={13} className="text-zinc-400" />
                  <span>{language === 'id' ? 'Salin Kode Teks' : 'Copy Raw Text'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    downloadTextFile(fileName, displayedContent);
                    setSaveStatus(language === 'id' ? `✓ Mengunduh ${fileName}` : `✓ Downloading ${fileName}`);
                    setTimeout(() => setSaveStatus(null), 2500);
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white text-left cursor-pointer transition-colors"
                >
                  <Download size={13} className="text-emerald-400" />
                  <span>{language === 'id' ? 'Unduh Berkas' : 'Download File'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    printContentToPdf(fileName, displayedContent);
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white text-left cursor-pointer transition-colors"
                >
                  <Printer size={13} className="text-blue-400" />
                  <span>{language === 'id' ? 'Cetak ke PDF' : 'Print to PDF'}</span>
                </button>

                <div className="my-1 border-t border-zinc-800" />

                <button
                  type="button"
                  onClick={async () => {
                    setIsExportMenuOpen(false);
                    setSaveStatus(language === 'id' ? '⏳ Mengompilasi PowerPoint...' : '⏳ Compiling PowerPoint...');
                    try {
                      const res = await fetch('/api/workspace/export-doc', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          type: 'pptx',
                          title: fileName.replace(/\.[^/.]+$/, ''),
                          content: displayedContent
                        })
                      });
                      const data = await res.json();
                      if (data.success) {
                        const link = document.createElement('a');
                        link.href = `/api/workspace/file?path=${encodeURIComponent('workspace/' + data.fileName)}&download=true`;
                        link.download = data.fileName;
                        link.click();
                        setSaveStatus(language === 'id' ? `✓ Berhasil: ${data.fileName}` : `✓ Exported: ${data.fileName}`);
                      } else {
                        setSaveStatus(language === 'id' ? '✗ Gagal ekspor PPTX' : '✗ PPTX export failed');
                      }
                    } catch (e) {
                      setSaveStatus(language === 'id' ? '✗ Gagal ekspor PPTX' : '✗ PPTX export failed');
                    }
                    setTimeout(() => setSaveStatus(null), 3000);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white text-left cursor-pointer transition-colors"
                >
                  <FileText size={13} className="text-amber-400" />
                  <span>{language === 'id' ? 'Ekspor ke PowerPoint (.pptx)' : 'Export as PowerPoint (.pptx)'}</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setIsExportMenuOpen(false);
                    setSaveStatus(language === 'id' ? '⏳ Mengompilasi Word (.docx)...' : '⏳ Compiling Word (.docx)...');
                    try {
                      const res = await fetch('/api/workspace/export-doc', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          type: 'docx',
                          title: fileName.replace(/\.[^/.]+$/, ''),
                          content: displayedContent
                        })
                      });
                      const data = await res.json();
                      if (data.success) {
                        const link = document.createElement('a');
                        link.href = `/api/workspace/file?path=${encodeURIComponent('workspace/' + data.fileName)}&download=true`;
                        link.download = data.fileName;
                        link.click();
                        setSaveStatus(language === 'id' ? `✓ Berhasil: ${data.fileName}` : `✓ Exported: ${data.fileName}`);
                      } else {
                        setSaveStatus(language === 'id' ? '✗ Gagal ekspor DOCX' : '✗ DOCX export failed');
                      }
                    } catch (e) {
                      setSaveStatus(language === 'id' ? '✗ Gagal ekspor DOCX' : '✗ DOCX export failed');
                    }
                    setTimeout(() => setSaveStatus(null), 3000);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white text-left cursor-pointer transition-colors"
                >
                  <FileText size={13} className="text-indigo-400" />
                  <span>{language === 'id' ? 'Ekspor ke Word (.docx)' : 'Export as Word (.docx)'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Rollback Button (Visible only when viewing older snapshot) */}
          {!isLatestVersion && (
            <button
              type="button"
              onClick={handleRollbackToActiveVersion}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium text-[11px] cursor-pointer shadow-sm transition-colors"
              title={language === 'id' ? 'Pulihkan file ke versi ini' : 'Restore file to this version'}
            >
              <RotateCcw size={11} />
              <span>{language === 'id' ? `Pulihkan v${currentSnapshot?.versionNumber}` : `Restore v${currentSnapshot?.versionNumber}`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Historic Snapshot Banner (Read-Only Warning) */}
      {!isLatestVersion && viewMode === 'code' && (
        <div className="bg-amber-950/40 border-b border-amber-900/50 px-3 py-1 flex items-center justify-between text-[11px] text-amber-300 shrink-0">
          <span>
            {language === 'id' 
              ? `⚠️ Menampilkan pratinjau snapshot riwayat (v${currentSnapshot?.versionNumber}). In-line editing dinonaktifkan.` 
              : `⚠️ Viewing historic snapshot (v${currentSnapshot?.versionNumber}). In-line editing is disabled.`}
          </span>
          <button 
            type="button" 
            onClick={() => setActiveVersionIndex(snapshots.length - 1)}
            className="underline hover:text-amber-200 cursor-pointer font-sans"
          >
            {language === 'id' ? 'Kembali ke Terkini' : 'Jump to Latest'}
          </button>
        </div>
      )}

      {/* Floating Canvas Action Bar (Active on selection in latest version) */}
      {selection && activeAction === 'none' && !isLoading && isLatestVersion && (
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
      {selection && activeAction === 'prompt' && isLatestVersion && (
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

      {/* Visual Diff Review Bar for in-line edits */}
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

      {/* Body: Mode Kode vs Mode Preview vs Mode Diff */}
      {viewMode === 'code' ? (
        <div 
          onMouseUp={handleMouseUp}
          className="flex-1 overflow-auto flex select-text bg-zinc-950"
        >
          {/* Line Numbers Gutter */}
          <div className="select-none py-4 px-3 text-right bg-zinc-950/80 border-r border-zinc-800/80 text-zinc-600 text-[11px] leading-relaxed font-mono shrink-0 min-w-[42px]">
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
              {displayedContent}
            </pre>
          </div>
        </div>
      ) : viewMode === 'preview' ? (
        /* Live Interactive Web Sandbox (Phase 3) */
        <div className="flex-1 overflow-auto flex flex-col bg-zinc-950 select-text">
          {/* Preview Controls Bar */}
          <div className="px-3 py-1.5 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between text-[11px] text-zinc-400 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
                {isHtml ? 'HTML Sandbox' : isSvg ? 'SVG Canvas' : 'Markdown Doc'}
              </span>
              {isHtml && (
                <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-md p-0.5">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('full')}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] cursor-pointer transition-colors ${
                      previewDevice === 'full' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    title={language === 'id' ? 'Tampilan Penuh (Desktop)' : 'Full Viewport'}
                  >
                    <Monitor size={10} />
                    <span>100%</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('tablet')}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] cursor-pointer transition-colors ${
                      previewDevice === 'tablet' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    title={language === 'id' ? 'Tampilan Tablet (768px)' : 'Tablet Width'}
                  >
                    <span>768px</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] cursor-pointer transition-colors ${
                      previewDevice === 'mobile' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    title={language === 'id' ? 'Tampilan Seluler (375px)' : 'Mobile Width'}
                  >
                    <Smartphone size={10} />
                    <span>375px</span>
                  </button>
                </div>
              )}
            </div>

            {isHtml && (
              <button
                type="button"
                onClick={() => setIframeKey((k) => k + 1)}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 cursor-pointer"
                title={language === 'id' ? 'Muat Ulang Iframe' : 'Reload Iframe'}
              >
                <RefreshCw size={11} />
                <span>{language === 'id' ? 'Muat Ulang' : 'Reload'}</span>
              </button>
            )}
          </div>

          {/* Sandbox Render Container */}
          <div className="flex-1 overflow-auto flex justify-center items-stretch p-3 bg-zinc-950">
            {isHtml ? (
              <div className={`h-full transition-all duration-200 overflow-hidden ${
                previewDevice === 'tablet' ? 'w-[768px] border-x border-zinc-800 bg-white rounded-lg shadow-2xl' :
                previewDevice === 'mobile' ? 'w-[375px] border-x border-zinc-800 bg-white rounded-lg shadow-2xl' :
                'w-full bg-white rounded-lg shadow'
              }`}>
                <iframe
                  key={iframeKey}
                  title={fileName}
                  srcDoc={displayedContent}
                  sandbox="allow-scripts allow-modals allow-same-origin"
                  className="w-full h-full border-0 rounded-lg"
                />
              </div>
            ) : isSvg ? (
              <div className="w-full h-full overflow-auto flex items-center justify-center p-6 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]">
                <div 
                  className="max-w-full max-h-full p-4 rounded-xl border border-zinc-800 bg-zinc-900/70 shadow-2xl flex items-center justify-center overflow-auto"
                  dangerouslySetInnerHTML={{ __html: displayedContent }}
                />
              </div>
            ) : (
              <div className="w-full h-full overflow-auto p-6 font-sans select-text text-zinc-200">
                <div className="max-w-3xl mx-auto text-xs leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={createExecutiveMarkdownComponents()}>
                    {displayedContent}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Visual Diff Mode (Time-Machine Comparison) */
        <div className="flex-1 overflow-auto flex flex-col select-text bg-zinc-950">
          {/* Diff sub-header selector */}
          <div className="px-4 py-2 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between text-[11px] text-zinc-400">
            <span>
              {language === 'id' ? 'Membandingkan: ' : 'Comparing: '}
              <span className="text-zinc-200 font-semibold font-mono">v{currentSnapshot?.versionNumber}</span>
              {' '}
              {language === 'id' ? 'dengan' : 'against'}
              {' '}
              <span className="text-zinc-200 font-semibold font-mono">
                {diffCompareTarget === 'prev' 
                  ? (activeVersionIndex > 0 ? `v${snapshots[activeVersionIndex - 1]?.versionNumber}` : `v${snapshots[snapshots.length - 1]?.versionNumber} (Terkini)`)
                  : `v${snapshots[snapshots.length - 1]?.versionNumber} (Terkini)`}
              </span>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDiffCompareTarget('prev')}
                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer transition-colors ${
                  diffCompareTarget === 'prev' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {language === 'id' ? 'vs Versi Sebelumnya' : 'vs Previous'}
              </button>
              <button
                type="button"
                onClick={() => setDiffCompareTarget('latest')}
                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer transition-colors ${
                  diffCompareTarget === 'latest' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {language === 'id' ? 'vs Versi Terkini' : 'vs Latest'}
              </button>
            </div>
          </div>

          {/* Diff Lines Table */}
          <div className="flex-1 overflow-auto">
            {computedVersionDiff.map((diffLine, idx) => {
              if (diffLine.type === 'added') {
                return (
                  <div key={idx} className="flex bg-emerald-950/25 text-emerald-300 hover:bg-emerald-950/40 leading-relaxed font-mono text-xs">
                    <span className="w-12 py-0.5 px-2 text-right text-zinc-600 bg-zinc-950/80 select-none border-r border-zinc-800 text-[11px] shrink-0">
                      {diffLine.newLine}
                    </span>
                    <span className="w-6 py-0.5 text-center text-emerald-400 font-bold select-none shrink-0">+</span>
                    <span className="py-0.5 px-2 whitespace-pre overflow-x-auto flex-1 font-mono text-xs">{diffLine.text}</span>
                  </div>
                );
              }
              if (diffLine.type === 'removed') {
                return (
                  <div key={idx} className="flex bg-rose-950/25 text-rose-300 hover:bg-rose-950/40 leading-relaxed font-mono text-xs">
                    <span className="w-12 py-0.5 px-2 text-right text-zinc-600 bg-zinc-950/80 select-none border-r border-zinc-800 text-[11px] shrink-0">
                      {diffLine.oldLine}
                    </span>
                    <span className="w-6 py-0.5 text-center text-rose-400 font-bold select-none shrink-0">-</span>
                    <span className="py-0.5 px-2 whitespace-pre overflow-x-auto flex-1 font-mono text-xs">{diffLine.text}</span>
                  </div>
                );
              }
              return (
                <div key={idx} className="flex text-zinc-300 hover:bg-zinc-900/40 leading-relaxed font-mono text-xs">
                  <span className="w-12 py-0.5 px-2 text-right text-zinc-600 bg-zinc-950/80 select-none border-r border-zinc-800 text-[11px] shrink-0">
                    {diffLine.newLine || diffLine.oldLine}
                  </span>
                  <span className="w-6 py-0.5 text-center text-zinc-600 select-none shrink-0"> </span>
                  <span className="py-0.5 px-2 whitespace-pre overflow-x-auto flex-1 font-mono text-xs text-zinc-400">{diffLine.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
