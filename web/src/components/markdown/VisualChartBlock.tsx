'use client';

import React, { useState } from 'react';
import { BarChart3, LineChart, PieChart, Activity, Eye, Code, Copy, Check } from 'lucide-react';

interface ChartItem {
  label: string;
  value: number;
  unit?: string;
  color?: string;
}

interface KpiItem {
  label: string;
  value: string | number;
  change?: string;
  sublabel?: string;
}

interface ChartDataSpec {
  type?: 'bar' | 'line' | 'donut' | 'pie' | 'kpi';
  title?: string;
  subtitle?: string;
  data?: ChartItem[];
  metrics?: KpiItem[];
  categories?: string[];
  series?: Array<{ name: string; data: number[] }>;
}

const PALETTE = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316'  // Orange
];

export const VisualChartBlock: React.FC<{ code: string }> = ({ code }) => {
  const [isRawView, setIsRawView] = useState(false);
  const [copied, setCopied] = useState(false);

  let spec: ChartDataSpec | null = null;
  let parseError: string | null = null;

  try {
    spec = JSON.parse(code.trim());
  } catch (err: any) {
    parseError = err.message;
  }

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };

  if (!spec || parseError) {
    return (
      <div className="my-3 rounded-xl border border-white/10 bg-zinc-950/80 p-3 text-xs font-mono text-zinc-400">
        <div className="text-[11px] text-zinc-500 mb-1">⏳ Menyiapkan visual chart data...</div>
        <pre className="overflow-x-auto text-zinc-300">{code}</pre>
      </div>
    );
  }

  const chartType = spec.type || (spec.metrics ? 'kpi' : 'bar');
  const items = spec.data || [];
  const metrics = spec.metrics || [];

  // Determine Max Value for Scaling Bars / Lines
  const maxValue = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-lyra-accent/20 bg-zinc-950/90 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 bg-zinc-900/90 px-3.5 py-2 text-xs">
        <div className="flex items-center gap-2">
          {chartType === 'line' ? (
            <LineChart size={14} className="text-cyan-400" />
          ) : chartType === 'donut' || chartType === 'pie' ? (
            <PieChart size={14} className="text-purple-400" />
          ) : chartType === 'kpi' ? (
            <Activity size={14} className="text-emerald-400" />
          ) : (
            <BarChart3 size={14} className="text-blue-400" />
          )}
          <span className="font-semibold text-zinc-200">{spec.title || 'Visualisasi Data Interaktif'}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsRawView(!isRawView)}
            className="flex items-center gap-1 rounded bg-white/5 px-2 py-1 text-[11px] text-zinc-300 transition-colors hover:bg-white/10 cursor-pointer"
          >
            {isRawView ? <Eye size={12} /> : <Code size={12} />}
            <span>{isRawView ? 'Visual' : 'JSON'}</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded bg-white/5 px-2 py-1 text-[11px] text-zinc-300 transition-colors hover:bg-white/10 cursor-pointer"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? 'Tersalin' : 'Salin'}</span>
          </button>
        </div>
      </div>

      {spec.subtitle && (
        <div className="px-4 pt-2.5 text-[11px] text-zinc-400 font-medium">
          {spec.subtitle}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {isRawView ? (
          <pre className="overflow-x-auto rounded-lg bg-zinc-900/50 p-3 font-mono text-xs text-zinc-300">
            <code>{JSON.stringify(spec, null, 2)}</code>
          </pre>
        ) : chartType === 'kpi' ? (
          /* KPI Stat Grid Archetype */
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {metrics.map((m, idx) => (
              <div key={idx} className="rounded-xl border border-white/5 bg-zinc-900/60 p-3.5 flex flex-col justify-between">
                <div className="text-[11px] text-zinc-400 font-medium">{m.label}</div>
                <div className="text-2xl font-bold tracking-tight text-white my-1">{m.value}</div>
                {(m.change || m.sublabel) && (
                  <div className="text-[11px] text-emerald-400 font-mono font-medium">
                    {m.change || m.sublabel}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : chartType === 'line' && items.length > 1 ? (
          /* Smooth SVG Line Chart Archetype */
          <div className="py-2">
            <svg viewBox={`0 0 ${items.length * 80} 140`} className="w-full h-40 overflow-visible">
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="20" x2={items.length * 80} y2="20" stroke="#ffffff10" strokeDasharray="3 3" />
              <line x1="0" y1="65" x2={items.length * 80} y2="65" stroke="#ffffff10" strokeDasharray="3 3" />
              <line x1="0" y1="110" x2={items.length * 80} y2="110" stroke="#ffffff15" />

              {/* Area Under Curve */}
              <path
                d={
                  items.reduce((acc, it, idx) => {
                    const x = 40 + idx * 75;
                    const y = 110 - (it.value / maxValue) * 90;
                    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                  }, '') + ` L ${40 + (items.length - 1) * 75} 110 L 40 110 Z`
                }
                fill="url(#lineGrad)"
              />

              {/* Line Polyline */}
              <path
                d={items.reduce((acc, it, idx) => {
                  const x = 40 + idx * 75;
                  const y = 110 - (it.value / maxValue) * 90;
                  return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                }, '')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Dots and Labels */}
              {items.map((it, idx) => {
                const x = 40 + idx * 75;
                const y = 110 - (it.value / maxValue) * 90;
                return (
                  <g key={idx}>
                    <circle cx={x} cy={y} r="4" fill="#3b82f6" stroke="#09090b" strokeWidth="2" />
                    <text x={x} y={y - 8} textAnchor="middle" fill="#93c5fd" fontSize="10" fontFamily="monospace" fontWeight="600">
                      {it.value}{it.unit || ''}
                    </text>
                    <text x={x} y="126" textAnchor="middle" fill="#94a3b8" fontSize="10">
                      {it.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        ) : chartType === 'donut' || chartType === 'pie' ? (
          /* Donut / Breakdown Chart Archetype */
          <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
            <div className="relative w-36 h-36 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {(() => {
                  const total = items.reduce((sum, it) => sum + it.value, 0) || 1;
                  let accAngle = 0;
                  return items.map((it, idx) => {
                    const strokeDash = (it.value / total) * 283;
                    const strokeOffset = 283 - strokeDash;
                    const rotate = (accAngle / total) * 360;
                    accAngle += it.value;
                    const color = it.color || PALETTE[idx % PALETTE.length];
                    return (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="45"
                        fill="transparent"
                        stroke={color}
                        strokeWidth="10"
                        strokeDasharray={`283`}
                        strokeDashoffset={`${strokeOffset}`}
                        transform={`rotate(${rotate} 50 50)`}
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Total</span>
                <span className="text-sm font-bold text-white font-mono">
                  {items.reduce((s, i) => s + i.value, 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Legend Table */}
            <div className="flex-1 w-full space-y-1.5">
              {items.map((it, idx) => {
                const total = items.reduce((sum, i) => sum + i.value, 0) || 1;
                const pct = ((it.value / total) * 100).toFixed(1);
                const color = it.color || PALETTE[idx % PALETTE.length];
                return (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-zinc-900/40">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-zinc-300 font-medium">{it.label}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-zinc-200 font-semibold">{it.value}{it.unit || ''}</span>
                      <span className="text-zinc-400 text-[11px]">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Default: Horizontal Bar Chart Archetype */
          <div className="space-y-3">
            {items.map((it, idx) => {
              const pct = ((it.value / maxValue) * 100).toFixed(0);
              const color = it.color || PALETTE[idx % PALETTE.length];
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-zinc-300">{it.label}</span>
                    <span className="font-mono font-semibold text-zinc-200">
                      {it.value} {it.unit || ''}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800/80">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
