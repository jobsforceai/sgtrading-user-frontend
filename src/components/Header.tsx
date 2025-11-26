'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useUserStore } from '@/store/user';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { UserCircle2, LogOut, Bot, LineChart, Landmark } from 'lucide-react';
import ProfileSidebar from './ProfileSidebar';

export default function Header() {
  const { user, logout } = useAuthStore();
  const { wallet, tradingMode, setTradingMode } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isProfileSidebarOpen, setIsProfileSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
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
    { href: '/vaults', label: 'Vaults', icon: Landmark },
  ];

  return (
    <>
      <header className="bg-[#1e222d] border-b border-gray-700 text-gray-300">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left: Logo */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--bg-accent-subtle)] ring-1 ring-[var(--ring-accent)]">
                  <div className="h-4 w-4 rounded-lg bg-[var(--dot-accent)]" />
                </div>
                <span className="text-sm font-semibold tracking-widest text-[var(--color-accent-text)] uppercase">
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
                        ? 'bg-[var(--color-accent-active)] text-white shadow-sm'
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
            <div className="flex items-center space-x-6">
              {user ? (
                <>
                  <div className="relative flex items-center bg-gray-900/50 rounded-full p-1 w-32">
                    <div
                      className={`absolute top-1 bottom-1 w-1/2 rounded-full transition-all duration-300 ease-in-out ${
                        tradingMode === 'DEMO'
                          ? 'translate-x-full bg-orange-500'
                          : 'translate-x-0 bg-green-600'
                      }`}
                    />
                    <button
                      onClick={() => setTradingMode('LIVE')}
                      className="relative z-10 w-1/2 py-1 text-xs font-bold text-white"
                    >
                      LIVE
                    </button>
                    <button
                      onClick={() => setTradingMode('DEMO')}
                      className="relative z-10 w-1/2 py-1 pl-3 text-xs font-bold text-white"
                    >
                      DEMO
                    </button>
                  </div>

                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-xs text-gray-500 uppercase">
                      {tradingMode} Balance
                    </span>
                    <span className="text-sm font-bold text-gray-200">
                      {wallet?.currency || '$'} {currentBalance.toFixed(2)}
                    </span>
                    {wallet && (
                      <span className="text-xs font-medium text-gray-500">
                        ~ {(currentBalance / 115).toFixed(2)} SGC
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setIsProfileSidebarOpen(true)}
                    className="relative text-gray-400 hover:text-white transition-transform duration-200 hover:scale-110"
                  >
                    <UserCircle2 className="w-7 h-7" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--color-accent-active)] rounded-full animate-pulse" />
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors text-red-400 bg-red-900/20 hover:bg-red-900/40"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
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
                    className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-accent)] rounded-md hover:bg-[var(--color-accent-hover)]"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      {user && (
        <ProfileSidebar
          isOpen={isProfileSidebarOpen}
          onClose={() => setIsProfileSidebarOpen(false)}
        />
      )}
    </>
  );
}
