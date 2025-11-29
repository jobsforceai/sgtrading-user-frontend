import { create } from 'zustand';

interface Instrument {
  _id: string;
  symbol: string;
  displayName: string;
  type: string;
  decimalPlaces: number;
  defaultPayoutPercent: number;
  isMarketOpen?: boolean;
}

interface Trade {
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
}

interface HistoricalData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface TradeState {
  activeSymbol: string;
  chartType: 'Candlestick' | 'Area' | 'Bar' | 'Heikin Ashi';
  instruments: Instrument[];
  historicalData: Record<string, HistoricalData[]>;
  isSidebarOpen: boolean;
  isTradePanelSidebarOpen: boolean;
  isTradesPanelOpen: boolean;
  activeTab: 'OPEN' | 'HISTORY';
  openTrades: Trade[];
  historyTrades: Trade[];
  notification: { message: string; type: 'success' | 'error' } | null;

  setActiveSymbol: (symbol: string) => void;
  setChartType: (type: 'Candlestick' | 'Area' | 'Bar' | 'Heikin Ashi') => void;
  setInstruments: (instruments: Instrument[]) => void;
  setHistoricalData: (symbol: string, data: HistoricalData[]) => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  setIsTradePanelSidebarOpen: (isOpen: boolean) => void;
  setIsTradesPanelOpen: (isOpen: boolean) => void;
  setActiveTab: (tab: 'OPEN' | 'HISTORY') => void;
  setOpenTrades: (trades: Trade[]) => void;
  setHistoryTrades: (trades: Trade[]) => void;
  setNotification: (notification: { message: string; type: 'success' | 'error' } | null) => void;
}

export const useTradeStore = create<TradeState>((set) => ({
  activeSymbol: '',
  chartType: 'Area',
  instruments: [],
  historicalData: {},
  isSidebarOpen: false,
  isTradePanelSidebarOpen: true,
  isTradesPanelOpen: true,
  activeTab: 'OPEN',
  openTrades: [],
  historyTrades: [],
  notification: null,

  setActiveSymbol: (symbol) => set({ activeSymbol: symbol }),
  setChartType: (type) => set({ chartType: type }),
  setInstruments: (instruments) => set({ instruments }),
  setHistoricalData: (symbol, data) =>
    set((state) => ({
      historicalData: {
        ...state.historicalData,
        [symbol]: data,
      },
    })),
  setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  setIsTradePanelSidebarOpen: (isOpen) => set({ isTradePanelSidebarOpen: isOpen }),
  setIsTradesPanelOpen: (isOpen) => set({ isTradesPanelOpen: isOpen }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setOpenTrades: (trades) => set({ openTrades: trades }),
  setHistoryTrades: (trades) => set({ historyTrades: trades }),
  setNotification: (notification) => set({ notification }),
}));
