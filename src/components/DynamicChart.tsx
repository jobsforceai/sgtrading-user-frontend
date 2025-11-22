'use client';

import dynamic from 'next/dynamic';

const DynamicChart = dynamic(() => import('./ChartComponent').then(mod => mod.ChartComponent), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full w-full bg-black text-gray-400">Loading Chart...</div>,
}) as React.ComponentType<{
  data: any[];
  liveTick?: any;
  chartType: 'Candlestick' | 'Area' | 'Bar' | 'Heikin Ashi';
  colors?: {
    backgroundColor?: string;
    textColor?: string;
  };
  decimals?: number;
  openTrades?: any[];
}>;

export default DynamicChart;