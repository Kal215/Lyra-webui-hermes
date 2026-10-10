import React from 'react';
import { cn } from './NeoPanel';

interface NeoInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export function NeoInput({ icon, className, ...props }: NeoInputProps) {
  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-lyra-text-muted pointer-events-none">
          {icon}
        </div>
      )}
      <input
        className={cn(
          "w-full h-10 bg-lyra-surface-inset shadow-neo-inset rounded-lyra-md px-4 text-sm text-lyra-text placeholder:text-lyra-text-muted outline-none transition-all duration-200 focus:ring-2 focus:ring-lyra-accent-soft",
          icon && "pl-10",
          className
        )}
        {...props}
      />
    </div>
  );
}
