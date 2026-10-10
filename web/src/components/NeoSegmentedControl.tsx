import React from 'react';

export interface NeoSegmentedControlProps<T extends string> {
  options: { label: React.ReactNode; value: T }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function NeoSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = ''
}: NeoSegmentedControlProps<T>) {
  return (
    <div className={`inline-flex p-1 rounded-lyra-xl bg-lyra-surface shadow-neo items-center space-x-2 ${className}`}>
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`
              relative px-5 py-2 rounded-lyra-lg text-sm font-medium transition-all duration-300 outline-none
              ${isSelected 
                ? 'bg-lyra-surface-inset shadow-neo-active-inset text-lyra-primary' 
                : 'bg-lyra-surface shadow-neo-low text-lyra-text-muted hover:text-lyra-text hover:shadow-neo-shallow-inset hover:bg-lyra-surface-inset active:shadow-neo-active-inset active:translate-y-[1px]'
              }
            `}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
