'use client';

import React from 'react';

interface ChartTypeSelectorProps {
  chartType: string;
  setChartType: (type: 'Candlestick' | 'Area' | 'Bar' | 'Heikin Ashi') => void;
}

export const ChartTypeSelector: React.FC<ChartTypeSelectorProps> = ({ chartType, setChartType }) => {
  const chartTypes = ['Area', 'Heikin Ashi'];

  return (
    <div className="flex items-center space-x-1 bg-[#1e222d] p-1 rounded-md">
      {chartTypes.map((type) => (
        <button
          key={type}
          onClick={() => setChartType(type as any)}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${
            chartType === type
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:bg-gray-700'
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );
};
