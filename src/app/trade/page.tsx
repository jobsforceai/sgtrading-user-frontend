'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Shield, Bot, ChevronDown, ChevronUp } from 'lucide-react';
import { useSubscriptionMarketData, MarketTick } from '@/hooks/useSubscriptionMarketData';
import { useSubscriptionTradeData } from '@/hooks/useSubscriptionTradeData';
import { getInstruments } from '@/actions/market';
import { getHistoricalData, createTrade } from '@/actions/trade';
import { getWallet } from '@/actions/user';
import { toBackendSymbol } from '@/lib/symbolMapping';
import { useActionState } from 'react';
import DynamicChart from '@/components/DynamicChart';
import { ChartTypeSelector } from '@/components/ChartTypeSelector';
import { convertToHeikinAshi } from '@/lib/heikinAshi';
import { useUserStore } from '@/store/user';
import MarketWatch from './components/MarketWatch';
import { useTradeStore } from '@/store/trade';
import TradePanel from './components/TradePanel';
import Toolbar from './components/Toolbar';
import Header from '@/components/Header';
import TradesTable from './components/TradesTable';
import Confetti from 'react-confetti';

type Instrument = {
  _id: string;
  symbol: string;
  displayName: string;
  type: string;
  decimalPlaces: number;
  defaultPayoutPercent: number;
  isMarketOpen?: boolean;
  marketStatus?: string;
  tradingHours?: any;
};

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
    setNotification,
  } = useTradeStore();

  const [createTradeState, createTradeFormAction] = useActionState(createTrade, undefined);
  const { tradingMode, setWallet } = useUserStore();
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });

  useSubscriptionTradeData();

  useEffect(() => {
    // Set window dimensions on client side
    setWindowDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });
    
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchWallet = React.useCallback(async () => {
      const res = await getWallet();
      if (res && !res.error) {
          setWallet(res);
      }
  }, [setWallet]);

  useEffect(() => {
      fetchWallet();
  }, [fetchWallet]);

  useEffect(() => {
      if (createTradeState?.data) {
          fetchWallet();
          // Trigger confetti on successful trade
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
      }
  }, [createTradeState, fetchWallet]);

  const subscriptionSymbols = useMemo(() => {
    if (!activeSymbol) return [];
    return [toBackendSymbol(activeSymbol)];
  }, [activeSymbol]);

  const ticks = useSubscriptionMarketData(subscriptionSymbols);

  const activeInstrument = useMemo(() => {
    const instrument = instruments.find(i => i.symbol === activeSymbol);
    if (!instrument) return undefined;

    return {
        ...instrument,
        isMarketOpen: instrument.isMarketOpen, // Directly use the flag from the API
    };
  }, [instruments, activeSymbol]);

  useEffect(() => {
    if (activeInstrument) {
      console.log('Active Instrument Data:', activeInstrument);
    }
  }, [activeInstrument]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, setNotification]);

  useEffect(() => {
    const fetchInstruments = async () => {
      try {
        const result = await getInstruments();
        if (result && Array.isArray(result) && result.length > 0) {
          setInstruments(result);
        } else if (result?.error) {
          console.error('Error fetching instruments:', result.error);
        } else {
          console.warn('Received empty or invalid data for instruments:', result);
        }
      } catch (err) {
        console.error('Caught exception during fetchInstruments:', err);
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
      
      if (result && !result.error) {
        const formattedData = result.map((d: any) => ({
            ...d, 
            time: d.time
        }));
        setHistoricalData(activeSymbol, formattedData);
      }
    };
    loadInitialData();
  }, [activeSymbol, historicalData, setHistoricalData]);

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

  const openTradePoints = useMemo(() => {
    const backendSym = toBackendSymbol(activeSymbol);
    const latestPrice = ticks[backendSym]?.last;

    return openTrades
      .filter(t => ((t.instrumentSymbol || t.symbol) === activeSymbol))
      .map(trade => {
        let isWinning = null;
        if (latestPrice) {
          if (trade.direction === 'UP') {
            isWinning = latestPrice > trade.entryPrice;
          } else {
            isWinning = latestPrice < trade.entryPrice;
          }
        }
        
        // Compute expiry time if not present (for real-time prediction)
        let computedExpiresAt = trade.expiresAt;
        if (!computedExpiresAt && trade.requestedExpirySeconds && trade.openAt) {
          // Parse openAt to timestamp
          const openTime = new Date(trade.openAt).getTime();
          const expiryTime = openTime + (trade.requestedExpirySeconds * 1000);
          computedExpiresAt = new Date(expiryTime).toISOString();
        }
        
        return { ...trade, isWinning, expiresAt: computedExpiresAt };
      });
  }, [openTrades, activeSymbol, ticks]);

  return (
    <div className="flex flex-col h-screen bg-[#131722] text-gray-300 overflow-hidden font-sans relative">
      {showConfetti && windowDimensions.width > 0 && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <Confetti
            width={windowDimensions.width}
            height={windowDimensions.height}
            recycle={false}
            numberOfPieces={300}
            gravity={0.2}
            colors={['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB']}
          />
        </div>
      )}
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
          {isTradePanelSidebarOpen && <div className="md:hidden absolute inset-0 bg-black/50 z-30" onClick={() => setIsTradePanelSidebarOpen(false)} />}
          <div className="flex-1 flex flex-col">
                <div style={{ height: `calc(100% - ${isTradesPanelOpen ? 300 : 40}px)` }}>
                    <div className="w-full h-full relative">
                        <div className="absolute top-2 right-4 z-10">
                            <ChartTypeSelector chartType={chartType} setChartType={setChartType} />
                        </div>
                        <DynamicChart
                            data={processedChartData}
                            liveTick={ticks[toBackendSymbol(activeSymbol)]}
                            chartType={chartType}
                            decimals={activeInstrument?.decimalPlaces}
                            openTradePoints={openTradePoints}
                            isMarketOpen={activeInstrument?.isMarketOpen}
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
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>

        <div className={`
          md:static absolute inset-y-0 right-0 z-40
          transition-transform duration-300 ease-in-out
          ${isTradePanelSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
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
              activeInstrument={activeInstrument}
          />
        </div>
      </div>
    </div>
  );
}
