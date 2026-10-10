import React from 'react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NeoPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  depth?: 0 | 1 | 2;
  children: React.ReactNode;
}

export function NeoPanel({ depth = 1, className, children, ...props }: NeoPanelProps) {
  return (
    <div 
      className={cn(
        "rounded-lyra-lg transition-all duration-300",
        depth === 0 ? "bg-lyra-bg" : "bg-lyra-surface",
        depth === 1 ? "shadow-neo" : "",
        depth === 2 ? "shadow-neo-inset" : "",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
