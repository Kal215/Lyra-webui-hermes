'use client';

import React from 'react';
import { cn } from './NeoPanel';
import { useTactileSound } from '@/hooks/use-tactile-sound';

interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'raised' | 'flat' | 'inset';
  children: React.ReactNode;
}

export function NeoButton({ 
  variant = 'raised', 
  className, 
  children, 
  onClick,
  onPointerDown,
  ...props 
}: NeoButtonProps) {
  const { playPress, playClick } = useTactileSound();

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    playPress();
    if (onPointerDown) onPointerDown(e);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playClick();
    if (onClick) onClick(e);
  };

  return (
    <button
      className={cn(
        "flex items-center justify-center font-medium transition-all duration-200 select-none",
        variant === 'raised' && "bg-lyra-surface shadow-neo text-lyra-text hover:shadow-neo-shallow-inset hover:bg-lyra-surface-inset active:shadow-neo-active-inset active:translate-y-[1px]",
        variant === 'inset' && "bg-lyra-surface-inset shadow-neo-inset text-lyra-text",
        variant === 'flat' && "bg-transparent text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-surface-raised/30 active:bg-lyra-surface-inset active:shadow-neo-inset active:translate-y-[1px]",
        !className?.includes('rounded') && "rounded-lyra-md",
        className
      )}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      {...props}
    >
      {children}
    </button>
  );
}
