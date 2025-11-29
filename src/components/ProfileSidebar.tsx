'use client';

import { getProfile, getWallet } from '@/actions/user';
import { getMyVaultParticipations } from '@/actions/vault';
import { useUserStore } from '@/store/user';
import { useEffect, useCallback, useState } from 'react';
import SgcRedemption from '@/components/SgcRedemption';
import SgcWithdrawal from '@/components/SgcWithdrawal';
import { X } from 'lucide-react';
import CollapsibleSection from './ui/CollapsibleSection';

export default function ProfileSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, wallet, setUser, setWallet } = useUserStore();
  const [participations, setParticipations] = useState<any[]>([]);

  const fetchWalletData = useCallback(async () => {
    const walletData = await getWallet();
    if (walletData && !walletData.error) {
      setWallet(walletData);
    }
  }, [setWallet]);

  const fetchVaultParticipations = useCallback(async () => {
    const participationsData = await getMyVaultParticipations();
    if (participationsData && !participationsData.error) {
      setParticipations(participationsData);
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      const profile = await getProfile();
      if (profile && !profile.error) {
        setUser(profile);
      }
      fetchWalletData();
      fetchVaultParticipations();
    }

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, setUser, fetchWalletData, fetchVaultParticipations]);

  return (
    <div
      className={`fixed top-0 right-0 h-full bg-black/80 backdrop-blur-lg z-50 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } w-96 p-6 flex flex-col`}
    >
      <div className="flex justify-between items-center pb-4 border-b border-gray-700/50">
        <h2 className="text-2xl font-bold text-white">Profile</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto mt-6">
        {!user || !wallet ? (
          <div className="text-white">Loading...</div>
        ) : (
          <div className="space-y-2">
            <CollapsibleSection title="👤 Personal Details">
              <div className="space-y-2">
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
                  <strong>On-chain Address:</strong> <span className="break-all">{user.onChainAddress}</span>
                </p>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="💰 Wallet">
              <div className="space-y-2">
                <p>
                  <strong>Total Balance:</strong> ${(wallet.liveBalanceUsd + (wallet.bonusBalanceUsd ?? 0)).toFixed(2)}
                </p>
                <p>
                  <strong>Withdrawable (Live):</strong> ${wallet.liveBalanceUsd.toFixed(2)}
                </p>
                 <p>
                  <strong>Bonus Balance:</strong> ${(wallet.bonusBalanceUsd ?? 0).toFixed(2)}
                </p>
                <p>
                  <strong>Demo Balance:</strong> ${wallet.demoBalanceUsd.toFixed(2)}
                </p>
                <p>
                  <strong>Currency:</strong> {wallet.currency}
                </p>
              </div>
            </CollapsibleSection>

            {participations.length > 0 && (
              <CollapsibleSection title="🔒 Locked in Vaults">
                <div className="space-y-2">
                  {participations.map((p) => (
                    <div key={p._id} className="flex justify-between text-xs">
                      <span>{p.vault.name}</span>
                      <span className="font-semibold">${p.amountUsd.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}
            
            <CollapsibleSection title="💵 Deposit">
              <SgcRedemption onRedemptionSuccess={fetchWalletData} />
            </CollapsibleSection>

            <CollapsibleSection title="📤 Withdraw">
                <SgcWithdrawal onWithdrawalSuccess={fetchWalletData} />
            </CollapsibleSection>
          </div>
        )}
      </div>
    </div>
  );
}