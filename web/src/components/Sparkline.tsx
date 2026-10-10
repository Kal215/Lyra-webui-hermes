import React from 'react';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  min?: number;
  max?: number;
  className?: string;
}

export function Sparkline({ data, color = '#3b82f6', height = 40, min = 0, max = 100, className = '' }: SparklineProps) {
  if (!data || data.length === 0) return null;

  const width = 100;
  const strokeWidth = 2;
  const padding = strokeWidth;

  const getCoordinates = (val: number, index: number) => {
    const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((val - min) / (max - min)) * (height - padding * 2);
    return `${x},${y}`;
  };

  const points = data.map((val, i) => getCoordinates(val, i)).join(' ');
  const areaPoints = `${padding},${height} ${points} ${width - padding},${height}`;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className={className}>
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#gradient-${color})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
