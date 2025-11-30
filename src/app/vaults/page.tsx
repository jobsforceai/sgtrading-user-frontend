'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { getVaults, depositToVault, activateVault, createVault, withdrawFromVault } from '@/actions/vault';
import { getBots } from '@/actions/bot';
import { getWallet } from '@/actions/user';
import { useUserStore } from '@/store/user';
import { Landmark, ShieldCheck, X, Plus, Timer } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import Confetti from 'react-confetti';

type Vault = any; 
type Bot = any;

const strategies = [
  { id: 'RSI_STRATEGY', name: 'RSI', isPremium: false },
  { id: 'MACD_STRATEGY', name: 'MACD', isPremium: true },
  { id: 'SMA_CROSSOVER', name: 'SMA Crossover', isPremium: true },
  { id: 'RANDOM_TEST', name: 'Random', isPremium: false },
];

const getFeeTier = (strategyId: string) => {
    const strategy = strategies.find(s => s.id === strategyId);
    return strategy?.isPremium ? { name: 'Premium', fee: 25 } : { name: 'Free', fee: 5 };
}

const Countdown = ({ toDate }: { toDate: string }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const target = new Date(toDate);
            const diff = target.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft('Ended');
                clearInterval(interval);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / 1000 / 60) % 60);

            setTimeLeft(`${days}d ${hours}h ${minutes}m`);

        }, 1000);

        return () => clearInterval(interval);
    }, [toDate]);

    return <div className="flex items-center text-xs text-yellow-400"><Timer className="w-3 h-3 mr-1" /> {timeLeft}</div>;
};

const RefundCountdown = ({ createdAt }: { createdAt: string }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const tenDaysFromCreation = new Date(createdAt).getTime() + (10 * 24 * 60 * 60 * 1000);

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const diff = tenDaysFromCreation - now;

            if (diff <= 0) {
                setTimeLeft('Withdrawal available');
                clearInterval(interval);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            
            setTimeLeft(`Withdrawal available in: ${days}d ${hours}h`);

        }, 1000);

        return () => clearInterval(interval);
    }, [createdAt]);

    return <div className="text-xs text-gray-500 mt-1">{timeLeft}</div>;
}


export default function VaultsPage() {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const { setWallet } = useUserStore();
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });

  const fetchVaultsAndWallet = useCallback(async () => {
    getVaults().then(res => {
      if (res && !res.error) setVaults(res);
    });
    getWallet().then(res => {
      if (res && !res.error) setWallet(res);
    });
  }, [setWallet]);

  useEffect(() => {
    // Set window dimensions on client side
    setWindowDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });
    
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchVaultsAndWallet();
  }, [fetchVaultsAndWallet]);
  
  const onActionSuccess = () => {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      fetchVaultsAndWallet();
      setIsModalOpen(false);
      setIsCreateModalOpen(false);
      setIsActivateModalOpen(false);
  }

  const handleDepositClick = (vault: Vault) => {
    setSelectedVault(vault);
    setIsModalOpen(true);
  };
  
  const handleActivateClick = (vault: Vault) => {
    setSelectedVault(vault);
    setIsActivateModalOpen(true);
  };

  const handleActivateConfirm = async () => {
    if (!selectedVault) return;
    await activateVault(selectedVault._id);
    onActionSuccess();
  };
  
  const handleWithdraw = async (vaultId: string) => {
      if (!window.confirm("Are you sure you want to withdraw your funds? This can only be done during the funding phase.")) return;
      await withdrawFromVault(vaultId);
      onActionSuccess();
  }

  const { activeVaults, historyVaults } = React.useMemo(() => {
    const active: Vault[] = [];
    const history: Vault[] = [];
    vaults.forEach(vault => {
        if (vault.status === 'FUNDING' || vault.status === 'ACTIVE') {
            active.push(vault);
        } else {
            history.push(vault);
        }
    });
    return { activeVaults: active, historyVaults: history };
  }, [vaults]);

  const vaultsToDisplay = activeTab === 'ACTIVE' ? activeVaults : historyVaults;

  return (
    <div className="min-h-screen bg-black text-gray-300 p-6">
      {showConfetti && windowDimensions.width > 0 && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <Confetti
            width={windowDimensions.width}
            height={windowDimensions.height}
            recycle={false}
            numberOfPieces={300}
            gravity={0.2}
            colors={['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB']}
          />
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h1 className="text-2xl font-bold text-white">Investment Vaults</h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Create New Vault</span>
          </button>
        </div>
        
        <div className="mb-6 border-b border-gray-700">
            <div className="flex space-x-4">
                <button 
                    onClick={() => setActiveTab('ACTIVE')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'ACTIVE' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-white'}`}
                >
                    Active ({activeVaults.length})
                </button>
                <button 
                    onClick={() => setActiveTab('HISTORY')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'HISTORY' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-white'}`}
                >
                    History ({historyVaults.length})
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vaultsToDisplay.map((vault) => (
            <VaultCard 
              key={vault._id} 
              vault={vault} 
              onDepositClick={() => handleDepositClick(vault)}
              onActivateClick={() => handleActivateClick(vault)}
              onWithdrawClick={() => handleWithdraw(vault._id)}
            />
          ))}
        </div>
      </div>
      
      {isModalOpen && selectedVault && (
        <DepositModal vault={selectedVault} onClose={() => setIsModalOpen(false)} onDepositSuccess={onActionSuccess} />
      )}
      {isActivateModalOpen && selectedVault && (
        <ActivateVaultModal 
            vault={selectedVault} 
            onClose={() => setIsActivateModalOpen(false)}
            onConfirm={handleActivateConfirm}
        />
      )}
      {isCreateModalOpen && (
          <CreateVaultModal 
              onClose={() => setIsCreateModalOpen(false)}
              onSuccess={onActionSuccess}
          />
      )}
    </div>
  );
}

const VaultCard = ({ vault, onDepositClick, onActivateClick, onWithdrawClick }: { vault: Vault, onDepositClick: () => void, onActivateClick: () => void, onWithdrawClick: () => void }) => {
    const currentAmount = vault.totalPoolAmount ?? 0;
    const targetAmount = vault.targetAmountUsd ?? 0;
    const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
    const { user } = useUserStore();
    const isCreator = user?._id === vault.creatorId._id;
    const canActivate = isCreator && vault.status === 'FUNDING' && currentAmount >= targetAmount;

    const tenDaysInMillis = 10 * 24 * 60 * 60 * 1000;
    const canWithdraw = vault.status === 'FUNDING' && (new Date().getTime() > new Date(vault.createdAt).getTime() + tenDaysInMillis);

    return (
        <div className="bg-[#1e222d] rounded-lg shadow-lg p-6 border border-gray-700 flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-white">{vault.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded font-bold ${
                        vault.status === 'FUNDING' ? 'bg-blue-900/50 text-blue-400' : 
                        vault.status === 'ACTIVE' ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-400'
                    }`}>
                        {vault.status}
                    </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Bot: {vault.botId?.name || 'N/A'}</p>
                {vault.status === 'ACTIVE' && vault.expiresAt && <Countdown toDate={vault.expiresAt} />}
                {vault.status === 'FUNDING' && !canWithdraw && <RefundCountdown createdAt={vault.createdAt} />}


                <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>${currentAmount.toFixed(0)}</span>
                        <span className="font-semibold text-gray-200">${targetAmount}</span>
                    </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span>Duration:</span><span className="font-semibold text-gray-200">{vault.durationDays} days</span></div>
                    <div className="flex justify-between"><span>Profit Share:</span><span className="font-semibold text-gray-200">{vault.profitSharePercent}%</span></div>
                    <div className="flex justify-between items-center">
                        <span>Insurance:
                            <Tooltip text="6% fee for 30% coverage on your investment." />
                        </span>
                        <span className="font-semibold text-green-400">Available</span>
                    </div>
                </div>
            </div>
            
            <div className="mt-6 space-y-2">
              {canActivate ? (
                <button onClick={onActivateClick} className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-semibold">
                    Activate Vault
                </button>
              ) : (
                <button onClick={onDepositClick} disabled={vault.status !== 'FUNDING'} className="w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                    Invest
                </button>
              )}
              {canWithdraw && (
                <button onClick={onWithdrawClick} className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-xs">
                    Withdraw Funding
                </button>
              )}
            </div>
        </div>
    );
};

const DepositModal = ({ vault, onClose, onDepositSuccess }: { vault: Vault, onClose: () => void, onDepositSuccess: () => void }) => {
    const { wallet } = useUserStore();
    const [amount, setAmount] = useState('');
    const [buyInsurance, setBuyInsurance] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const amountNum = parseFloat(amount) || 0;
    const insuranceCost = buyInsurance ? amountNum * 0.06 : 0;
    
    const bonusBalance = wallet?.bonusBalanceUsd ?? 0;
    const liveBalance = wallet?.liveBalanceUsd ?? 0;
    
    const fromBonus = Math.min(amountNum, bonusBalance);
    const fromLive = amountNum - fromBonus;
    
    const totalLiveCost = fromLive + insuranceCost;
    const hasEnoughLiveBalance = liveBalance >= totalLiveCost;

    useEffect(() => {
        if (!hasEnoughLiveBalance) {
            setError('Insufficient live balance for investment and/or insurance fee.');
        } else {
            setError(null);
        }
    }, [hasEnoughLiveBalance, amountNum, buyInsurance]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (error) return;

        const formData = new FormData();
        formData.append('amountUsd', amount);
        formData.append('buyInsurance', String(buyInsurance));
        
        const result = await depositToVault(vault._id, null, formData);
        
        // Only trigger success callback if deposit was successful
        if (result && !result.error) {
            onDepositSuccess();
            onClose();
        } else {
            // Show error if deposit failed
            setError(result?.error || 'Deposit failed');
        }
    };
    
    const feeTier = getFeeTier(vault.botId?.strategy);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-40 flex justify-center items-center">
            <div className="bg-[#1e222d] rounded-lg shadow-xl w-full sm:max-w-md m-4 border border-gray-700">
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Invest in {vault.name}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white"><X /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">Investment Amount ($)</label>
                        <input type="number" name="amountUsd" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} required min="1" className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white" />
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" name="buyInsurance" id="insurance" checked={buyInsurance} onChange={(e) => setBuyInsurance(e.target.checked)} className="h-4 w-4 rounded border-gray-500 bg-gray-800 text-emerald-600 focus:ring-emerald-500" />
                        <label htmlFor="insurance" className="ml-2 block text-sm text-gray-300">Buy Insurance (6% fee for 30% coverage)</label>
                    </div>
                    
                    <div className="space-y-2 text-xs text-gray-400 bg-gray-900/50 p-3 rounded-md">
                        <h4 className="font-bold text-gray-300 mb-2">Fee Breakdown (on profits):</h4>
                        <div className="flex justify-between"><span>Platform Fee ({feeTier.name}):</span> <span>{feeTier.fee}%</span></div>
                        <div className="flex justify-between"><span>Creator's Profit Share:</span> <span>{vault.profitSharePercent}%</span></div>
                        <hr className="border-gray-700 my-1" />
                        <div className="flex justify-between font-semibold text-gray-300"><span>Total Fees on Profit:</span> <span>{feeTier.fee + vault.profitSharePercent}%</span></div>
                    </div>
                    
                    {amountNum > 0 && (
                        <div className="text-xs text-gray-400 bg-gray-900/50 p-3 rounded-md space-y-1">
                            <h4 className="font-bold text-gray-300 mb-2">Funding Source:</h4>
                            <div className="flex justify-between"><span>From Bonus Balance:</span> <span>-${fromBonus.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>From Live Balance (Investment):</span> <span>-${fromLive.toFixed(2)}</span></div>
                            {buyInsurance && <div className="flex justify-between"><span>From Live Balance (Insurance Fee):</span> <span>-${insuranceCost.toFixed(2)}</span></div>}
                            <hr className="border-gray-700 my-1" />
                            <div className="flex justify-between font-semibold text-gray-300"><span>Total from Live Balance:</span> <span>-${totalLiveCost.toFixed(2)}</span></div>
                        </div>
                    )}

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 mr-3 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600">Cancel</button>
                        <button type="submit" disabled={!!error || amountNum <= 0} className="px-5 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed">Deposit</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ActivateVaultModal = ({ vault, onClose, onConfirm }: { vault: Vault, onClose: () => void, onConfirm: () => void }) => {
    const collateralAmount = (vault.targetAmountUsd * vault.creatorCollateralPercent / 100).toFixed(2);
    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-40 flex justify-center items-center">
            <div className="bg-[#1e222d] rounded-lg shadow-xl w-full sm:max-w-md m-4 border border-gray-700">
                 <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Activate Vault</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white"><X /></button>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-300">
                        Activating this vault will lock <strong>${collateralAmount}</strong> from your Live Balance as collateral. This action cannot be undone.
                    </p>
                    <div className="flex justify-end pt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 mr-3 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600">Cancel</button>
                        <button onClick={onConfirm} className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold">Confirm & Activate</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CreateVaultModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const formRef = React.useRef<HTMLFormElement>(null);
    const [myBots, setMyBots] = useState<Bot[]>([]);
    const { user } = useUserStore();

    useEffect(() => {
        const fetchBots = async () => {
            const res = await getBots();
            if (res && !res.error) {
                setMyBots(res);
            }
        };
        fetchBots();
    }, []);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!formRef.current) return;
        const formData = new FormData(formRef.current);
        setError(null);

        startTransition(async () => {
            const res = await createVault(null, formData);
            if (res?.error) {
                setError(res.error as string);
            } else {
                onSuccess();
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-40 flex justify-center items-center">
            <div className="bg-[#1e222d] rounded-lg shadow-xl w-full sm:max-w-2xl m-4 relative border border-gray-700 max-h-[90vh] flex flex-col">
                 <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Create New Investment Vault</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X /></button>
                </div>
                <form ref={formRef} onSubmit={handleSubmit} className="flex-grow p-6 overflow-y-auto space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Vault Name</label>
                        <input type="text" name="name" id="name" required className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white" />
                    </div>
                    <div>
                        <label htmlFor="botId" className="block text-sm font-medium text-gray-300 mb-1">Trading Bot</label>
                        <select name="botId" id="botId" required className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white">
                            <option value="">Select a bot</option>
                            {myBots.map(bot => <option key={bot._id} value={bot._id}>{bot.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="targetAmountUsd" className="block text-sm font-medium text-gray-300 mb-1">Target Amount ($)</label>
                            <input type="number" name="targetAmountUsd" id="targetAmountUsd" required min="1" className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white" />
                        </div>
                        <div>
                            <label htmlFor="durationDays" className="block text-sm font-medium text-gray-300 mb-1">Duration (days)</label>
                            <input type="number" name="durationDays" id="durationDays" required min="1" defaultValue="30" className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white" />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="creatorCollateralPercent" className="block text-sm font-medium text-gray-300 mb-1">Creator Collateral (%)</label>
                            <input type="number" name="creatorCollateralPercent" id="creatorCollateralPercent" required min="50" max="50" defaultValue="50" readOnly className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white" />
                        </div>
                        <div>
                            <label htmlFor="profitSharePercent" className="block text-sm font-medium text-gray-300 mb-1">Profit Share (%)</label>
                            <input type="number" name="profitSharePercent" id="profitSharePercent" required min="0" max="100" defaultValue="50" className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white" />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <div className="flex justify-end pt-4 border-t border-gray-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 mr-3 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600">Cancel</button>
                        <button type="submit" disabled={isPending} className="px-5 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-semibold disabled:bg-emerald-900">
                            {isPending ? 'Creating...' : 'Create Vault'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};