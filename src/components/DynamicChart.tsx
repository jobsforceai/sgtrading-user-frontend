'use client';

import dynamic from 'next/dynamic';

const DynamicChart = dynamic(() => import('./ChartComponent').then(mod => mod.ChartComponent), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full w-full bg-black text-gray-400">Loading Chart...</div>,
});

export default DynamicChart;