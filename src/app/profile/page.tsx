'use client';

import { getProfile, getWallet } from '@/actions/user';
import { useUserStore } from '@/store/user';
import { useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import SgcRedemption from './components/SgcRedemption';

export default function ProfilePage() {
  const { user, wallet, setUser, setWallet } = useUserStore();

  const fetchWalletData = useCallback(async () => {
    const walletData = await getWallet();
    if (walletData.data) {
      setWallet(walletData.data);
    }
  }, [setWallet]);

  useEffect(() => {
    async function fetchData() {
      const profile = await getProfile();
      if (profile.data) {
        setUser(profile.data);
      }
      fetchWalletData();
    }

    fetchData();
  }, [setUser, fetchWalletData]);

  if (!user || !wallet) {
    return <div>Loading...</div>;
  }

  return (
    <>
    <Header />
    <div className="min-h-screen bg-gray-100">
      <div className="py-10">
        <header>
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              Profile
            </h1>
          </div>
        </header>
        <main>
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="p-6 bg-white rounded-lg shadow">
                  <h2 className="text-lg font-medium text-gray-900">
                    Profile
                  </h2>
                  <div className="mt-4">
                    <p>
                      <strong>Full Name:</strong> {user.fullName}
                    </p>
                    <p>
                      <strong>Email:</strong> {user.email}
                    </p>
                    <p>
                      <strong>KYC Status:</strong> {user.kycStatus}
                    </p>
                    <p>
                      <strong>On-chain Address:</strong> {user.onChainAddress}
                    </p>
                  </div>
                </div>
                <div className="p-6 bg-white rounded-lg shadow">
                  <h2 className="text-lg font-medium text-gray-900">
                    Wallet
                  </h2>
                  <div className="mt-4">
                    <p>
                      <strong>Live Balance:</strong> ${wallet.liveBalanceUsd.toFixed(2)}
                    </p>
                    <p>
                      <strong>Demo Balance:</strong> ${wallet.demoBalanceUsd.toFixed(2)}
                    </p>
                    <p>
                      <strong>Currency:</strong> {wallet.currency}
                    </p>
                  </div>
                </div>
                <SgcRedemption onRedemptionSuccess={fetchWalletData} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
    </>
  );
}
