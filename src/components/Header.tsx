'use client';

import { useAuthStore } from '@/store/auth';
import { useUserStore } from '@/store/user';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, logout } = useAuthStore();
  const { wallet, tradingMode, setTradingMode } = useUserStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const currentBalance = wallet
    ? tradingMode === 'LIVE'
      ? wallet.liveBalanceUsd
      : wallet.demoBalanceUsd
    : 0;

  return (
    <header className="bg-white shadow">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-indigo-600">
              SGTrading
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setTradingMode('DEMO')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      tradingMode === 'DEMO'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Demo
                  </button>
                  <button
                    onClick={() => setTradingMode('LIVE')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      tradingMode === 'LIVE'
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Live
                  </button>
                </div>

                <div className="flex flex-col items-end mr-4">
                  <span className="text-xs text-gray-500 uppercase">
                    {tradingMode} Balance
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {wallet?.currency || '$'} {currentBalance.toFixed(2)}
                  </span>
                </div>

                <Link
                  href="/dashboard"
                  className="px-3 py-2 text-sm font-medium text-gray-500 rounded-md hover:text-gray-700"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/bots"
                  className="px-3 py-2 text-sm font-medium text-gray-500 rounded-md hover:text-gray-700"
                >
                  Bots
                </Link>
                <Link
                  href="/dashboard/trade"
                  className="px-3 py-2 text-sm font-medium text-gray-500 rounded-md hover:text-gray-700"
                >
                  Trade
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 text-sm font-medium text-gray-500 rounded-md hover:text-gray-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 text-sm font-medium text-gray-500 rounded-md hover:text-gray-700"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-2 text-sm font-medium text-gray-500 rounded-md hover:text-gray-700"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
