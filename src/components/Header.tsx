'use client';

import { getWallet } from '@/actions/user';
import LowBalanceModal from './ui/LowBalanceModal';
import { useUIStore } from '@/store/ui';
import { useAuthStore } from '@/store/auth';
import { useUserStore } from '@/store/user';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { UserCircle2, LogOut, Bot, LineChart, Landmark, Menu, X } from 'lucide-react';
import ProfileSidebar from './ProfileSidebar';
import Image from 'next/image';

export default function Header() {
  const { user, logout } = useAuthStore();
  const { wallet, tradingMode, setTradingMode, setWallet } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();
  const { isProfileSidebarOpen, openProfileSidebar, closeProfileSidebar } = useUIStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLowBalanceModal, setShowLowBalanceModal] = useState(false);

  // Effect to check balance on login
  useEffect(() => {
    const checkBalance = async () => {
      if (user && !wallet) { // Only run if we have a user but haven't checked the wallet yet
        const walletData = await getWallet();
        if (walletData && !walletData.error) {
          setWallet(walletData); // Set wallet in the store
          if (walletData.liveBalanceUsd < 100) {
            setShowLowBalanceModal(true);
          }
        }
      }
    };
    checkBalance();
  }, [user, wallet, setWallet]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobileMenuOpen]);

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
      <header className="bg-[#1e222d] border-b border-gray-700 text-gray-300 relative z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left: Logo */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-900 ring-1 ring-[var(--ring-accent)]">
                  <Image src="/bull.png" alt="Logo" width={40} height={40} />
                </div>
                <span className="text-sm font-semibold tracking-widest text-[var(--color-accent-text)] uppercase">
                  360Trader
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
            <div className="hidden md:flex items-center space-x-6">
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
                    onClick={openProfileSidebar}
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
             {/* Mobile Menu Button */}
             <div className="md:hidden">
                {user && (
                    <button onClick={() => setIsMobileMenuOpen(true)}>
                        <Menu className="w-6 h-6" />
                    </button>
                )}
            </div>
          </div>
        </div>
      </header>
       {/* Mobile Menu Overlay */}
       {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col p-4">
            <div className="flex justify-between items-center mb-8">
                <span className="text-lg font-bold text-white">Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="w-6 h-6" />
                </button>
            </div>
            <nav className="flex flex-col space-y-4">
                 {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-4 p-4 rounded-lg text-lg ${
                      pathname === link.href
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <link.icon className="w-6 h-6" />
                    <span>{link.label}</span>
                  </Link>
                ))}
            </nav>
            <div className="mt-auto border-t border-gray-700 pt-4 space-y-4">
                <div className="flex flex-col items-center">
                    <span className="text-sm text-gray-500 uppercase">
                      {tradingMode} Balance
                    </span>
                    <span className="text-2xl font-bold text-gray-200">
                      {wallet?.currency || '$'} {currentBalance.toFixed(2)}
                    </span>
                </div>
                 <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 p-4 text-lg rounded-lg transition-colors text-red-400 bg-red-900/20 hover:bg-red-900/40"
                  >
                    <LogOut className="w-6 h-6" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
      )}
      {user && (
        <ProfileSidebar
          isOpen={isProfileSidebarOpen}
          onClose={closeProfileSidebar}
        />
      )}
      {showLowBalanceModal && wallet && (
        <LowBalanceModal 
          onClose={() => setShowLowBalanceModal(false)}
          liveBalance={wallet.liveBalanceUsd}
        />
      )}
    </>
  );
}
