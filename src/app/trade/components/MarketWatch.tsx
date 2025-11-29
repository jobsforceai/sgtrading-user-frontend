
'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { debounce } from 'lodash';

type Instrument = {
  _id: string;
  symbol: string;
  displayName: string;
  type: string;
  decimalPlaces: number;
  defaultPayoutPercent: number;
};

const MarketWatch = ({ symbols, activeSymbol, onSelectSymbol }: { symbols: Instrument[], activeSymbol: string, onSelectSymbol: (symbol: string) => void }) => {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['CRYPTO', 'FOREX', 'STOCK', 'COMMODITY']));
  const [searchTerm, setSearchTerm] = useState('');

  const debouncedSetSearchTerm = debounce(setSearchTerm, 300);

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
    <div className="absolute top-0 left-0 h-full w-full sm:w-80 z-30 shadow-xl bg-[#1e222d] border-r border-gray-700 flex flex-col">
      <div className="h-8 flex items-center justify-between px-2 bg-[#2a2e39] border-b border-gray-700">
        <span className="text-xs font-semibold text-gray-300">Market Watch</span>
      </div>
      <div className="p-2 border-b border-gray-700">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search assets..."
            onChange={(e) => debouncedSetSearchTerm(e.target.value)}
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

export default React.memo(MarketWatch);