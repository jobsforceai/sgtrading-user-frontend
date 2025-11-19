'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Menu,
  Activity,
  Minus,
  Maximize2,
  X,
  Plus,
  Clock,
  BarChart2,
  Wifi,
  WifiOff,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useMarketSocket, MarketTick } from '@/hooks/useMarketSocket';
import { getInstruments } from '@/actions/market';
import { getHistoricalData, createTrade } from '@/actions/trade';
import { toYahooFinanceSymbol } from '@/lib/symbolMapping';
import { useActionState } from 'react';
import DynamicChart from '@/components/DynamicChart';
import { ChartTypeSelector } from '@/components/ChartTypeSelector';
import { convertToHeikinAshi } from '@/lib/heikinAshi';

// --- Components ---

const Header = ({ connectionStatus }: { connectionStatus: string }) => (
    <div className="bg-[#1e222d] border-b border-gray-700 h-10 flex items-center justify-between px-2 select-none text-xs text-gray-300">
    <div className="flex items-center space-x-4">
      <div className="flex items-center font-bold text-blue-500">
        <Activity className="w-4 h-4 mr-1" />
        <span>SGTrading</span>
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
        {connectionStatus === 'Connected' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        <span className="uppercase text-[10px] font-bold">{connectionStatus}</span>
      </div>
    </div>
  </div>
);

const Toolbar = ({
  isSidebarOpen,
  setIsSidebarOpen,
}: {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}) => (
  <div className="bg-[#2a2e39] border-b border-gray-700 h-9 flex items-center px-2 space-x-2 overflow-x-auto scrollbar-hide select-none">
    <div className="flex space-x-1 pr-4 border-r border-gray-600">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-gray-700 rounded">
            {isSidebarOpen ? <PanelLeftClose className="w-4 h-4 text-gray-400" /> : <PanelLeftOpen className="w-4 h-4 text-gray-400" />}
        </button>
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
  <div className="w-64 bg-[#1e222d] border-r border-gray-700 flex flex-col">
    <div className="h-8 flex items-center justify-between px-2 bg-[#2a2e39] border-b border-gray-700">
      <span className="text-xs font-semibold text-gray-300">Market Watch</span>
      <Menu className="w-3 h-3 text-gray-400 cursor-pointer" />
    </div>
    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600">
      <table className="w-full text-right border-collapse">
        <thead>
          <tr className="text-[10px] text-gray-500 bg-[#1e222d] sticky top-0">
            <th className="px-2 py-1 text-left">Symbol</th>
            <th className="px-2 py-1">Price</th>
          </tr>
        </thead>
        <tbody>
          {symbols.map((sym) => {
            const priceData = prices[sym.symbol];
            const price = priceData ? priceData.last : 0;

            return (
              <tr
                key={sym.symbol}
                onClick={() => onSelectSymbol(sym.symbol)}
                className={`cursor-pointer hover:bg-[#2a2e39] border-b border-gray-800 text-xs transition-colors ${
                  activeSymbol === sym.symbol ? 'bg-[#2a2e39]' : ''
                }`}
              >
                <td className="px-2 py-2 text-left font-medium text-gray-200">
                  {sym.displayName}
                </td>
                <td className="px-2 py-2 text-blue-400">
                  {price > 0 ? price.toFixed(sym.decimalPlaces) : '...'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

const TradePanel = ({
    instruments,
    selectedInstrument,
    setSelectedInstrument,
    createTradeFormAction,
    createTradeState,
}: {
    instruments: any[];
    selectedInstrument: string;
    setSelectedInstrument: (symbol: string) => void;
    createTradeFormAction: (payload: FormData) => void;
    createTradeState: { error?: string; data?: any } | undefined;
}) => (
    <div className="w-full lg:w-80 bg-[#1e222d] p-4 flex-shrink-0 border-l border-gray-700">
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center text-white">Trade</h2>
            <form action={createTradeFormAction} className="space-y-4">
                <div>
                    <label htmlFor="instrument" className="block text-sm font-medium text-gray-400">Asset</label>
                    <select
                        id="instrument"
                        name="symbol"
                        className="w-full px-3 py-2 mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white"
                        value={selectedInstrument}
                        onChange={(e) => setSelectedInstrument(e.target.value)}
                    >
                        {instruments.map((instrument) => (
                            <option key={instrument._id} value={instrument.symbol}>
                                {instrument.displayName}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="stake" className="block text-sm font-medium text-gray-400">Investment</label>
                    <input
                        id="stake"
                        name="stakeUsd"
                        type="number"
                        required
                        className="w-full px-3 py-2 mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white"
                        defaultValue="10"
                    />
                </div>
                <div>
                    <label htmlFor="expiry" className="block text-sm font-medium text-gray-400">Duration (s)</label>
                    <input
                        id="expiry"
                        name="expirySeconds"
                        type="number"
                        required
                        className="w-full px-3 py-2 mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white"
                        defaultValue="60"
                    />
                </div>
                <div className="flex space-x-4">
                    <button type="submit" name="direction" value="UP" className="w-full px-4 py-3 text-sm font-bold text-white bg-green-600 rounded-md hover:bg-green-700">Up</button>
                    <button type="submit" name="direction" value="DOWN" className="w-full px-4 py-3 text-sm font-bold text-white bg-red-600 rounded-md hover:bg-red-700">Down</button>
                </div>
                {createTradeState?.error && <p className="text-sm text-red-500 text-center">{createTradeState.error}</p>}
                {createTradeState?.data && <p className="text-sm text-green-500 text-center">Trade created!</p>}
            </form>
        </div>
    </div>
);


export default function TradePage() {
  const [activeSymbol, setActiveSymbol] = useState('');
  const [chartType, setChartType] = useState<'Candlestick' | 'Area' | 'Bar' | 'Heikin Ashi'>('Candlestick');
  const [instruments, setInstruments] = useState<any[]>([]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('Connecting');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [createTradeState, createTradeFormAction] = useActionState(createTrade, undefined);

  const liveTicks = useMarketSocket();

  const prices = useMemo(() => {
    return liveTicks.reduce((acc, tick) => {
      acc[tick.symbol] = tick;
      return acc;
    }, {} as Record<string, MarketTick>);
  }, [liveTicks]);
  
  const latestTickForChart = useMemo(() => {
      return liveTicks.find(t => t.symbol === activeSymbol);
  }, [liveTicks, activeSymbol]);

  const activeInstrument = useMemo(() => {
      return instruments.find(i => i.symbol === activeSymbol);
  }, [instruments, activeSymbol]);

  useEffect(() => {
    async function fetchInstruments() {
      const result = await getInstruments();
      if (result.data && result.data.length > 0) {
        setInstruments(result.data);
        setActiveSymbol(result.data[0]?.symbol || '');
      }
    }
    fetchInstruments();
  }, []);

  useEffect(() => {
    if (!activeSymbol) return;
    
    setHistoricalData([]); // Clear previous data
    const loadInitialData = async () => {
      const yahooSymbol = toYahooFinanceSymbol(activeSymbol);
      const now = Math.floor(Date.now() / 1000);
      const twentyFourHoursAgo = now - (24 * 60 * 60);
      const result = await getHistoricalData(yahooSymbol, '1', twentyFourHoursAgo, now);
      if (result.data) {
        const formattedData = result.data.map((d: any) => ({...d, time: Math.floor(d.time / 1000)}));
        setHistoricalData(formattedData);
      }
    };
    loadInitialData();
  }, [activeSymbol]);

  useEffect(() => {
    if (liveTicks.length > 0) {
      setConnectionStatus('Connected');
    }
  }, [liveTicks]);

  const processedChartData = useMemo(() => {
    if (chartType === 'Heikin Ashi') {
      return convertToHeikinAshi(historicalData);
    }
    if (chartType === 'Area') {
      return historicalData.map((d) => ({ time: d.time, value: d.close }));
    }
    return historicalData;
  }, [historicalData, chartType]);

  return (
    <div className="flex flex-col h-screen bg-[#131722] text-gray-300 overflow-hidden font-sans">
      <Header connectionStatus={connectionStatus} />
      <Toolbar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div className="flex flex-1 overflow-hidden">
        {isSidebarOpen && (
            <MarketWatch
                symbols={instruments}
                prices={prices}
                activeSymbol={activeSymbol}
                onSelectSymbol={setActiveSymbol}
            />
        )}

        <div className="flex-1 flex flex-col relative bg-black">
            <div className="absolute top-2 left-2 z-10">
                <ChartTypeSelector chartType={chartType} setChartType={setChartType} />
            </div>
            <DynamicChart
                data={processedChartData}
                liveTick={latestTickForChart}
                chartType={chartType}
                decimals={activeInstrument?.decimalPlaces}
            />
        </div>
        <TradePanel 
            instruments={instruments}
            selectedInstrument={activeSymbol}
            setSelectedInstrument={setActiveSymbol}
            createTradeFormAction={createTradeFormAction}
            createTradeState={createTradeState}
        />
      </div>
    </div>
  );
}
