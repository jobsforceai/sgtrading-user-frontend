import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useUserStore } from '@/store/user';

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
}: {
  instruments: Instrument[];
  selectedInstrument: string;
  setSelectedInstrument: (symbol: string) => void;
  createTradeFormAction: (payload: FormData) => void;
  createTradeState: CreateTradeState | undefined;
  tradingMode: string;
  isTradePanelSidebarOpen: boolean;
  setIsTradePanelSidebarOpen: (isOpen: boolean) => void;
}) {
  const { wallet } = useUserStore();
  const [stake, setStake] = useState<number>(10);

  const currentBalance = wallet
    ? tradingMode === 'LIVE'
      ? wallet.liveBalanceUsd
      : wallet.demoBalanceUsd
    : 0;

  const isInsufficientFunds = stake > currentBalance;

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
            <h2 className="text-xl font-semibold text-center text-white">Trade</h2>
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
              <div>
                <label htmlFor="instrument" className="block text-sm font-medium text-gray-400">
                  Asset
                </label>
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
                  className={`w-full px-3 py-2 mt-1 bg-gray-800 border rounded-md shadow-sm focus:outline-none sm:text-sm text-white ${
                    isInsufficientFunds
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-600 focus:border-indigo-500'
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
                  className={`w-full px-4 py-3 text-sm font-bold text-white rounded-md transition-opacity ${
                    isInsufficientFunds
                      ? 'bg-green-800 opacity-50 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  Up
                </button>
                <button
                  type="submit"
                  name="direction"
                  value="DOWN"
                  disabled={isInsufficientFunds}
                  className={`w-full px-4 py-3 text-sm font-bold text-white rounded-md transition-opacity ${
                    isInsufficientFunds
                      ? 'bg-red-800 opacity-50 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
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
