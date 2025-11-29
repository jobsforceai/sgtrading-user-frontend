'use client';

import { useState } from 'react';
import { useUIStore } from '@/store/ui';
import { X,Coins } from 'lucide-react';

export default function LowBalanceModal({
  onClose,
  liveBalance,
}: {
  onClose: () => void;
  liveBalance: number;
}) {
  const { openProfileSidebar } = useUIStore();

  const handleDepositClick = () => {
    openProfileSidebar();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-center">
      <div className="bg-[#1e222d] rounded-lg shadow-xl w-full max-w-sm m-4 border border-gray-700">
        <div className="flex justify-between items-center p-5 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            Low Balance Alert
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 text-center">
          <p className="text-sm text-gray-300 mb-2">
            Your current live balance is:
          </p>
          <p className="text-3xl font-bold text-white mb-6">
            ${liveBalance.toFixed(2)}
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Top up your account now to continue trading without interruptions.
          </p>
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleDepositClick}
              className="px-5 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-semibold transition-colors"
            >
              Deposit Now
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-gray-400 hover:text-white"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
