'use client';

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useTransition,
} from 'react';
import {
  getBots,
  createBot,
  updateBot,
  getBotDefinitions,
  archiveBot,
  getPublicBots,
} from '@/actions/bot';
import { getInstruments } from '@/actions/market';
import { getWallet } from '@/actions/user';
import { getMyVaultParticipations } from '@/actions/vault';
import {
  Play,
  Pause,
  Settings,
  Shield,
  Plus,
  X,
  Trash2,
  Info,
  Eye,
  EyeOff,
  Copy,
  Pencil,
} from 'lucide-react';
import { useUserStore } from '@/store/user';
import Header from '@/components/Header';

interface Strategy {
  id: string;
  name: string;
  description: string;
  isPremium: boolean;
}

const strategies: Strategy[] = [
  {
    id: 'RSI_STRATEGY',
    name: 'Relative Strength Index (RSI)',
    description: 'Trades reversals on overbought/oversold signals.',
    isPremium: false,
  },
  {
    id: 'MACD_STRATEGY',
    name: 'MACD Crossover',
    description: 'Trend-following strategy based on MACD line crossovers.',
    isPremium: true,
  },
  {
    id: 'SMA_CROSSOVER',
    name: 'SMA Crossover',
    description:
      'Trades on Golden/Death cross signals from moving averages.',
    isPremium: true,
  },
  {
    id: 'RANDOM_TEST',
    name: 'Random Tester',
    description: 'Randomly places trades for testing purposes.',
    isPremium: false,
  },
];

const getFeeTier = (strategyId: string) => {
    const strategy = strategies.find(s => s.id === strategyId);
    return strategy?.isPremium ? { name: 'Premium', fee: 25 } : { name: 'Free', fee: 5 };
}

type Bot = any; 

export default function BotsPage() {
  const [myBots, setMyBots] = useState<Bot[]>([]);
  const [publicBots, setPublicBots] = useState<Bot[]>([]);
  const [instruments, setInstruments] = useState<any[]>([]);
  const [parameterDefinitions, setParameterDefinitions] = useState<
    Record<string, string>
  >({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [botToClone, setBotToClone] = useState<Bot | null>(null);
  const [botToEdit, setBotToEdit] = useState<Bot | null>(null);
  const [lockedBotIds, setLockedBotIds] = useState<Set<string>>(new Set());
  const [selectedStrategy, setSelectedStrategy] = useState<string>(
    strategies[0].id,
  );
  const { setWallet } = useUserStore();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [activeTab, setActiveTab] = useState<'MY_BOTS' | 'COMMUNITY'>(
    'MY_BOTS',
  );
  const [visibility, setVisibility] = useState('PRIVATE');
  const [isPending, startTransition] = useTransition();
  const [createError, setCreateError] = useState<string | null>(null);

  const selectedStrategyInfo = useMemo(
    () => strategies.find((s) => s.id === selectedStrategy),
    [selectedStrategy],
  );

  const fetchMyBots = useCallback(async () => {
    try {
      const res = await getBots();
      if (res?.data) {
        setMyBots(res.data);
      }
    } catch (err) {
      console.error('Error fetching bots', err);
    }
  }, []);

  const fetchPublicBots = useCallback(async () => {
    try {
      const res = await getPublicBots();
      if (res?.data) {
        setPublicBots(res.data);
      }
    } catch (err) {
      console.error('Error fetching public bots', err);
    }
  }, []);

  const fetchInstruments = useCallback(async () => {
    try {
      const res = await getInstruments();
      if (res?.data) {
        setInstruments(res.data);
      }
    } catch (err) {
      console.error('Error fetching instruments', err);
    }
  }, []);

  const fetchDefinitions = useCallback(async () => {
    try {
      const res = await getBotDefinitions();
      if (res?.data) {
        setParameterDefinitions(res.data.parameters || res.data);
      }
    } catch (err) {
      console.error('Error fetching bot definitions', err);
    }
  }, []);

  const fetchWallet = useCallback(async () => {
    try {
      const res = await getWallet();
      if (res?.data) {
        setWallet(res.data);
      }
    } catch (err) {
      console.error('Error fetching wallet', err);
    }
  }, [setWallet]);

  const fetchLockedBots = useCallback(async () => {
    const res = await getMyVaultParticipations();
    if (res.data) {
        const lockedIdsArray: string[] = res.data.map((p: any) => String(p.vault.botId));
        const lockedIds = new Set(lockedIdsArray);
        setLockedBotIds(lockedIds);
    }
  }, []);

  useEffect(() => {
    fetchInstruments();
    fetchDefinitions();
    fetchWallet();
    fetchLockedBots();
  }, [fetchInstruments, fetchDefinitions, fetchWallet, fetchLockedBots]);

  useEffect(() => {
    if (activeTab === 'MY_BOTS') {
      fetchMyBots();
      const interval = setInterval(fetchMyBots, 5000);
      return () => clearInterval(interval);
    } else if (activeTab === 'COMMUNITY') {
      fetchPublicBots();
    }
  }, [activeTab, fetchMyBots, fetchPublicBots]);

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    setCreateError(null);

    startTransition(async () => {
      try {
        const res = await createBot(null, formData);
        if (res?.error) {
          setCreateError(res.error as string);
        } else {
          setIsModalOpen(false);
          formRef.current?.reset();
          setSelectedStrategy(strategies[0].id);
          await fetchMyBots();
        }
      } catch (err) {
        console.error('Error creating bot', err);
        setCreateError('Something went wrong while creating the bot.');
      }
    });
  };

  const toggleBotStatus = async (bot: any) => {
    const newStatus = bot.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await updateBot(bot._id, { status: newStatus });
      fetchMyBots();
    } catch (err) {
      console.error('Error updating bot status', err);
    }
  };

  const handleArchiveBot = async (botId: string) => {
    if (!window.confirm('Are you sure you want to archive this bot?')) return;
    try {
      await archiveBot(botId);
      fetchMyBots();
    } catch (err) {
      console.error('Error archiving bot', err);
    }
  };

  const handleCloneClick = (bot: Bot) => {
    setBotToClone(bot);
    setIsCloneModalOpen(true);
  };

  const handleEditClick = (bot: Bot) => {
    setBotToEdit(bot);
    setIsEditModalOpen(true);
  };

  const Tooltip: React.FC<{ text?: string }> = ({ text }) => {
    if (!text) return null;
    return (
      <div className="group relative inline-block ml-1.5">
        <Info className="w-3.5 h-3.5 text-gray-500 cursor-help" />
        <div className="invisible group-hover:visible absolute z-10 w-48 p-2 mt-1 text-xs text-white bg-gray-900 border border-gray-700 rounded shadow-lg -translate-x-1/2 left-1/2">
          {text}
        </div>
      </div>
    );
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-black text-gray-300 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Automated Bots</h1>
            {activeTab === 'MY_BOTS' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Bot
              </button>
            )}
          </div>

          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-80 z-40 flex justify-center items-center">
              <div className="bg-[#1e222d] rounded-lg shadow-xl w-full max-w-2xl m-4 relative border border-gray-700 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                  <h2 className="text-xl font-bold text-white">
                    Create New Bot
                  </h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form
                  ref={formRef}
                  onSubmit={handleFormSubmit}
                  className="flex-grow p-6 overflow-y-auto space-y-6"
                >
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-400 border-b border-gray-700 pb-2">
                      Configuration
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-300 mb-1"
                        >
                          Bot Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          required
                          className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]"
                          placeholder="e.g., My ETH Trader"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="strategy"
                          className="flex items-center text-sm font-medium text-gray-300 mb-1"
                        >
                          Strategy
                          <Tooltip text={selectedStrategyInfo?.description} />
                        </label>
                        <select
                          name="strategy"
                          id="strategy"
                          value={selectedStrategy}
                          onChange={(e) =>
                            setSelectedStrategy(e.target.value)
                          }
                          className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]"
                        >
                          {strategies.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.isPremium ? 'Premium - 25% Fee' : 'Free - 5% Fee'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                        Assets
                      </label>
                      <div className="h-32 overflow-y-auto border border-gray-600 rounded-md p-2 grid grid-cols-2 md:grid-cols-3 gap-2 bg-gray-900/50">
                        {instruments.map((inst) => (
                          <label
                            key={inst.symbol}
                            className="flex items-center space-x-2 cursor-pointer hover:bg-gray-700 p-2 rounded transition-colors"
                          >
                            <input
                              type="checkbox"
                              name="assets"
                              value={inst.symbol}
                              className="h-4 w-4 rounded border-gray-500 bg-gray-800 text-[var(--color-accent)] focus:ring-[var(--color-accent-hover)]"
                            />
                            <span className="text-xs font-medium text-gray-300">
                              {inst.displayName}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="visibility"
                          className="flex items-center text-sm font-medium text-gray-300 mb-1"
                        >
                          Visibility
                          <Tooltip text="Public bots are visible to the community. Private bots are only visible to you." />
                        </label>
                        <select
                          name="visibility"
                          id="visibility"
                          value={visibility}
                          onChange={(e) => setVisibility(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]"
                        >
                          <option value="PRIVATE">Private</option>
                          <option value="PUBLIC">Public</option>
                        </select>
                      </div>
                       {visibility === 'PUBLIC' && (
                        <div>
                          <label
                            htmlFor="profitSharePercent"
                            className="flex items-center text-sm font-medium text-gray-300 mb-1"
                          >
                            Profit Share (%)
                            <Tooltip text="Your fee. Percentage of profits you take from users who clone your bot." />
                          </label>
                          <input
                            type="number"
                            name="profitSharePercent"
                            id="profitSharePercent"
                            defaultValue={50}
                            min={0}
                            max={100}
                            required
                            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-400 border-b border-gray-700 pb-2">
                      Strategy Parameters
                    </h3>
                    <div className="bg-gray-900/50 p-4 rounded-md">
                      {selectedStrategy === 'RANDOM_TEST' && (
                        <p className="text-sm text-gray-400">
                          No parameters for this strategy.
                        </p>
                      )}

                      {selectedStrategy === 'RSI_STRATEGY' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="flex items-center text-xs font-medium text-gray-400 mb-1">
                              Period
                              <Tooltip text={parameterDefinitions.period} />
                            </label>
                            <input
                              name="period"
                              type="number"
                              defaultValue={14}
                              className="w-full bg-gray-800 border-gray-600 rounded px-2 py-1.5 text-sm"
                            />
                          </div>
                        </div>
                      )}

                      {selectedStrategy === 'MACD_STRATEGY' && (
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="flex items-center text-xs font-medium text-gray-400 mb-1">
                              Fast
                              <Tooltip
                                text={parameterDefinitions.fastPeriod}
                              />
                            </label>
                            <input
                              name="fastPeriod"
                              type="number"
                              defaultValue={12}
                              className="w-full bg-gray-800 border-gray-600 rounded px-2 py-1.5 text-sm"
                            />
                          </div>
                          <div>
                            <label className="flex items-center text-xs font-medium text-gray-400 mb-1">
                              Slow
                              <Tooltip
                                text={parameterDefinitions.slowPeriod}
                              />
                            </label>
                            <input
                              name="slowPeriod"
                              type="number"
                              defaultValue={26}
                              className="w-full bg-gray-800 border-gray-600 rounded px-2 py-1.5 text-sm"
                            />
                          </div>
                          <div>
                            <label className="flex items-center text-xs font-medium text-gray-400 mb-1">
                              Signal
                              <Tooltip
                                text={parameterDefinitions.signalPeriod}
                              />
                            </label>
                            <input
                              name="signalPeriod"
                              type="number"
                              defaultValue={9}
                              className="w-full bg-gray-800 border-gray-600 rounded px-2 py-1.5 text-sm"
                            />
                          </div>
                        </div>
                      )}

                      {selectedStrategy === 'SMA_CROSSOVER' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="flex items-center text-xs font-medium text-gray-400 mb-1">
                              Fast Period
                              <Tooltip
                                text={parameterDefinitions.fastPeriod}
                              />
                            </label>
                            <input
                              name="fastPeriod"
                              type="number"
                              defaultValue={10}
                              className="w-full bg-gray-800 border-gray-600 rounded px-2 py-1.5 text-sm"
                            />
                          </div>
                          <div>
                            <label className="flex items-center text-xs font-medium text-gray-400 mb-1">
                              Slow Period
                              <Tooltip
                                text={parameterDefinitions.slowPeriod}
                              />
                            </label>
                            <input
                              name="slowPeriod"
                              type="number"
                              defaultValue={50}
                              className="w-full bg-gray-800 border-gray-600 rounded px-2 py-1.5 text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-400 border-b border-gray-700 pb-2">
                      Risk &amp; Investment
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label
                          htmlFor="tradeAmount"
                          className="flex items-center text-sm font-medium text-gray-300 mb-1"
                        >
                          Trade Amount ($)
                          <Tooltip
                            text={parameterDefinitions.tradeAmount}
                          />
                        </label>
                        <input
                          type="number"
                          name="tradeAmount"
                          id="tradeAmount"
                          required
                          min={1}
                          defaultValue={10}
                          className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="expirySeconds"
                          className="flex items-center text-sm font-medium text-gray-300 mb-1"
                        >
                          Expiry (sec)
                          <Tooltip
                            text={parameterDefinitions.expirySeconds}
                          />
                        </label>
                        <input
                          type="number"
                          name="expirySeconds"
                          id="expirySeconds"
                          required
                          min={10}
                          defaultValue={60}
                          className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="maxConcurrentTrades"
                          className="flex items-center text-sm font-medium text-gray-300 mb-1"
                        >
                          Max Concurrent
                          <Tooltip
                            text={parameterDefinitions.maxConcurrentTrades}
                          />
                        </label>
                        <input
                          type="number"
                          name="maxConcurrentTrades"
                          id="maxConcurrentTrades"
                          required
                          min={1}
                          defaultValue={3}
                          className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="stopLossAmount"
                          className="flex items-center text-sm font-medium text-gray-300 mb-1"
                        >
                          Stop Loss ($)
                          <Tooltip
                            text={parameterDefinitions.stopLossAmount}
                          />
                        </label>
                        <input
                          name="stopLossAmount"
                          id="stopLossAmount"
                          type="number"
                          defaultValue={100}
                          className="w-full bg-gray-900 border-gray-600 rounded-md px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="takeProfitAmount"
                          className="flex items-center text-sm font-medium text-gray-300 mb-1"
                        >
                          Take Profit ($)
                          <Tooltip
                            text={parameterDefinitions.takeProfitAmount}
                          />
                        </label>
                        <input
                          name="takeProfitAmount"
                          id="takeProfitAmount"
                          type="number"
                          defaultValue={200}
                          className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {createError && (
                    <div className="text-red-400 text-sm bg-red-900/30 p-3 rounded-md border border-red-800">
                      <strong>Error:</strong> {createError}
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t border-gray-700">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 mr-3 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-5 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors font-semibold disabled:bg-emerald-900 disabled:cursor-not-allowed"
                    >
                      {isPending ? 'Creating...' : 'Create Bot'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          <div className="mb-4 border-b border-gray-700">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('MY_BOTS')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'MY_BOTS'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'
                }`}
              >
                My Bots
              </button>
              <button
                onClick={() => setActiveTab('COMMUNITY')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'COMMUNITY'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'
                }`}
              >
                Bot Marketplace
              </button>
            </nav>
          </div>

          {activeTab === 'MY_BOTS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myBots.map((bot) => (
                <div key={bot._id} className="bg-[#1e222d] rounded-lg shadow-lg p-6 relative border border-gray-700">
                   <div className="absolute top-2 right-2 flex items-center space-x-1">
                    <button
                        onClick={() => handleEditClick(bot)}
                        className="p-1 text-gray-500 hover:text-blue-400 transition-colors"
                        title="Edit Bot"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleArchiveBot(bot._id)}
                      className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                      title="Archive Bot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-start mb-4 pr-16">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {bot.name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded font-bold ${
                          bot.status === 'ACTIVE'
                            ? 'bg-green-900/50 text-green-400'
                            : 'bg-yellow-900/50 text-yellow-400'
                        }`}
                      >
                        {bot.status}
                      </span>
                      <span className="ml-2 text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                        {bot.mode}
                      </span>
                    </div>
                    <div
                      className={`flex items-center text-xs px-2 py-1 rounded ${
                        bot.visibility === 'PUBLIC'
                          ? 'bg-blue-900/50 text-blue-400'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {bot.visibility === 'PUBLIC' ? (
                        <Eye className="w-3 h-3 mr-1" />
                      ) : (
                        <EyeOff className="w-3 h-3 mr-1" />
                      )}
                      {bot.visibility}
                    </div>
                  </div>

                  <div className="flex space-x-2 mb-4">
                    <div className="flex-1 flex items-center justify-center py-1 rounded text-xs font-bold bg-gray-800 text-gray-400">
                      <Shield className="w-3 h-3 mr-1" />
                      Insurance: {bot.insuranceStatus}
                    </div>
                    <button
                      onClick={() => toggleBotStatus(bot)}
                      className={`flex-1 flex items-center justify-center py-1 rounded text-xs font-bold ${
                        bot.status === 'ACTIVE'
                          ? 'bg-red-900/50 text-red-400 hover:bg-red-900/70'
                          : 'bg-green-900/50 text-green-400 hover:bg-green-900/70'
                      }`}
                    >
                      {bot.status === 'ACTIVE' ? (
                        <>
                          <Pause className="w-3 h-3 mr-1" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 mr-1" /> Start
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-3 text-sm text-gray-400">
                    <div className="flex justify-between">
                      <span>Strategy:</span>
                      <span className="font-semibold text-gray-200">
                        {bot.strategy}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Assets:</span>
                      <span
                        className="font-semibold text-gray-200 truncate max-w-[150px]"
                        title={bot.assets?.join(', ')}
                      >
                        {bot.assets?.length > 3
                          ? `${bot.assets.slice(0, 3).join(', ')}...`
                          : bot.assets?.join(', ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trade Amount:</span>
                      <span className="font-semibold text-gray-200">
                        $
                        {bot.config?.tradeAmount ??
                          bot.tradeAmount ??
                          0}
                      </span>
                    </div>
                    {bot.parameters &&
                      Object.keys(bot.parameters).length > 0 && (
                        <div className="text-xs bg-gray-900/50 p-2 rounded mt-1">
                          {Object.entries(bot.parameters).map(
                            ([key, val]) => (
                              <span key={key} className="mr-2 block">
                                {key}: {String(val)}
                              </span>
                            ),
                          )}
                        </div>
                      )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                      Performance
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-800/50 p-2 rounded">
                        <div className="text-xs text-gray-400">
                          Trades
                        </div>
                        <div className="font-bold text-white">
                          {bot.stats?.totalTrades ?? 0}
                        </div>
                      </div>
                      <div className="bg-gray-800/50 p-2 rounded">
                        <div className="text-xs text-gray-400">
                          Win Rate
                        </div>
                        <div className="font-bold text-white">
                          {bot.stats?.totalTrades > 0
                            ? (
                                (bot.stats.wins /
                                  bot.stats.totalTrades) *
                                100
                              ).toFixed(0)
                            : 0}
                          %
                        </div>
                      </div>
                      <div
                        className={`p-2 rounded ${
                          (bot.stats?.netPnL ?? 0) >= 0
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-red-900/30 text-red-400'
                        }`}
                      >
                        <div className="text-xs opacity-80">
                          Net PnL
                        </div>
                        <div className="font-bold">
                          {(bot.stats?.netPnL ?? 0) >= 0
                            ? '+'
                            : ''}
                          {(
                            bot.stats?.netPnL ?? 0
                          ).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-center text-gray-500">
                      Active Trades:{' '}
                      {bot.stats?.activeTrades ?? 0} /{' '}
                      {bot.config?.maxConcurrentTrades ?? 0}
                    </div>
                  </div>
                </div>
              ))}
              {myBots.length === 0 && !isPending && (
                <div className="col-span-full text-center py-20 text-gray-500">
                  <div className="mb-4 mx-auto w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                    <Settings className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium">No Bots Created</h3>
                  <p>Create a bot to start automated trading.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'COMMUNITY' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicBots.map((bot) => (
                <div
                  key={bot._id}
                  className="bg-[#1e222d] rounded-lg shadow-lg p-6 relative border border-gray-700"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {bot.name}
                      </h3>
                      <div className="text-xs text-gray-400">
                        by {bot.userId?.fullName ?? 'Anonymous'}
                      </div>
                       {bot.profitSharePercent > 0 && (
                        <div className="text-xs text-emerald-400 font-semibold mt-1">
                            {bot.profitSharePercent}% Profit Share
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleCloneClick(bot)}
                      className="flex items-center text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <Copy className="w-3 h-3 mr-1.5" />
                      Clone
                    </button>
                  </div>
                </div>
              ))}

              {publicBots.length === 0 && (
                <div className="col-span-full text-center py-20 text-gray-500">
                  <h3 className="text-lg font-medium">
                    No Bots in the Marketplace Yet
                  </h3>
                  <p>Be the first to share a public bot!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {isCloneModalOpen && botToClone && (
          <CloneBotModal
              bot={botToClone}
              onClose={() => setIsCloneModalOpen(false)}
              onSuccess={() => {
                  setIsCloneModalOpen(false);
                  fetchMyBots();
                  setActiveTab('MY_BOTS');
              }}
          />
      )}
      {isEditModalOpen && botToEdit && (
        <EditBotModal
          bot={botToEdit}
          isLocked={lockedBotIds.has(botToEdit._id)}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false);
            fetchMyBots();
          }}
        />
      )}
    </>
  );
}

const CloneBotModal = ({ bot, onClose, onSuccess }: { bot: Bot, onClose: () => void, onSuccess: () => void }) => {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const formRef = React.useRef<HTMLFormElement>(null);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!formRef.current) return;
        const formData = new FormData(formRef.current);
        setError(null);

        startTransition(async () => {
            const res = await createBot(null, formData);
            if (res?.error) {
                setError(res.error as string);
            } else {
                onSuccess();
            }
        });
    };

    const feeTier = getFeeTier(bot.strategy);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-40 flex justify-center items-center">
            <div className="bg-[#1e222d] rounded-lg shadow-xl w-full max-w-lg m-4 relative border border-gray-700">
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Clone "{bot.name}"</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-6">
                    <input type="hidden" name="clonedFrom" value={bot._id} />
                    <input type="hidden" name="strategy" value={bot.strategy} />
                    {bot.assets.map((asset: string) => (
                        <input key={asset} type="hidden" name="assets" value={asset} />
                    ))}

                    <div className="space-y-2">
                        <p className="text-sm text-gray-400">You are cloning the strategy and assets from the master bot. You only need to set your personal investment configuration.</p>
                        <div className="p-3 bg-gray-900/50 rounded-md text-xs space-y-1">
                            <div><span className="font-semibold text-gray-300">Strategy:</span> {bot.strategy} ({feeTier.name})</div>
                            <div><span className="font-semibold text-gray-300">Assets:</span> {bot.assets.join(', ')}</div>
                            {bot.parameters && Object.keys(bot.parameters).length > 0 && (
                                <div><span className="font-semibold text-gray-300">Parameters:</span> {Object.entries(bot.parameters).map(([k, v]: [string, any]) => `${k}: ${String(v)}`).join(', ')}</div>
                            )}
                        </div>
                    </div>
                    
                    <div className="space-y-2 text-xs text-gray-400 bg-gray-900/50 p-3 rounded-md">
                        <h4 className="font-bold text-gray-300 mb-2">Fee Breakdown (on profits):</h4>
                        <div className="flex justify-between"><span>Platform Fee ({feeTier.name}):</span> <span>{feeTier.fee}%</span></div>
                        <div className="flex justify-between"><span>Creator's Profit Share:</span> <span>{bot.profitSharePercent}%</span></div>
                        <hr className="border-gray-700 my-1" />
                        <div className="flex justify-between font-semibold text-gray-300"><span>Total Fees on Profit:</span> <span>{feeTier.fee + bot.profitSharePercent}%</span></div>
                    </div>

                    <div>
                        <label htmlFor="clone-name" className="block text-sm font-medium text-gray-300 mb-1">Your Bot's Name</label>
                        <input
                            type="text"
                            name="name"
                            id="clone-name"
                            required
                            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white"
                            placeholder="e.g., My Clone of..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="clone-tradeAmount" className="block text-sm font-medium text-gray-300 mb-1">Trade Amount ($)</label>
                            <input
                                type="number"
                                name="tradeAmount"
                                id="clone-tradeAmount"
                                required
                                min={1}
                                defaultValue={10}
                                className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="clone-expirySeconds" className="block text-sm font-medium text-gray-300 mb-1">Expiry (sec)</label>
                            <input
                                name="expirySeconds"
                                id="clone-expirySeconds"
                                type="number"
                                required
                                min={5}
                                defaultValue={60}
                                className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm bg-red-900/30 p-3 rounded-md border border-red-800">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-gray-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 mr-3 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600">Cancel</button>
                        <button type="submit" disabled={isPending} className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold disabled:bg-blue-900 disabled:cursor-not-allowed">
                            {isPending ? 'Cloning...' : 'Clone Bot'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EditBotModal = ({ bot, isLocked, onClose, onSuccess }: { bot: Bot, isLocked: boolean, onClose: () => void, onSuccess: () => void }) => {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const formRef = React.useRef<HTMLFormElement>(null);
    const [selectedStrategy, setSelectedStrategy] = useState(bot.strategy);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!formRef.current) return;
        const formData = new FormData(formRef.current);
        
        const payload: any = {
            config: {},
            parameters: {}
        };
        
        // Always editable fields
        payload.name = formData.get('name');
        payload.visibility = formData.get('visibility');
        payload.config.tradeAmount = formData.get('tradeAmount');
        payload.config.stopLossAmount = formData.get('stopLossAmount');

        // Conditionally editable fields
        if (!isLocked) {
            payload.strategy = formData.get('strategy');
            // Asset editing is complex, so for now we don't include it in the form
            // payload.assets = formData.getAll('assets'); 
            
            if (payload.strategy === 'RSI_STRATEGY') {
                payload.parameters.period = Number(formData.get('period'));
            } else if (payload.strategy === 'MACD_STRATEGY') {
                payload.parameters.fastPeriod = Number(formData.get('fastPeriod'));
                payload.parameters.slowPeriod = Number(formData.get('slowPeriod'));
                payload.parameters.signalPeriod = Number(formData.get('signalPeriod'));
            } else if (payload.strategy === 'SMA_CROSSOVER') {
                 payload.parameters.fastPeriod = Number(formData.get('fastPeriod'));
                payload.parameters.slowPeriod = Number(formData.get('slowPeriod'));
            }
        }

        setError(null);

        startTransition(async () => {
            const res = await updateBot(bot._id, payload);
            if (res?.error) {
                setError(res.error as string);
            } else {
                onSuccess();
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-40 flex justify-center items-center">
            <div className="bg-[#1e222d] rounded-lg shadow-xl w-full max-w-2xl m-4 relative border border-gray-700 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Edit "{bot.name}"</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                    {isLocked && <div className="text-yellow-400 text-sm bg-yellow-900/30 p-3 rounded-md border border-yellow-400/30">This bot is linked to an active vault. Strategy, assets, and parameters cannot be edited.</div>}
                    
                    <div>
                        <label htmlFor="edit-name" className="block text-sm font-medium text-gray-300 mb-1">Bot Name</label>
                        <input type="text" name="name" id="edit-name" required defaultValue={bot.name} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="edit-visibility" className="block text-sm font-medium text-gray-300 mb-1">Visibility</label>
                            <select name="visibility" id="edit-visibility" defaultValue={bot.visibility} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white">
                                <option value="PRIVATE">Private</option>
                                <option value="PUBLIC">Public</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="edit-tradeAmount" className="block text-sm font-medium text-gray-300 mb-1">Trade Amount ($)</label>
                            <input type="number" name="tradeAmount" id="edit-tradeAmount" required min="1" defaultValue={bot.config?.tradeAmount ?? bot.tradeAmount} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white" />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="edit-stopLossAmount" className="block text-sm font-medium text-gray-300 mb-1">Stop Loss ($)</label>
                        <input name="stopLossAmount" id="edit-stopLossAmount" type="number" defaultValue={bot.config?.stopLossAmount ?? 0} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white" />
                    </div>

                    <fieldset disabled={isLocked} className="space-y-4 disabled:opacity-50">
                        <legend className="text-sm font-semibold text-gray-400 border-b border-gray-700 pb-2 w-full">Strategy & Parameters</legend>
                        
                        <div>
                            <label htmlFor="edit-strategy" className="block text-sm font-medium text-gray-300 mb-1">Strategy</label>
                            <select name="strategy" id="edit-strategy" value={selectedStrategy} onChange={e => setSelectedStrategy(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white">
                                {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        
                        <div className="bg-gray-900/50 p-4 rounded-md">
                            {selectedStrategy === 'RSI_STRATEGY' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="flex items-center text-xs font-medium text-gray-400 mb-1">Period</label>
                                    <input name="period" type="number" defaultValue={bot.parameters?.period ?? 14} className="w-full bg-gray-800 border-gray-600 rounded px-2 py-1.5 text-sm" />
                                </div>
                                </div>
                            )}
                            {selectedStrategy === 'MACD_STRATEGY' && (
                                <div className="grid grid-cols-3 gap-4">
                                     <div>
                                        <label className="flex items-center text-xs font-medium text-gray-400 mb-1">Fast</label>
                                        <input name="fastPeriod" type="number" defaultValue={bot.parameters?.fastPeriod ?? 12} className="w-full bg-gray-800 border-gray-600 rounded px-2 py-1.5 text-sm" />
                                    </div>
                                    <div>
                                        <label className="flex items-center text-xs font-medium text-gray-400 mb-1">Slow</label>
                                        <input name="slowPeriod" type="number" defaultValue={bot.parameters?.slowPeriod ?? 26} className="w-full bg-gray-800 border-gray-600 rounded px-2 py-1.5 text-sm" />
                                    </div>
                                    <div>
                                        <label className="flex items-center text-xs font-medium text-gray-400 mb-1">Signal</label>
                                        <input name="signalPeriod" type="number" defaultValue={bot.parameters?.signalPeriod ?? 9} className="w-full bg-gray-800 border-gray-600 rounded px-2 py-1.5 text-sm" />
                                    </div>
                                </div>
                            )}
                            {selectedStrategy === 'SMA_CROSSOVER' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="flex items-center text-xs font-medium text-gray-400 mb-1">Fast Period</label>
                                        <input name="fastPeriod" type="number" defaultValue={bot.parameters?.fastPeriod ?? 10} className="w-full bg-gray-800 border-gray-600 rounded px-2 py-1.5 text-sm" />
                                    </div>
                                    <div>
                                        <label className="flex items-center text-xs font-medium text-gray-400 mb-1">Slow Period</label>
                                        <input name="slowPeriod" type="number" defaultValue={bot.parameters?.slowPeriod ?? 50} className="w-full bg-gray-800 border-gray-600 rounded px-2 py-1.5 text-sm" />
                                    </div>
                                </div>
                            )}
                        </div>
                         {isLocked && <p className="text-xs text-yellow-500">Editing is disabled because this bot is linked to an active vault.</p>}
                    </fieldset>

                    {error && <div className="text-red-400 text-sm bg-red-900/30 p-3 rounded-md"><strong>Error:</strong> {error}</div>}

                    <div className="flex justify-end pt-4 border-t border-gray-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 mr-3 text-gray-300 bg-gray-700 rounded-md">Cancel</button>
                        <button type="submit" disabled={isPending} className="px-5 py-2 bg-blue-600 text-white rounded-md font-semibold disabled:bg-blue-900">
                            {isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};