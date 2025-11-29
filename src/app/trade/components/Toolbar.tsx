import { BarChart, Menu } from 'lucide-react';

export default function Toolbar({
  isSidebarOpen,
  setIsSidebarOpen,
  activeInstrument,
  isTradeOpen,
  setIsTradeOpen,
}: {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  instruments: any[];
  activeSymbol: string;
  activeInstrument: any;
  onSelectSymbol: (symbol: string) => void;
  isTradeOpen: boolean;
  setIsTradeOpen: (isOpen: boolean) => void;
}) {
  return (
    <div className="h-10 bg-[#1e222d] border-b border-gray-700 flex items-center justify-between px-2 text-sm text-gray-400">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1 hover:bg-gray-700 rounded"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div
            className="flex items-center space-x-2 text-xs cursor-pointer p-1 hover:bg-gray-700 rounded"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
            <span className="font-bold text-white">{activeInstrument?.displayName}</span>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <span className="hidden sm:inline">{activeInstrument?.type}</span>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <span className="hidden sm:inline">Payout: {activeInstrument?.defaultPayoutPercent}%</span>
            {activeInstrument?.marketStatus && (
              <>
                <span className="text-gray-600 hidden sm:inline">|</span>
                <span className={`font-bold hidden sm:inline ${activeInstrument.isMarketOpen ? 'text-green-400' : 'text-red-400'}`}>
                  {activeInstrument.marketStatus}
                </span>
              </>
            )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setIsTradeOpen(!isTradeOpen)}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
            isTradeOpen
              ? 'bg-gray-700 text-white'
              : 'bg-gray-800 hover:bg-gray-700'
          }`}
        >
          <BarChart className="w-4 h-4" />
          <span>Trade</span>
        </button>
      </div>
    </div>
  );
}
