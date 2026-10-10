import React from 'react';
import { cn } from './NeoPanel';

type NeoTextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function NeoTextArea({ className, ...props }: NeoTextAreaProps) {
  return (
    <textarea
      className={cn(
        "w-full bg-lyra-surface-inset shadow-neo-inset rounded-lyra-md p-4 text-sm text-lyra-text placeholder:text-lyra-text-muted outline-none transition-all duration-200 focus:ring-2 focus:ring-lyra-accent-soft",
        className
      )}
      {...props}
    />
  );
}
