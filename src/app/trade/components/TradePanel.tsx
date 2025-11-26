import React from 'react';
import { ChevronRight, ChevronLeft, Wifi, WifiOff, ArrowUp, ArrowDown } from 'lucide-react';
import { useUserStore } from '@/store/user';
import SearchableDropdown from '@/components/ui/SearchableDropdown';

type Instrument = {
  _id: string;
  symbol: string;
  displayName: string;
};

type CreateTradeState = {
  error?: string;
  data?: unknown;
};

export default function TradePanel({
  instruments,
  selectedInstrument,
  setSelectedInstrument,
  createTradeFormAction,
  createTradeState,
  tradingMode,
  isTradePanelSidebarOpen,
  setIsTradePanelSidebarOpen,
  connectionStatus,
}: {
  instruments: Instrument[];
  selectedInstrument: string;
  setSelectedInstrument: (symbol: string) => void;
  createTradeFormAction: (payload: FormData) => void;
  createTradeState: CreateTradeState | undefined;
  tradingMode: string;
  isTradePanelSidebarOpen: boolean;
  setIsTradePanelSidebarOpen: (isOpen: boolean) => void;
  connectionStatus: string;
}) {
  const { wallet } = useUserStore();
  const [stake, setStake] = React.useState<number>(10);

  const currentBalance = wallet
    ? tradingMode === 'LIVE'
      ? wallet.liveBalanceUsd
      : wallet.demoBalanceUsd
    : 0;

  const isInsufficientFunds = stake > currentBalance;

  const instrumentOptions = instruments.map((inst) => ({
    value: inst.symbol,
    label: inst.displayName,
  }));

  return (
    <div className="relative">
      <button
        onClick={() => setIsTradePanelSidebarOpen(!isTradePanelSidebarOpen)}
        className="absolute top-0 left-0 z-20 w-8 h-full flex items-center justify-center text-white rounded-full cursor-pointer transition-colors"
        aria-label={isTradePanelSidebarOpen ? 'Close trade panel' : 'Open trade panel'}
      >
        {isTradePanelSidebarOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
      <div
        className={`shrink-0 border-l border-gray-700 transition-all pl-8 duration-300 ease-in-out
                  ${isTradePanelSidebarOpen ? 'w-80 p-4' : 'w-8 overflow-hidden'}
                  flex flex-col`}
      >
        {isTradePanelSidebarOpen && (
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Trade</h2>
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
            <div className="flex justify-center">
              <span
                className={`px-3 py-1 text-xs font-bold rounded-full ${
                  tradingMode === 'LIVE' ? 'bg-green-600 text-white' : 'bg-orange-500 text-white'
                }`}
              >
                {tradingMode} MODE
              </span>
            </div>
            <form action={createTradeFormAction} className="space-y-4">
              <input type="hidden" name="mode" value={tradingMode} />
              <input type="hidden" name="symbol" value={selectedInstrument} />
              <div>
                <label htmlFor="instrument" className="block text-sm font-medium text-gray-400">
                  Asset
                </label>
                <SearchableDropdown
                  options={instrumentOptions}
                  value={selectedInstrument}
                  onChange={setSelectedInstrument}
                />
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
                  className={`w-full px-3 py-2 mt-1 bg-gray-800 border rounded-md shadow-sm focus:outline-none sm:text-sm text-white ${
                    isInsufficientFunds
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-600 focus:border-emerald-500'
                  }`}
                  value={stake}
                  onChange={(e) => setStake(parseFloat(e.target.value))}
                  min="1"
                />
                {isInsufficientFunds && (
                  <p className="text-xs text-red-500 mt-1">
                    Insufficient {tradingMode.toLowerCase()} funds
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="expiry" className="block text-sm font-medium text-gray-400">
                  Duration (s)
                </label>
                <input
                  id="expiry"
                  name="expirySeconds"
                  type="number"
                  required
                  min="10"
                  className="w-full px-3 py-2 mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-white"
                  defaultValue="60"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  name="direction"
                  value="UP"
                  disabled={isInsufficientFunds}
                  className={`w-full px-4 py-3 text-sm font-bold text-white rounded-md transition-opacity flex items-center justify-center gap-2 ${
                    isInsufficientFunds
                      ? 'bg-emerald-800 opacity-50 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <ArrowUp className="w-5 h-5" />
                  Up
                </button>
                <button
                  type="submit"
                  name="direction"
                  value="DOWN"
                  disabled={isInsufficientFunds}
                  className={`w-full px-4 py-3 text-sm font-bold text-white rounded-md transition-opacity flex items-center justify-center gap-2 ${
                    isInsufficientFunds
                      ? 'bg-red-800 opacity-50 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  <ArrowDown className="w-5 h-5" />
                  Down
                </button>
              </div>
              {createTradeState?.error && (
                <p className="text-sm text-red-500 text-center">{createTradeState.error}</p>
              )}
              {createTradeState && !createTradeState.error && (
                <p className="text-sm text-green-500 text-center">Trade created!</p>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
