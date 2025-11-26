'use client';

import { Info } from 'lucide-react';

export const Tooltip: React.FC<{ text?: string }> = ({ text }) => {
    if (!text) return null;
    return (
      <div className="group relative inline-block ml-1.5">
        <Info className="w-3.5 h-3.5 text-gray-500 cursor-help" />
        <div className="invisible group-hover:visible absolute z-10 w-48 p-2 mt-1 text-xs text-white bg-gray-900 border border-gray-700 rounded shadow-lg -translate-x-1/2 left-1/2">
          {text}
        </div>
      </div>
    );
};
