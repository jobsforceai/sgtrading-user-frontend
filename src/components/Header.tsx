'use client';

import { useAuthStore } from '@/store/auth';
import { useUserStore } from '@/store/user';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { User, LogOut, Bot, LineChart } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuthStore();
  const { wallet, tradingMode, setTradingMode } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const currentBalance = wallet
    ? tradingMode === 'LIVE'
      ? wallet.liveBalanceUsd
      : wallet.demoBalanceUsd
    : 0;

  const navLinks = [
    { href: '/trade', label: 'Trade', icon: LineChart },
    { href: '/bots', label: 'Bots', icon: Bot },
  ];

  return (
    <header className="bg-[#1e222d] border-b border-gray-700 text-gray-300">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/50">
                <div className="h-4 w-4 rounded-lg bg-emerald-400" />
              </div>
              <span className="text-sm font-semibold tracking-widest text-emerald-300 uppercase">
                SGTrading
              </span>
            </Link>
          </div>

          {/* Center: Navigation */}
          {user && (
            <div className="hidden md:flex items-center space-x-2 bg-gray-900/50 rounded-lg p-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-2 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    pathname === link.href
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Right: User actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2 bg-gray-900/50 rounded-lg p-1">
                  <button
                    onClick={() => setTradingMode('DEMO')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                      tradingMode === 'DEMO'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    DEMO
                  </button>
                  <button
                    onClick={() => setTradingMode('LIVE')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                      tradingMode === 'LIVE'
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    LIVE
                  </button>
                </div>

                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs text-gray-500 uppercase">
                    {tradingMode} Balance
                  </span>
                  <span className="text-sm font-bold text-gray-200">
                    {wallet?.currency || '$'} {currentBalance.toFixed(2)}
                  </span>
                </div>

                <Link href="/profile" className="text-gray-400 hover:text-white">
                  <User className="w-5 h-5" />
                </Link>

                <button onClick={handleLogout} className="text-gray-400 hover:text-white">
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 text-sm font-medium text-gray-400 hover:text-white"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
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
