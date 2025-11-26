'use client';

import React, { useEffect, useMemo, useCallback, useState } from 'react';
import {
  Shield,
  Bot,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { useSubscriptionMarketData, MarketTick } from '@/hooks/useSubscriptionMarketData';
import { getInstruments } from '@/actions/market';
import { getHistoricalData, createTrade, getOpenTrades, getTradeHistory } from '@/actions/trade';
import { getWallet } from '@/actions/user';
import { toBackendSymbol } from '@/lib/symbolMapping';
import { useActionState } from 'react';
import DynamicChart from '@/components/DynamicChart';
import { ChartTypeSelector } from '@/components/ChartTypeSelector';
import { convertToHeikinAshi } from '@/lib/heikinAshi';
import { useUserStore } from '@/store/user';
import { useTradeStore } from '@/store/trade';
import TradePanel from './components/TradePanel';
import Toolbar from './components/Toolbar';
import Header from '@/components/Header';

type Instrument = {
  _id: string;
  symbol: string;
  displayName: string;
  type: string;
  decimalPlaces: number;
  defaultPayoutPercent: number;
};

type Trade = {
  _id: string;
  botId?: string;
  instrumentSymbol: string;
  symbol: string;
  direction: 'UP' | 'DOWN';
  stakeUsd: number;
  entryPrice: number;
  exitPrice?: number;
  createdAt: string;
  expiresAt: string;
  settledAt: string;
  closedAt: string;
  outcome: 'WIN' | 'LOSS' | 'DRAW';
  payoutAmount: number;
  isInsured: boolean;
  platformFee: number;
  mode: 'LIVE' | 'DEMO';
};

type HistoricalData = {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
};



const MarketWatch = ({ symbols, activeSymbol, onSelectSymbol }: { symbols: Instrument[], activeSymbol: string, onSelectSymbol: (symbol: string) => void }) => {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['CRYPTO', 'FOREX', 'STOCK', 'COMMODITY']));
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredSymbols = useMemo(() => {
    if (!searchTerm) return symbols;
    return symbols.filter(s => s.displayName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [symbols, searchTerm]);

  return (
    <div className="absolute top-0 left-0 h-full w-80 z-30 shadow-xl bg-[#1e222d] border-r border-gray-700 flex flex-col">
      <div className="h-8 flex items-center justify-between px-2 bg-[#2a2e39] border-b border-gray-700">
        <span className="text-xs font-semibold text-gray-300">Market Watch</span>
      </div>
      <div className="p-2 border-b border-gray-700">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-md pl-8 pr-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
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
              const catSymbols = filteredSymbols.filter((s) => s.type === cat.id);
              if (catSymbols.length === 0) return null;

              const isOpen = openSections.has(cat.id);

              return (
                <React.Fragment key={cat.id}>
                  <tr 
                    onClick={() => toggleSection(cat.id)}
                    className="bg-[#232731] cursor-pointer hover:bg-[#2a2e39] border-b border-gray-700 select-none"
                  >
                    <td colSpan={2} className="px-2 py-1.5 text-left text-[11px] font-bold text-gray-400 flex items-center">
                      {isOpen ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
                      {cat.label}
                    </td>
                  </tr>
                  
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

const TradesTable = ({ trades, type, prices, loadMore, hasMore }: { trades: Trade[], type: 'OPEN' | 'HISTORY', prices?: Record<string, MarketTick>, loadMore?: () => void, hasMore?: boolean }) => {
    const observer = React.useRef<IntersectionObserver | null>(null);
    const lastTradeElementRef = React.useCallback((node: HTMLTableRowElement | null) => {
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && loadMore) {
                loadMore();
            }
        });
        if (node) observer.current.observe(node);
    }, [hasMore, loadMore]);
    
    return (
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
                        trades.map((t, index) => {
                            const isLastElement = index === trades.length - 1;
                            let currentPrice = 0;
                            let isWinning = false;
                            let statusText = '...';
                            
                            if (type === 'OPEN' && prices) {
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
    
                            let payoutDisplay = '0.00';
                            if (type === 'HISTORY') {
                                if (t.payoutAmount !== undefined && t.payoutAmount !== null) {
                                    payoutDisplay = Number(t.payoutAmount).toFixed(2);
                                } else {
                                    payoutDisplay = '0.00';
                                }
                            }
    
                            return (
                                <tr ref={isLastElement ? lastTradeElementRef : null} key={t._id} className="border-b border-gray-800 hover:bg-[#2a2e39]">
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
}

export default function TradePage() {
  const {
    activeSymbol,
    chartType,
    instruments,
    historicalData,
    isSidebarOpen,
    isTradePanelSidebarOpen,
    isTradesPanelOpen,
    activeTab,
    openTrades,
    historyTrades,
    notification,
    setActiveSymbol,
    setChartType,
    setInstruments,
    setHistoricalData,
    setIsSidebarOpen,
    setIsTradePanelSidebarOpen,
    setIsTradesPanelOpen,
    setActiveTab,
    setOpenTrades,
    setHistoryTrades,
    setNotification,
  } = useTradeStore();

  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const TRADE_HISTORY_LIMIT = 10;

  const [createTradeState, createTradeFormAction] = useActionState(createTrade, undefined);
  const { tradingMode, setWallet } = useUserStore();
  const prevOpenTradesRef = React.useRef<Set<string>>(new Set());

  const loadMoreHistory = useCallback(async () => {
    if (!hasMoreHistory) return;

    const nextPage = historyPage + 1;
    const res = await getTradeHistory(tradingMode, nextPage, TRADE_HISTORY_LIMIT);
    
    if (res.data) {
      setHistoryTrades([...historyTrades, ...res.data]);
      setHistoryPage(nextPage);
      if (res.data.length < TRADE_HISTORY_LIMIT) {
        setHasMoreHistory(false);
      }
    } else {
        setHasMoreHistory(false);
    }
  }, [historyPage, hasMoreHistory, tradingMode, historyTrades, setHistoryTrades]);

  const fetchWallet = useCallback(async () => {
      const res = await getWallet();
      if (res.data) {
          setWallet(res.data);
      }
  }, [setWallet]);

  useEffect(() => {
      fetchWallet();
  }, [fetchWallet]);

  useEffect(() => {
      if (createTradeState?.data) {
          fetchWallet();
      }
  }, [createTradeState, fetchWallet]);

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
  }, [notification, setNotification]);

  useEffect(() => {
    const fetchInstruments = async () => {
        const result = await getInstruments();
        if (result.data && result.data.length > 0) {
          setInstruments(result.data);
        }
    };
    fetchInstruments();
    const interval = setInterval(fetchInstruments, 30000);
    return () => clearInterval(interval);
  }, [setInstruments]);

  useEffect(() => {
      if (instruments.length > 0 && activeSymbol) {
          const exists = instruments.find((i) => i.symbol === activeSymbol);
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
  }, [instruments, activeSymbol, setActiveSymbol, setNotification]);

  useEffect(() => {
    if (!activeSymbol || (historicalData[activeSymbol] && historicalData[activeSymbol].length > 0)) {
      return;
    }
    
    const loadInitialData = async () => {
      const backendSymbol = toBackendSymbol(activeSymbol);
      const now = Math.floor(Date.now() / 1000);
      const twentyFourHoursAgo = now - (24 * 60 * 60);
      
      const result = await getHistoricalData(backendSymbol, '1', twentyFourHoursAgo, now);
      
      if (result.data) {
        const formattedData = result.data.map((d: any) => ({
            ...d, 
            time: d.time
        }));
        setHistoricalData(activeSymbol, formattedData);
      }
    };
    loadInitialData();
  }, [activeSymbol, historicalData, setHistoricalData]);

  useEffect(() => {
      const fetchTrades = async () => {
          const openRes = await getOpenTrades();
          let currentOpenTrades: any[] = [];
          
          if (openRes.data) {
              currentOpenTrades = openRes.data.filter((t: any) => t.mode === tradingMode);
              setOpenTrades(currentOpenTrades);

              const currentIds = new Set(currentOpenTrades.map((t: any) => t._id));
              const prevIds = prevOpenTradesRef.current;

              if (prevIds.size > 0) {
                  const settledIds = [...prevIds].filter(id => !currentIds.has(id));
                  
                  if (settledIds.length > 0) {
                      const historyRes = await getTradeHistory(tradingMode, 1, settledIds.length); // Fetch only what's needed
                      if (historyRes.data) {
                          const recentHistory: any[] = historyRes.data;
                          settledIds.forEach(id => {
                              const trade = recentHistory.find((t) => t._id === id);
                              if (trade) {
                                  const isWin = trade.outcome === 'WIN';
                                  const payoutAmt = trade.payoutAmount ?? 0;
                                  setNotification({
                                      message: `Trade ${trade.symbol} ${trade.outcome}! Payout: $${Number(payoutAmt).toFixed(2)}`,
                                      type: isWin ? 'success' : 'error'
                                  });
                                  fetchWallet();
                              }
                          });
                      }
                  }
              }
              prevOpenTradesRef.current = currentIds;
          }
      };
      
      const fetchInitialHistory = async () => {
        setHistoryPage(1);
        setHasMoreHistory(true);
        const res = await getTradeHistory(tradingMode, 1, TRADE_HISTORY_LIMIT);
        if (res.data) {
            setHistoryTrades(res.data);
            if (res.data.length < TRADE_HISTORY_LIMIT) {
                setHasMoreHistory(false);
            }
        } else {
             setHasMoreHistory(false);
        }
      };

      fetchTrades();
      if (activeTab === 'HISTORY') {
        fetchInitialHistory();
      }

      const interval = setInterval(fetchTrades, 3000);
      return () => clearInterval(interval);
  }, [tradingMode, activeTab, createTradeState, fetchWallet, setOpenTrades, setHistoryTrades, setNotification]);

  const connectionStatus = Object.keys(ticks).length > 0 ? 'Connected' : 'Connecting';

  const processedChartData = useMemo(() => {
    const dataToProcess = historicalData[activeSymbol] || [];
    if (chartType === 'Heikin Ashi') {
      return convertToHeikinAshi(dataToProcess as any);
    }
    if (chartType === 'Area') {
      return dataToProcess.map((d) => ({ time: d.time, value: d.close }));
    }
    return dataToProcess;
  }, [historicalData, activeSymbol, chartType]);

  const chartTrades = useMemo(() => {
    return openTrades.filter(t => ((t.instrumentSymbol || t.symbol) === activeSymbol));
  }, [openTrades, activeSymbol]);

  const openTradePoints = useMemo(() => {
    const normalizeTime = (val: any): number | null => {
      if (val == null) return null;
      if (typeof val === 'number') return val > 1e12 ? Math.floor(val / 1000) : Math.floor(val);
      if (typeof val === 'string') {
        const n = Number(val);
        if (Number.isFinite(n)) return n > 1e12 ? Math.floor(n / 1000) : Math.floor(n);
        const ms = Date.parse(val);
        if (!Number.isNaN(ms)) return Math.floor(ms / 1000);
        return null;
      }
      if (typeof val === 'object' && val !== null) {
        const day = (val as any).day;
        if (day) {
          const ms = Date.parse(day);
          if (!Number.isNaN(ms)) return Math.floor(ms / 1000);
        }
      }
      return null;
    };

    return chartTrades.map((t) => {
      const rawTime = (t as any).openAt || (t as any).openedAt || t.createdAt || (t as any).time;
      const ts = normalizeTime(rawTime);
      if (ts == null) return null;
      const time = Math.floor(ts / 5) * 5;
      const price = (t as any).entryPrice ?? (t as any).price ?? null;
      const color = t.direction === 'UP' ? '#22c55e' : '#ef4444';
      const text = (t as any).stakeUsd ? `$${Number((t as any).stakeUsd).toFixed(0)}` : '';
      const expiry = (new Date(t.expiresAt).getTime() - new Date(t.createdAt).getTime()) / 1000;
      return { id: t._id, time, price, color, text, expiry };
    }).filter((x): x is any => !!x);
  }, [chartTrades]);

  return (
    <div className="flex flex-col h-screen bg-[#131722] text-gray-300 overflow-hidden font-sans relative">
      <Header />
      {notification && (
          <div className={`absolute top-14 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg font-bold transition-opacity duration-500 ${notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
              {notification.message}
          </div>
      )}
      
      <Toolbar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        instruments={instruments}
        activeSymbol={activeSymbol}
        activeInstrument={activeInstrument}
        onSelectSymbol={setActiveSymbol}
        isTradeOpen={isTradePanelSidebarOpen}
        setIsTradeOpen={setIsTradePanelSidebarOpen}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {isSidebarOpen && (
            <MarketWatch
                symbols={instruments}
                activeSymbol={activeSymbol}
                onSelectSymbol={setActiveSymbol}
            />
        )}
        
        <div className="flex-1 flex flex-col relative bg-black min-w-0">
        <div className="flex-1 flex flex-col">
                <div style={{ height: `calc(100% - ${isTradesPanelOpen ? 300 : 40}px)` }}>
                    <div className="w-full h-full relative">
                        <div className="absolute top-2 right-4 z-10">
                            <ChartTypeSelector chartType={chartType} setChartType={setChartType} />
                        </div>
                        <DynamicChart
                            data={processedChartData}
                            liveTick={latestTickForChart}
                            chartType={chartType}
                            decimals={activeInstrument?.decimalPlaces}
                          openTradePoints={openTradePoints}
                        />
                    </div>
                </div>
                
                <div 
                    style={{ height: isTradesPanelOpen ? `300px` : `40px` }}
                    className="relative bg-[#1e222d] transition-all duration-100 ease-in-out"
                >
                    <div
                        className="absolute top-0 left-0 w-full h-2 cursor-row-resize"
                    />
                    <button
                        onClick={() => setIsTradesPanelOpen(!isTradesPanelOpen)}
                        className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-12 h-6 flex items-center justify-center bg-gray-800 text-white rounded-t-md shadow-md hover:bg-gray-700 transition-colors"
                        aria-label={isTradesPanelOpen ? 'Close trades panel' : 'Open trades panel'}
                    >
                        {isTradesPanelOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                    </button>
                    <div className={`h-full flex flex-col ${isTradesPanelOpen ? '' : 'overflow-hidden'}`}>
                        <div className="flex justify-end border-b border-gray-700">
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
                        {isTradesPanelOpen && (
                            <TradesTable 
                                trades={activeTab === 'OPEN' ? openTrades : historyTrades} 
                                type={activeTab} 
                                prices={ticks}
                                loadMore={loadMoreHistory}
                                hasMore={hasMoreHistory}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
        
        <TradePanel 
            instruments={instruments}
            selectedInstrument={activeSymbol}
            setSelectedInstrument={setActiveSymbol}
            createTradeFormAction={createTradeFormAction}
            createTradeState={createTradeState}
            tradingMode={tradingMode}
            isTradePanelSidebarOpen={isTradePanelSidebarOpen}
            setIsTradePanelSidebarOpen={setIsTradePanelSidebarOpen}
            connectionStatus={connectionStatus}
        />
      </div>
    </div>
  );
}
