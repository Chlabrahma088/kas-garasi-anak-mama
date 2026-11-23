'use client';

import React from 'react';
import { formatNumberMask, parseNumberMask } from '@/lib/utils';

interface CurrencyInputProps {
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder = '0',
  className = '',
  disabled = false,
  required = false,
  id,
}) => {
  const displayValue = value ? formatNumberMask(value) : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const num = parseNumberMask(rawVal);
    onChange(num);
  };

  return (
    <div className="relative flex items-center">
      <span className="absolute left-3 text-xs font-bold text-slate-500 dark:text-zinc-400 select-none">
        Rp
      </span>
      <input
        type="text"
        id={id}
        inputMode="numeric"
        disabled={disabled}
        required={required}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        // text-base on mobile prevents iOS Safari auto-zoom, text-sm on desktop
        className={`w-full pl-9 pr-3 py-2.5 sm:py-2 text-base sm:text-sm rounded-xl sm:rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono ${className}`}
      />
    </div>
  );
};
