"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface FlipCardProps {
  value: string; // Two-digit string, e.g., "01", "18"
  label?: string; // Optional label, e.g., "Hours"
}

const FlipCard: React.FC<FlipCardProps> = ({ value, label }) => {
  return (
    <div className="relative flex flex-col items-center justify-center bg-white dark:bg-slate-700 rounded-lg shadow-md p-2 w-28 h-28 md:w-32 md:h-32 lg:w-40 lg:h-40 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-800 dark:text-slate-100 leading-none">
          {value}
        </span>
      </div>
      {/* Horizontal line in the middle */}
      <div className="absolute w-full h-0.5 bg-gray-200 dark:bg-slate-600 top-1/2 -translate-y-1/2 z-10"></div>
      {label && (
        <div className="absolute bottom-2 text-xs md:text-sm text-gray-500 dark:text-slate-400">
          {label}
        </div>
      )}
    </div>
  );
};

export default FlipCard;