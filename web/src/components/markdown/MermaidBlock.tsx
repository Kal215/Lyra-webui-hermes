'use client';

import React, { useEffect, useState, useId, useRef } from 'react';
import { Eye, Code, Copy, Check, Download, AlertCircle } from 'lucide-react';

interface MermaidBlockProps {
  code: string;
}

export const MermaidBlock: React.FC<MermaidBlockProps> = ({ code }) => {
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRawView, setIsRawView] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rawId = useId().replace(/:/g, '_');
  const uniqueId = `mermaid_${rawId}`;

  useEffect(() => {
    let isMounted = true;
    const cleanCode = code.trim();
    if (!cleanCode) return;

    async function renderDiagram() {
      try {
        const mermaidModule = await import('mermaid');
        const mermaid = mermaidModule.default || mermaidModule;

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: 'dark',
          themeVariables: {
            darkMode: true,
            background: '#09090b',
            primaryColor: '#2563eb',
            primaryTextColor: '#f8fafc',
            primaryBorderColor: '#3b82f6',
            lineColor: '#94a3b8',
            secondaryColor: '#1e293b',
            tertiaryColor: '#0f172a',
            fontSize: '13px',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
          }
        });

        const { svg } = await mermaid.render(uniqueId, cleanCode);
        if (isMounted) {
          setSvgHtml(svg);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          // If code is still streaming or has syntax issues, keep error captured
          setError(err?.message || 'Gagal memuat diagram Mermaid');
        }
      }
    }

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [code, uniqueId]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(isRawView ? code : svgHtml || code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadSvg = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!svgHtml) return;
    const blob = new Blob([svgHtml], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagram_${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-4 rounded-xl border border-lyra-accent/20 bg-zinc-950/90 overflow-hidden shadow-lg transition-all">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-900/90 border-b border-white/5 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="font-semibold text-zinc-200">Diagram Alur (Mermaid)</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsRawView(!isRawView)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors text-[11px]"
            title={isRawView ? 'Lihat Visual' : 'Lihat Kode'}
          >
            {isRawView ? <Eye size={12} /> : <Code size={12} />}
            <span>{isRawView ? 'Visual' : 'Kode'}</span>
          </button>

          {!isRawView && svgHtml && (
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors text-[11px]"
              title="Unduh Berkas SVG"
            >
              <Download size={12} />
              <span>SVG</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors text-[11px]"
            title="Salin"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? 'Tersalin' : 'Salin'}</span>
          </button>
        </div>
      </div>

      {/* Body View */}
      <div className="p-4 overflow-x-auto">
        {isRawView ? (
          <pre className="font-mono text-xs text-zinc-300 leading-relaxed overflow-x-auto p-2 bg-zinc-900/50 rounded-lg">
            <code>{code}</code>
          </pre>
        ) : error ? (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-mono">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <div className="flex-1 overflow-hidden">
              <div className="font-semibold mb-1">Menunggu penyelesaian diagram atau sintaks belum valid:</div>
              <pre className="text-[11px] text-zinc-400 overflow-x-auto whitespace-pre-wrap">{code}</pre>
            </div>
          </div>
        ) : svgHtml ? (
          <div
            ref={containerRef}
            className="flex justify-center items-center min-h-[140px] [&>svg]:max-w-full [&>svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
        ) : (
          <div className="flex items-center justify-center py-8 text-zinc-500 text-xs gap-2">
            <div className="h-3 w-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <span>Merender visual diagram...</span>
          </div>
        )}
      </div>
    </div>
  );
};
