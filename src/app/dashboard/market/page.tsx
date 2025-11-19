'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Menu,
  Search,
  Settings,
  Maximize2,
  Minus,
  X,
  Briefcase,
  History,
  Newspaper,
  Mail,
  Activity,
  ChevronDown,
  ChevronUp,
  Plus,
  Clock,
  BarChart2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useMarketSocket, MarketTick } from '@/hooks/useMarketSocket';
import { getInstruments } from '@/actions/market';
import { getHistoricalData } from '@/actions/trade';
import { toYahooFinanceSymbol } from '@/lib/symbolMapping';

// --- Constants & Utilities ---

const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'];

// --- Components ---

const Header = ({ connectionStatus }: { connectionStatus: string }) => (
  <div className="bg-[#1e222d] border-b border-gray-700 h-10 flex items-center justify-between px-2 select-none text-xs text-gray-300">
    <div className="flex items-center space-x-4">
      <div className="flex items-center font-bold text-blue-500">
        <Activity className="w-4 h-4 mr-1" />
        <span>SGTrading</span>
      </div>
      <div className="hidden md:flex space-x-3">
        <span className="hover:text-white cursor-pointer">File</span>
        <span className="hover:text-white cursor-pointer">View</span>
        <span className="hover:text-white cursor-pointer">Insert</span>
        <span className="hover:text-white cursor-pointer">Charts</span>
        <span className="hover:text-white cursor-pointer">Options</span>
        <span className="hover:text-white cursor-pointer">Help</span>
      </div>
    </div>
    <div className="flex items-center space-x-3">
      <div
        className={`flex items-center space-x-1 px-2 py-0.5 rounded ${
          connectionStatus === 'Connected'
            ? 'text-green-500 bg-green-900/20'
            : 'text-red-500 bg-red-900/20'
        }`}
      >
        {connectionStatus === 'Connected' ? (
          <Wifi className="w-3 h-3" />
        ) : (
          <WifiOff className="w-3 h-3" />
        )}
        <span className="uppercase text-[10px] font-bold">
          {connectionStatus}
        </span>
      </div>
      <div className="w-px h-4 bg-gray-600 mx-1"></div>
      <button className="p-1 hover:bg-gray-700 rounded">
        <Minus className="w-3 h-3" />
      </button>
      <button className="p-1 hover:bg-gray-700 rounded">
        <Maximize2 className="w-3 h-3" />
      </button>
      <button className="p-1 hover:bg-red-600 rounded">
        <X className="w-3 h-3" />
      </button>
    </div>
  </div>
);

const Toolbar = ({
  currentTimeframe,
  setTimeframe,
}: {
  currentTimeframe: string;
  setTimeframe: (tf: string) => void;
}) => (
  <div className="bg-[#2a2e39] border-b border-gray-700 h-9 flex items-center px-2 space-x-2 overflow-x-auto scrollbar-hide select-none">
    <div className="flex space-x-1 pr-4 border-r border-gray-600">
      <BarChart2 className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
      <Plus className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
      <Clock className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
    </div>
    <div className="flex space-x-1">
      {TIMEFRAMES.map((tf) => (
        <button
          key={tf}
          onClick={() => setTimeframe(tf)}
          className={`px-2 py-0.5 text-[10px] rounded ${
            currentTimeframe === tf
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-400 hover:bg-gray-700'
          }`}
        >
          {tf}
        </button>
      ))}
    </div>
  </div>
);

const MarketWatch = ({
  symbols,
  prices,
  activeSymbol,
  onSelectSymbol,
}: {
  symbols: any[];
  prices: { [key: string]: MarketTick };
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}) => (
  <div className="w-64 bg-[#1e222d] border-r border-gray-700 flex flex-col hidden md:flex">
    <div className="h-8 flex items-center justify-between px-2 bg-[#2a2e39] border-b border-gray-700">
      <span className="text-xs font-semibold text-gray-300">Market Watch</span>
      <Menu className="w-3 h-3 text-gray-400 cursor-pointer" />
    </div>
    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600">
      <table className="w-full text-right border-collapse">
        <thead>
          <tr className="text-[10px] text-gray-500 bg-[#1e222d] sticky top-0">
            <th className="px-2 py-1 text-left">Symbol</th>
            <th className="px-2 py-1">Bid</th>
            <th className="px-2 py-1">Ask</th>
          </tr>
        </thead>
        <tbody>
          {symbols.map((sym) => {
            const priceData = prices[sym.symbol];
            const bid = priceData ? priceData.last : 0;
            const ask = priceData ? priceData.last + 0.0001 : 0; // Simulate spread

            return (
              <tr
                key={sym.symbol}
                onClick={() => onSelectSymbol(sym.symbol)}
                className={`cursor-pointer hover:bg-[#2a2e39] border-b border-gray-800 text-xs transition-colors ${
                  activeSymbol === sym.symbol ? 'bg-[#2a2e39]' : ''
                }`}
              >
                <td className="px-2 py-2 text-left font-medium text-gray-200">
                  <div className="flex items-center">
                    <div
                      className={`w-1 h-1 rounded-full mr-2 ${
                        sym.type === 'FOREX'
                          ? 'bg-blue-500'
                          : sym.type === 'COMMODITY'
                          ? 'bg-yellow-500'
                          : 'bg-purple-500'
                      }`}
                    ></div>
                    {sym.displayName}
                  </div>
                  <span className="text-[9px] text-gray-500 ml-3">
                    {sym.type}
                  </span>
                </td>
                <td className="px-2 py-2 text-blue-400">
                  {bid > 0 ? bid.toFixed(sym.decimalPlaces) : '...'}
                </td>
                <td className="px-2 py-2 text-red-400">
                  {ask > 0 ? ask.toFixed(sym.decimalPlaces) : '...'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

const Chart = ({
  data,
  activeSymbolObj,
  currentPrice,
  timeframe,
}: {
  data: any[];
  activeSymbolObj: any;
  currentPrice: number;
  timeframe: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 100 });

  useEffect(() => {
    setVisibleRange({ start: Math.max(0, data.length - 100), end: data.length });
  }, [data]);

  const visibleData = useMemo(() => {
    return data.slice(visibleRange.start, visibleRange.end);
  }, [data, visibleRange]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomAmount = e.deltaY < 0 ? 0.1 : -0.1;
    const range = visibleRange.end - visibleRange.start;
    const change = Math.round(range * zoomAmount);

    let newStart = visibleRange.start - change;
    let newEnd = visibleRange.end + change;

    if (newStart < 0) newStart = 0;
    if (newEnd > data.length) newEnd = data.length;
    if (newEnd - newStart < 10) return;
    if (newEnd - newStart > data.length && zoomAmount < 0) return;

    setVisibleRange({ start: newStart, end: newEnd });
  };

  if (visibleData.length === 0)
    return (
      <div className="flex-1 bg-black flex items-center justify-center text-gray-600 text-xs">
        Waiting for data...
      </div>
    );

  const displayDecimals = activeSymbolObj?.decimalPlaces || 4;

  const minPrice = Math.min(...visibleData.map((d) => d.low));
  const maxPrice = Math.max(...visibleData.map((d) => d.high));
  const priceRange = maxPrice - minPrice || 1;

  const pY = priceRange * 0.1;
  const minY = minPrice - pY;
  const maxY = maxPrice + pY;
  const rangeY = maxY - minY;

  const candleWidth = dimensions.width / (visibleData.length + 15);
  const gap = candleWidth * 0.3;

  const getY = (price: number) =>
    dimensions.height - ((price - minY) / rangeY) * dimensions.height;
  const getX = (index: number) => index * candleWidth + 10;

  const currentY = getY(currentPrice);

  return (
    <div
      className="flex-1 bg-black relative overflow-hidden cursor-crosshair"
      ref={containerRef}
      onWheel={handleWheel}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
        <span className="text-6xl font-bold text-gray-500">
          {activeSymbolObj.displayName}
        </span>
      </div>

      <svg width="100%" height="100%" className="absolute inset-0">
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((pct) => {
          const y = dimensions.height * pct;
          const price = maxY - pct * rangeY;
          return (
            <g key={pct}>
              <line
                x1="0"
                y1={y}
                x2="100%"
                y2={y}
                stroke="#333"
                strokeDasharray="4 4"
                strokeWidth="0.5"
              />
              <text
                x={dimensions.width - 5}
                y={y - 5}
                textAnchor="end"
                fill="#666"
                fontSize="10"
              >
                {price.toFixed(displayDecimals)}
              </text>
            </g>
          );
        })}

        {visibleData.map((d, i) => {
          const x = getX(i);
          const yOpen = getY(d.open);
          const yClose = getY(d.close);
          const yHigh = getY(d.high);
          const yLow = getY(d.low);
          const isGreen = d.close >= d.open;
          const color = isGreen ? '#26a69a' : '#ef5350';
          const bodyTop = Math.min(yOpen, yClose);
          const bodyHeight = Math.abs(yClose - yOpen) || 1;

          return (
            <g key={i}>
              <line
                x1={x + candleWidth / 2}
                y1={yHigh}
                x2={x + candleWidth / 2}
                y2={yLow}
                stroke={color}
                strokeWidth="1"
              />
              <rect
                x={x + gap}
                y={bodyTop}
                width={candleWidth - gap * 2}
                height={bodyHeight}
                fill={color}
                stroke={color}
              />
            </g>
          );
        })}

        <line
          x1="0"
          y1={currentY}
          x2="100%"
          y2={currentY}
          stroke="#3b82f6"
          strokeWidth="1"
        />
        <rect
          x={dimensions.width - 70}
          y={currentY - 10}
          width="70"
          height="20"
          fill="#3b82f6"
        />
        <text
          x={dimensions.width - 35}
          y={currentY + 4}
          textAnchor="middle"
          fill="white"
          fontSize="11"
          fontWeight="bold"
        >
          {currentPrice.toFixed(displayDecimals)}
        </text>
      </svg>

      <div className="absolute top-2 left-2 text-gray-400 text-xs font-mono bg-black/50 p-1 rounded z-10">
        <span className="text-white font-bold mr-2">
          {activeSymbolObj.displayName}, {timeframe}
        </span>
        {visibleData.length > 0 && (
          <>
            O:{' '}
            <span className="text-yellow-500">
              {visibleData[visibleData.length - 1].open?.toFixed(displayDecimals)}
            </span>{' '}
            H:{' '}
            <span className="text-green-500">
              {visibleData[visibleData.length - 1].high?.toFixed(displayDecimals)}
            </span>{' '}
            L:{' '}
            <span className="text-red-500">
              {visibleData[visibleData.length - 1].low?.toFixed(displayDecimals)}
            </span>{' '}
            C:{' '}
            <span className="text-blue-400">
              {visibleData[visibleData.length - 1].close?.toFixed(displayDecimals)}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default function MarketPage() {
  const [activeSymbol, setActiveSymbol] = useState('');
  const [timeframe, setTimeframe] = useState('M1');
  const [instruments, setInstruments] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('Connecting');
  const liveTicks = useMarketSocket();

  const prices = useMemo(() => {
    const priceMap: { [key: string]: MarketTick } = {};
    liveTicks.forEach((tick) => {
      priceMap[tick.symbol] = tick;
    });
    return priceMap;
  }, [liveTicks]);

  const activeSymbolObj =
    instruments.find((s) => s.symbol === activeSymbol) || instruments[0];

  useEffect(() => {
    async function fetchInstruments() {
      const result = await getInstruments();
      if (result.data) {
        setInstruments(result.data);
        setActiveSymbol(result.data[0]?.symbol || '');
      }
    }
    fetchInstruments();
  }, []);

  useEffect(() => {
    if (!activeSymbol) return;

    const loadInitialData = async () => {
      const yahooSymbol = toYahooFinanceSymbol(activeSymbol);
      const now = Math.floor(Date.now() / 1000);
      const twentyFourHoursAgo = now - 24 * 60 * 60;
      const result = await getHistoricalData(
        yahooSymbol,
        '1',
        twentyFourHoursAgo,
        now
      );
      if (result.data) {
        console.log('Historical data received:', result.data);
        setChartData(result.data);
      }
    };
    loadInitialData();
  }, [activeSymbol]);

  useEffect(() => {
    if (liveTicks.length > 0) {
      setConnectionStatus('Connected');
    }

    const priceInfo = prices[activeSymbol];
    if (!priceInfo) return;

    const currentPrice = priceInfo.last;

    setChartData((prev) => {
      if (prev.length === 0) {
        return []; // Don't generate history, wait for fetch
      }

      const lastCandle = prev[prev.length - 1];
      const newCandle = {
        ...lastCandle,
        close: currentPrice,
        high: Math.max(lastCandle.high, currentPrice),
        low: Math.min(lastCandle.low, currentPrice),
      };

      // Simple logic to create a new candle every 60 seconds
      const lastTime = new Date(lastCandle.time * 1000);
      const newTime = new Date(priceInfo.ts);

      if (newTime.getMinutes() !== lastTime.getMinutes()) {
        return [
          ...prev,
          {
            time: Math.floor(priceInfo.ts / 1000),
            open: currentPrice,
            close: currentPrice,
            high: currentPrice,
            low: currentPrice,
          },
        ].slice(-100); // Keep the chart from getting too crowded
      } else {
        return [...prev.slice(0, -1), newCandle];
      }
    });
  }, [prices, activeSymbol]);

  return (
    <div className="flex flex-col h-screen bg-[#131722] text-gray-300 overflow-hidden font-sans">
      <Header connectionStatus={connectionStatus} />
      <Toolbar currentTimeframe={timeframe} setTimeframe={setTimeframe} />

      <div className="flex flex-1 overflow-hidden">
        <MarketWatch
          symbols={instruments}
          prices={prices}
          activeSymbol={activeSymbol}
          onSelectSymbol={setActiveSymbol}
        />

        <div className="flex-1 flex flex-col relative">
          <Chart
            data={chartData}
            activeSymbolObj={activeSymbolObj}
            currentPrice={prices[activeSymbol]?.last || 0}
            timeframe={timeframe}
          />
        </div>
      </div>
    </div>
  );
}