'use client';

import React from 'react';

interface LicensePlateProps {
  plate: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LicensePlate: React.FC<LicensePlateProps> = ({
  plate,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-bold',
    md: 'px-2.5 py-1 text-xs sm:text-sm font-black',
    lg: 'px-3.5 py-1.5 text-sm sm:text-base font-black',
  };

  return (
    <div
      className={`inline-flex items-center justify-center rounded-md bg-slate-950 text-white font-mono tracking-wider border-2 border-slate-700 shadow-xs select-none ${sizeClasses[size]} ${className}`}
    >
      <span className="uppercase">{plate}</span>
    </div>
  );
};
