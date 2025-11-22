'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Menu,
  Activity,
  Wifi,
  WifiOff,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  Bot,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useSubscriptionMarketData, MarketTick } from '@/hooks/useSubscriptionMarketData';
import { getInstruments } from '@/actions/market';
import { getHistoricalData, createTrade, getOpenTrades, getTradeHistory } from '@/actions/trade';
import { getWallet } from '@/actions/user';
import { toYahooFinanceSymbol, toBackendSymbol } from '@/lib/symbolMapping';
import { useActionState } from 'react';
import DynamicChart from '@/components/DynamicChart';
import { ChartTypeSelector } from '@/components/ChartTypeSelector';
import { convertToHeikinAshi } from '@/lib/heikinAshi';
import { useUserStore } from '@/store/user';

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
  prices: Record<string, MarketTick>;
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}) => {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['CRYPTO', 'FOREX', 'STOCK', 'COMMODITY']));

  const toggleSection = (type: string) => {
    const newSections = new Set(openSections);
    if (newSections.has(type)) {
      newSections.delete(type);
    } else {
      newSections.add(type);
    }
    setOpenSections(newSections);
  };

  const categories = [
    { id: 'CRYPTO', label: 'Cryptocurrency' },
    { id: 'FOREX', label: 'Forex' },
    { id: 'STOCK', label: 'Stocks' },
    { id: 'COMMODITY', label: 'Commodities' },
  ];

  return (
    <div className="absolute top-0 left-0 h-full w-80 z-30 shadow-xl bg-[#1e222d] border-r border-gray-700 flex flex-col">
      <div className="h-8 flex items-center justify-between px-2 bg-[#2a2e39] border-b border-gray-700">
        <span className="text-xs font-semibold text-gray-300">Market Watch</span>
        <Menu className="w-3 h-3 text-gray-400 cursor-pointer" />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="text-[10px] text-gray-500 bg-[#1e222d] sticky top-0 z-10">
              <th className="px-2 py-1 text-left">Symbol</th>
              <th className="px-2 py-1">Payout</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => {
              const catSymbols = symbols.filter((s) => s.type === cat.id);
              if (catSymbols.length === 0) return null;

              const isOpen = openSections.has(cat.id);

              return (
                <React.Fragment key={cat.id}>
                  {/* Category Header */}
                  <tr 
                    onClick={() => toggleSection(cat.id)}
                    className="bg-[#232731] cursor-pointer hover:bg-[#2a2e39] border-b border-gray-700 select-none"
                  >
                    <td colSpan={2} className="px-2 py-1.5 text-left text-[11px] font-bold text-gray-400 flex items-center">
                      {isOpen ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
                      {cat.label}
                    </td>
                  </tr>
                  
                  {/* Asset Rows */}
                  {isOpen && catSymbols.map((sym) => (
                    <tr
                      key={sym.symbol}
                      onClick={() => onSelectSymbol(sym.symbol)}
                      className={`cursor-pointer hover:bg-[#2a2e39] border-b border-gray-800 text-xs transition-colors ${
                        activeSymbol === sym.symbol ? 'bg-[#2a2e39]' : ''
                      }`}
                    >
                      <td className="px-2 py-2 text-left font-medium text-gray-200 pl-4">
                        {sym.displayName}
                      </td>
                      <td className="px-2 py-2 text-green-400 font-bold">
                        {sym.defaultPayoutPercent ? `${sym.defaultPayoutPercent}%` : '...'}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TradePanel = ({
    instruments,
    selectedInstrument,
    setSelectedInstrument,
    createTradeFormAction,
    createTradeState,
    tradingMode,
}: {
    instruments: any[];
    selectedInstrument: string;
    setSelectedInstrument: (symbol: string) => void;
    createTradeFormAction: (payload: FormData) => void;
    createTradeState: { error?: string; data?: any } | undefined;
    tradingMode: string;
}) => {
    const { wallet } = useUserStore();
    const [stake, setStake] = useState<number>(10);

    const currentBalance = wallet
        ? tradingMode === 'LIVE'
            ? wallet.liveBalanceUsd
            : wallet.demoBalanceUsd
        : 0;

    const isInsufficientFunds = stake > currentBalance;

    return (
        <div className="w-full lg:w-80 bg-[#1e222d] p-4 flex-shrink-0 border-l border-gray-700">
            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-center text-white">Trade</h2>
                <div className="flex justify-center">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${tradingMode === 'LIVE' ? 'bg-green-600 text-white' : 'bg-orange-500 text-white'}`}>
                        {tradingMode} MODE
                    </span>
                </div>
                <form action={createTradeFormAction} className="space-y-4">
                    <input type="hidden" name="mode" value={tradingMode} />
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
                        <label htmlFor="stake" className="block text-sm font-medium text-gray-400">
                            Investment
                            <span className="float-right text-xs text-gray-500">
                                Avail: ${currentBalance.toFixed(2)}
                            </span>
                        </label>
                        <input
                            id="stake"
                            name="stakeUsd"
                            type="number"
                            required
                            className={`w-full px-3 py-2 mt-1 bg-gray-800 border rounded-md shadow-sm focus:outline-none sm:text-sm text-white ${isInsufficientFunds ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-indigo-500'}`}
                            value={stake}
                            onChange={(e) => setStake(parseFloat(e.target.value))}
                            min="1"
                        />
                        {isInsufficientFunds && (
                            <p className="text-xs text-red-500 mt-1">Insufficient {tradingMode.toLowerCase()} funds</p>
                        )}
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
                        <button 
                            type="submit" 
                            name="direction" 
                            value="UP" 
                            disabled={isInsufficientFunds}
                            className={`w-full px-4 py-3 text-sm font-bold text-white rounded-md transition-opacity ${isInsufficientFunds ? 'bg-green-800 opacity-50 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                        >
                            Up
                        </button>
                        <button 
                            type="submit" 
                            name="direction" 
                            value="DOWN" 
                            disabled={isInsufficientFunds}
                            className={`w-full px-4 py-3 text-sm font-bold text-white rounded-md transition-opacity ${isInsufficientFunds ? 'bg-red-800 opacity-50 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                        >
                            Down
                        </button>
                    </div>
                    {createTradeState?.error && <p className="text-sm text-red-500 text-center">{createTradeState.error}</p>}
                    {createTradeState?.data && <p className="text-sm text-green-500 text-center">Trade created!</p>}
                </form>
            </div>
        </div>
    );
};

const Countdown = ({ targetDate }: { targetDate: string }) => {
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const target = new Date(targetDate).getTime();
            const diff = Math.max(0, Math.floor((target - now) / 1000));
            
            if (diff === 0) {
                setTimeLeft('Closing...');
            } else {
                const mins = Math.floor(diff / 60);
                const secs = diff % 60;
                setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
            }
        }, 1000);
        
        return () => clearInterval(interval);
    }, [targetDate]);

    return <span>{timeLeft}</span>;
};

const TradesTable = ({ trades, type, prices }: { trades: any[], type: 'OPEN' | 'HISTORY', prices?: Record<string, MarketTick> }) => (
    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600">
        <table className="w-full text-left text-xs text-gray-400">
            <thead className="bg-[#2a2e39] sticky top-0 z-10">
                <tr>
                    <th className="p-2">Symbol</th>
                    <th className="p-2">Direction</th>
                    <th className="p-2">Stake</th>
                    <th className="p-2">Entry Price</th>
                    <th className="p-2">{type === 'OPEN' ? 'Current Price' : 'Exit Price'}</th>
                    {type === 'OPEN' && <th className="p-2">Status</th>}
                    <th className="p-2">{type === 'OPEN' ? 'Time Left' : 'Closed At'}</th>
                     {type === 'HISTORY' && <th className="p-2">Outcome</th>}
                     {type === 'HISTORY' && <th className="p-2">Payout</th>}
                </tr>
            </thead>
            <tbody>
                {trades.length === 0 ? (
                     <tr><td colSpan={type === 'OPEN' ? 8 : 9} className="p-4 text-center">No {type.toLowerCase()} trades</td></tr>
                ) : (
                    trades.map((t) => {
                        // Live Status Logic for OPEN trades
                        let currentPrice = 0;
                        let isWinning = false;
                        let statusText = '...';
                        
                        if (type === 'OPEN' && prices) {
                            const backendSym = toBackendSymbol(t.instrumentSymbol || t.symbol); // API uses instrumentSymbol in history, symbol in payload? Check keys.
                            // The snippet shows "instrumentSymbol". The create payload used "symbol".
                            // Let's support both.
                            const sym = t.instrumentSymbol || t.symbol;
                            const backendSymMapped = toBackendSymbol(sym);
                            
                            const tick = prices[backendSymMapped];
                            if (tick) {
                                currentPrice = tick.last;
                                if (t.direction === 'UP') {
                                    isWinning = currentPrice > t.entryPrice;
                                } else {
                                    isWinning = currentPrice < t.entryPrice;
                                }
                                statusText = isWinning ? 'WINNING' : 'LOSING';
                            }
                        }

                        // Payout Calculation for HISTORY
                        let payoutDisplay = '0.00';
                        if (type === 'HISTORY') {
                            // API now provides 'payoutAmount' directly
                            if (t.payoutAmount !== undefined && t.payoutAmount !== null) {
                                payoutDisplay = Number(t.payoutAmount).toFixed(2);
                            } else {
                                // Fallback if field missing
                                payoutDisplay = '0.00';
                            }
                        }

                        return (
                            <tr key={t._id} className="border-b border-gray-800 hover:bg-[#2a2e39]">
                                <td className="p-2 text-white font-medium">
                                    {t.botId && <Bot className="w-3 h-3 inline mr-1 text-indigo-400" />}
                                    {t.instrumentSymbol || t.symbol}
                                </td>
                                <td className={`p-2 font-bold ${t.direction === 'UP' ? 'text-green-500' : 'text-red-500'}`}>{t.direction}</td>
                                <td className="p-2">${t.stakeUsd}</td>
                                <td className="p-2">{t.entryPrice}</td>
                                
                                <td className={`p-2 ${type === 'OPEN' ? (isWinning ? 'text-green-500' : 'text-red-500') : ''}`}>
                                    {type === 'OPEN' ? (currentPrice > 0 ? currentPrice : '...') : t.exitPrice}
                                </td>

                                {type === 'OPEN' && (
                                    <td className={`p-2 font-bold ${isWinning ? 'text-green-500' : 'text-red-500'}`}>
                                        {statusText}
                                    </td>
                                )}

                                <td className="p-2">
                                    {type === 'OPEN' ? (
                                        <Countdown targetDate={t.expiresAt} />
                                    ) : (
                                        new Date(t.settledAt || t.closedAt).toLocaleTimeString()
                                    )}
                                </td>

                                 {type === 'HISTORY' && (
                                    <>
                                        <td className={`p-2 font-bold ${t.outcome === 'WIN' ? 'text-green-500' : t.outcome === 'DRAW' ? 'text-yellow-500' : 'text-red-500'}`}>{t.outcome}</td>
                                        <td className={`p-2 ${t.outcome === 'WIN' ? 'text-green-500' : t.outcome === 'DRAW' ? 'text-yellow-500' : 'text-gray-500'}`}>
                                            <div className="flex items-center">
                                                ${payoutDisplay}
                                                {t.isInsured && <Shield className="w-3 h-3 ml-1 text-blue-500" />}
                                            </div>
                                            {t.platformFee > 0 && <div className="text-[9px] text-gray-500">Fee: -${Number(t.platformFee).toFixed(2)}</div>}
                                        </td>
                                    </>
                                 )}
                            </tr>
                        );
                    })
                )}
            </tbody>
        </table>
    </div>
);

export default function TradePage() {
  const [activeSymbol, setActiveSymbol] = useState('');
  const [chartType, setChartType] = useState<'Candlestick' | 'Area' | 'Bar' | 'Heikin Ashi'>('Candlestick');
  const [instruments, setInstruments] = useState<any[]>([]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [createTradeState, createTradeFormAction] = useActionState(createTrade, undefined);
  
  const { tradingMode, setWallet } = useUserStore();
  const [activeTab, setActiveTab] = useState<'OPEN' | 'HISTORY'>('OPEN');
  const [openTrades, setOpenTrades] = useState<any[]>([]);
  const [historyTrades, setHistoryTrades] = useState<any[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const prevOpenTradesRef = React.useRef<Set<string>>(new Set());

  // Helper to refresh wallet
  const fetchWallet = async () => {
      const res = await getWallet();
      if (res.data) {
          setWallet(res.data);
      }
  };

  // Initial data fetch on mount (fixes reload issue)
  useEffect(() => {
      fetchWallet();
  }, []);

  // Refresh wallet when a new trade is created (deduct stake)
  useEffect(() => {
      if (createTradeState?.data) {
          fetchWallet();
      }
  }, [createTradeState]);

  // Only subscribe to the active symbol to save bandwidth
  const subscriptionSymbols = useMemo(() => {
    if (!activeSymbol) return [];
    return [toBackendSymbol(activeSymbol)];
  }, [activeSymbol]);

  const ticks = useSubscriptionMarketData(subscriptionSymbols);

  const latestTickForChart = useMemo(() => {
      const backendSym = toBackendSymbol(activeSymbol);
      return ticks[backendSym];
  }, [ticks, activeSymbol]);

  const activeInstrument = useMemo(() => {
      return instruments.find(i => i.symbol === activeSymbol);
  }, [instruments, activeSymbol]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchInstruments = async () => {
      const result = await getInstruments();
      if (result.data && result.data.length > 0) {
        setInstruments(result.data);
      }
  };

  // Initial fetch and periodic refresh for instruments
  useEffect(() => {
    fetchInstruments();
    const interval = setInterval(fetchInstruments, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  // Validate active symbol when instruments list changes
  useEffect(() => {
      if (instruments.length > 0 && activeSymbol) {
          const exists = instruments.find((i: any) => i.symbol === activeSymbol);
          if (!exists) {
              setNotification({ 
                  message: `Asset ${activeSymbol} is currently unavailable. Switching to default.`, 
                  type: 'error' 
              });
              setActiveSymbol(instruments[0].symbol);
          }
      } else if (instruments.length > 0 && !activeSymbol) {
          setActiveSymbol(instruments[0].symbol);
      }
  }, [instruments]);

  useEffect(() => {
    if (!activeSymbol) return;
    
    setHistoricalData([]); // Clear previous data
    const loadInitialData = async () => {
      const backendSymbol = toBackendSymbol(activeSymbol);
      // API expects seconds for from/to
      const now = Math.floor(Date.now() / 1000);
      const twentyFourHoursAgo = now - (24 * 60 * 60);
      
      const result = await getHistoricalData(backendSymbol, '1', twentyFourHoursAgo, now);
      
      if (result.data) {
        // API returns time in SECONDS now (per sgcdocs.md), so no need to divide by 1000
        const formattedData = result.data.map((d: any) => ({
            ...d, 
            time: d.time // Already in seconds
        }));
        setHistoricalData(formattedData);
      }
    };
    loadInitialData();
  }, [activeSymbol]);

  // Fetch Trades Logic
  useEffect(() => {
      const fetchTrades = async () => {
          // Always fetch open trades to track status changes
          const openRes = await getOpenTrades();
          let currentOpenTrades: any[] = [];
          
          if (openRes.data) {
              currentOpenTrades = openRes.data.filter((t: any) => t.mode === tradingMode);
              setOpenTrades(currentOpenTrades);

              // Check for settled trades
              const currentIds = new Set(currentOpenTrades.map((t: any) => t._id));
              const prevIds = prevOpenTradesRef.current;

              // If we had trades before, check if any disappeared
              if (prevIds.size > 0) {
                  const settledIds = [...prevIds].filter(id => !currentIds.has(id));
                  
                  if (settledIds.length > 0) {
                      // fetch history to see result
                      const historyRes = await getTradeHistory(tradingMode);
                      if (historyRes.data) {
                          const recentHistory = historyRes.data;
                          settledIds.forEach(id => {
                              const trade = recentHistory.find((t: any) => t._id === id);
                              if (trade) {
                                  const isWin = trade.outcome === 'WIN';
                                  const payoutAmt = trade.payoutAmount ?? 0; // Use payoutAmount from API
                                  setNotification({
                                      message: `Trade ${trade.symbol} ${trade.outcome}! Payout: $${Number(payoutAmt).toFixed(2)}`,
                                      type: isWin ? 'success' : 'error'
                                  });
                                  // Refresh wallet on settlement
                                  fetchWallet();
                              }
                          });
                      }
                  }
              }
              // Update ref
              prevOpenTradesRef.current = currentIds;
          }

          // Only fetch history if tab is active
          if (activeTab === 'HISTORY') {
              const res = await getTradeHistory(tradingMode);
              if (res.data) {
                  setHistoryTrades(res.data);
              }
          }
      };
      
      fetchTrades();
      // Refresh every 3 seconds to keep open trades updated and check for closed ones
      const interval = setInterval(fetchTrades, 3000);
      return () => clearInterval(interval);
  }, [tradingMode, activeTab, createTradeState]); // Re-fetch if mode changes, tab changes, or a new trade is placed

  // Simple connection status inference
  const connectionStatus = Object.keys(ticks).length > 0 ? 'Connected' : 'Connecting';

  const processedChartData = useMemo(() => {
    if (chartType === 'Heikin Ashi') {
      return convertToHeikinAshi(historicalData);
    }
    if (chartType === 'Area') {
      return historicalData.map((d) => ({ time: d.time, value: d.close }));
    }
    return historicalData;
  }, [historicalData, chartType]);

  const chartTrades = useMemo(() => {
      return openTrades.filter(t => t.symbol === activeSymbol);
  }, [openTrades, activeSymbol]);

  return (
    <div className="flex flex-col h-screen bg-[#131722] text-gray-300 overflow-hidden font-sans relative">
      {notification && (
          <div className={`absolute top-14 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg font-bold transition-opacity duration-500 ${notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
              {notification.message}
          </div>
      )}
      <Header connectionStatus={connectionStatus} />
      <Toolbar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {isSidebarOpen && (
            <MarketWatch
                symbols={instruments}
                prices={ticks}
                activeSymbol={activeSymbol}
                onSelectSymbol={setActiveSymbol}
            />
        )}
        
        <div className="flex-1 flex flex-col relative bg-black">
            {/* Asset Info Overlay when Sidebar Closed */}
            {!isSidebarOpen && activeInstrument && (
                <div className="absolute top-14 left-2 z-20 bg-[#1e222d]/80 backdrop-blur-sm border border-gray-700 p-3 rounded shadow-lg text-white animate-in fade-in slide-in-from-left-4 duration-200">
                    <h3 className="text-lg font-bold tracking-wide">{activeInstrument.displayName}</h3>
                    <div className="flex items-center space-x-3 text-xs mt-1">
                        <span className="text-gray-400">Payout: <span className="text-green-400 font-bold">{activeInstrument.defaultPayoutPercent}%</span></span>
                        <span className="w-px h-3 bg-gray-600"></span>
                        <span className="text-gray-400">{activeInstrument.type}</span>
                    </div>
                </div>
            )}

            {/* Chart Section: Takes up top 65% */}
            <div className="relative h-[65%] border-b border-gray-800">
                <div className="absolute top-2 right-4 z-10">
                    <ChartTypeSelector chartType={chartType} setChartType={setChartType} />
                </div>
                <DynamicChart
                    data={processedChartData}
                    liveTick={latestTickForChart}
                    chartType={chartType}
                    decimals={activeInstrument?.decimalPlaces}
                    openTrades={chartTrades}
                />
            </div>
            
            {/* Trades Section: Takes up bottom 35% */}
            <div className="h-[35%] bg-[#1e222d] flex flex-col">
                 <div className="flex border-b border-gray-700">
                     <button 
                        onClick={() => setActiveTab('OPEN')} 
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'OPEN' ? 'text-blue-400 border-b-2 border-blue-400 bg-[#2a2e39]' : 'text-gray-500 hover:text-gray-300'}`}
                     >
                        Open Positions ({openTrades.length})
                     </button>
                     <button 
                        onClick={() => setActiveTab('HISTORY')} 
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'HISTORY' ? 'text-blue-400 border-b-2 border-blue-400 bg-[#2a2e39]' : 'text-gray-500 hover:text-gray-300'}`}
                     >
                        History
                     </button>
                 </div>
                 <TradesTable trades={activeTab === 'OPEN' ? openTrades : historyTrades} type={activeTab} prices={ticks} />
            </div>
        </div>
        
        <TradePanel 
            instruments={instruments}
            selectedInstrument={activeSymbol}
            setSelectedInstrument={setActiveSymbol}
            createTradeFormAction={createTradeFormAction}
            createTradeState={createTradeState}
            tradingMode={tradingMode}
        />
      </div>
    </div>
  );
}