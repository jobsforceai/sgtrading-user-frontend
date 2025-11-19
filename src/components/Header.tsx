'use client';

import { useAuthStore } from '@/store/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-white shadow">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-indigo-600">
              SGTrading
            </Link>
          </div>
          <div className="flex items-center">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-3 py-2 text-sm font-medium text-gray-500 rounded-md hover:text-gray-700"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/market"
                  className="px-3 py-2 text-sm font-medium text-gray-500 rounded-md hover:text-gray-700"
                >
                  Market
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
