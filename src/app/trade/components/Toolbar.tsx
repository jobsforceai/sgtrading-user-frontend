import React from 'react';
import { Bot, ChevronDown } from 'lucide-react';

type Instrument = {
    _id: string;
    symbol: string;
    displayName: string;
    type: string;
};

export default function Toolbar({
  isSidebarOpen,
  setIsSidebarOpen,
  instruments,
  activeSymbol,
  activeInstrument,
  onSelectSymbol,
  isTradeOpen,
  setIsTradeOpen,
  toggleTrade,
  toggleSidebar,
}: {
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  instruments: Instrument[];
  activeSymbol: string;
  activeInstrument: Instrument | undefined;
  onSelectSymbol: (symbol: string) => void;
  isTradeOpen: boolean;
  setIsTradeOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleTrade?: () => void;
  toggleSidebar?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const categories = [
    { id: 'CRYPTO', label: 'Cryptocurrency' },
    { id: 'FOREX', label: 'Forex' },
    { id: 'STOCK', label: 'Stocks' },
    { id: 'COMMODITY', label: 'Commodities' },
  ];

  return (
    <div className="bg-[#2a2e39] border-b border-gray-700 h-9 flex items-center justify-between px-2 overflow-x-auto scrollbar-hide select-none">
      <div className="flex items-center">
        {/* Selected asset + dropdown */}
        <div className="relative">
          <button
            onClick={() => {
                  // debug: log click from toolbar
                  // eslint-disable-next-line no-console
                  console.log('Toolbar: asset button clicked, current open:', open);
                  if (toggleSidebar) toggleSidebar();
                  else setIsSidebarOpen((s) => !s);
                  setOpen((s) => !s);
                }}
            aria-haspopup="true"
            aria-expanded={open}
            className="flex items-center gap-3 px-3 py-2 rounded-md bg-[#0f1113] border border-gray-700 text-sm text-gray-200"
          >
            <span className="font-medium text-sm truncate max-w-[220px]">
              {activeInstrument?.displayName || activeSymbol || 'Select asset'}
            </span>
            <div className="ml-auto">
              <ChevronDown className={`w-4 h-4 text-gray-300 ${open ? 'transform rotate-180' : ''}`} />
            </div>
          </button>

          {open && (
            <div className="absolute left-2 mt-2 w-80 max-h-64 overflow-auto rounded bg-[#1e222d] border border-gray-700 shadow-lg z-50">
              <div className="p-2">
                <div className="px-2 pb-2">
                  <input
                    type="search"
                    placeholder="Search assets..."
                    className="w-full px-3 py-2 bg-[#16181b] border border-gray-700 rounded text-sm text-gray-200"
                    onChange={(e) => setSearch(e.target.value)}
                    value={search}
                  />
                </div>
                {categories.map((cat) => {
                  const searchLower = search.trim().toLowerCase();
                  const catSymbols = instruments.filter((s) => s.type === cat.id);
                  const filtered = searchLower
                    ? catSymbols.filter(
                        (s) =>
                          s.displayName?.toLowerCase().includes(searchLower) ||
                          s.symbol?.toLowerCase().includes(searchLower),
                      )
                    : catSymbols;
                  if (filtered.length === 0) return null;
                  return (
                    <div key={cat.id} className="mb-2">
                      <div className="px-2 py-1 text-xs font-bold text-gray-400">{cat.label}</div>
                      <div>
                        {filtered.map((s) => (
                          <button
                            key={s.symbol}
                            onClick={() => {
                              onSelectSymbol(s.symbol);
                              setOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1 text-sm rounded hover:bg-[#2a2e39] ${activeSymbol === s.symbol ? 'bg-[#2a2e39] text-white' : 'text-gray-300'}`}
                          >
                            {s.displayName}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center">
        {/* Trade toggle button (aligned right) */}
        <button
          onClick={() => {
            if (toggleTrade) toggleTrade();
            else setIsTradeOpen((s) => !s);
          }}
          aria-label="Toggle trade panel"
          aria-pressed={!!isTradeOpen}
          className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-[#0f1113] border border-gray-700 text-sm text-gray-200 hover:bg-[#16181b]"
        >
          <Bot className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline text-xs">Trade</span>
        </button>
      </div>
    </div>
  );
}
