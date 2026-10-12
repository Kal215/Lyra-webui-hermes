'use client';

import React, { useState } from 'react';
import { Terminal, Download, ExternalLink, ChevronDown, ChevronUp, Copy, Check, Info } from 'lucide-react';
import { useI18nStore } from '@/i18n';

interface HermesInstallBannerProps {
  featureName: string;
}

export function HermesInstallBanner({ featureName }: HermesInstallBannerProps) {
  const { language } = useI18nStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const isId = language === 'id';

  const copyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps = [
    {
      title: isId ? '1. Pasang Hermes Agent CLI' : '1. Install Hermes Agent CLI',
      desc: isId 
        ? 'Hermes memerlukan Python 3.10+ atau paket installer resmi Nous Research.' 
        : 'Hermes requires Python 3.10+ or the official Nous Research package.',
      code: 'curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash'
    },
    {
      title: isId ? '2. Inisialisasi Akun & Konfigurasi' : '2. Initialize & Configure',
      desc: isId 
        ? 'Jalankan setup interaktif untuk menghubungkan provider API (Groq, OpenRouter, atau model lokal).' 
        : 'Run the interactive setup to configure your API providers (Groq, OpenRouter, or local LLMs).',
      code: 'hermes setup'
    },
    {
      title: isId ? '3. Hubungkan ke Lyra Command Center' : '3. Connect to Lyra Command Center',
      desc: isId 
        ? 'Pastikan hermes dapat diakses dari terminal lokal atau server VPS Anda.' 
        : 'Ensure hermes is accessible in your local terminal or VPS server environment.',
      code: 'hermes --version'
    }
  ];

  return (
    <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5 text-lyra-text backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0 mt-0.5">
            <Info size={18} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-lyra-text flex items-center gap-2">
              <span>{isId ? `Memerlukan Hermes Engine untuk ${featureName}` : `Hermes Engine Required for ${featureName}`}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-mono font-medium">
                {isId ? 'Lokal / VPS' : 'Local / VPS'}
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-lyra-text-secondary mt-1 max-w-3xl leading-relaxed">
              {isId
                ? `Halaman ini terhubung langsung ke sistem eksekusi lokal/VPS Hermes. Karena Anda sedang mengakses dari cloud (Vercel) atau Hermes belum terpasang di host ini, fitur ${featureName} berjalan dalam mode pratinjau baca-saja (read-only blueprint).`
                : `This page connects directly to the local/VPS Hermes execution engine. Because you are accessing via cloud (Vercel) or Hermes is not installed on this host, ${featureName} is operating in a read-only blueprint mode.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lyra-surface hover:bg-lyra-accent/15 border border-lyra-accent/20 text-xs font-medium text-lyra-text transition-all cursor-pointer shadow-xs"
          >
            <Terminal size={13} className="text-lyra-accent" />
            <span>{isId ? (isExpanded ? 'Tutup Panduan' : 'Panduan Pasang') : (isExpanded ? 'Hide Guide' : 'Setup Guide')}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          
          <a
            href="https://hermes-agent.nousresearch.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-medium text-amber-500 transition-all cursor-pointer shadow-xs"
          >
            <span>Docs</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Expandable Step-by-Step Installation Guide */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-amber-500/20 space-y-3">
          <div className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-500">
            {isId ? 'Langkah Pemasangan Hermes CLI' : 'Hermes CLI Installation Steps'}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {steps.map((step, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-lyra-bg/70 border border-lyra-accent/10 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-lyra-text">{step.title}</div>
                  <div className="text-[11px] text-lyra-text-secondary mt-1 leading-relaxed">{step.desc}</div>
                </div>

                <div className="mt-3 relative flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5 font-mono text-[11px] text-emerald-400">
                  <span className="truncate pr-6">{step.code}</span>
                  <button
                    type="button"
                    onClick={() => copyCode(step.code, idx)}
                    className="absolute right-1.5 p-1 rounded hover:bg-white/10 text-lyra-text-secondary hover:text-white transition-colors cursor-pointer"
                    title={isId ? 'Salin perintah' : 'Copy command'}
                  >
                    {copiedIndex === idx ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-lyra-text-secondary/80 flex items-center gap-1.5 pt-1">
            <span>💡</span>
            <span>
              {isId
                ? 'Setelah dipasang di komputer lokal atau server Anda, jalankan web Lyra di mesin yang sama untuk sinkronisasi penuh secara otomatis.'
                : 'Once installed on your local PC or VPS, run Lyra web on that machine to automatically achieve full two-way synchronization.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
