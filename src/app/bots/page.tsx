'use client';

import { useState, useEffect, useActionState } from 'react';
import { getBots, createBot, updateBot, getBotDefinitions, archiveBot } from '@/actions/bot';
import { getInstruments } from '@/actions/market';
import { getWallet } from '@/actions/user';
import { Play, Pause, Settings, Shield, ShieldAlert, Plus, X, Check, Trash2, Info } from 'lucide-react';
import { useUserStore } from '@/store/user';
import Header from '@/components/Header';

export default function BotsPage() {
  const [bots, setBots] = useState<any[]>([]);
  const [instruments, setInstruments] = useState<any[]>([]);
  const [definitions, setDefinitions] = useState<Record<string, string>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState('RANDOM_TEST');
  const { tradingMode, setWallet } = useUserStore();
  const [createState, createFormAction] = useActionState(createBot, undefined);

  const fetchBots = async () => {
    const res = await getBots();
    if (res.data) {
      // Optional: Filter by tradingMode if backend returns all
      setBots(res.data);
    }
  };

  const fetchInstruments = async () => {
      const res = await getInstruments();
      if (res.data) {
          setInstruments(res.data);
      }
  }

  const fetchDefinitions = async () => {
      const res = await getBotDefinitions();
      if (res.data) {
          setDefinitions(res.data);
      }
  }

  const fetchWallet = async () => {
      const res = await getWallet();
      if (res.data) {
          setWallet(res.data);
      }
  }

  useEffect(() => {
    fetchBots();
    fetchInstruments();
    fetchDefinitions();
    fetchWallet();
    const interval = setInterval(fetchBots, 5000); // Refresh stats
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (createState?.data) {
      setIsModalOpen(false);
      fetchBots();
    }
  }, [createState]);

  const toggleBotStatus = async (bot: any) => {
    const newStatus = bot.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    await updateBot(bot._id, { status: newStatus });
    fetchBots();
  };

  const toggleInsurance = async (bot: any) => {
      await updateBot(bot._id, { insuranceEnabled: !bot.insuranceEnabled });
      fetchBots();
  }

  const handleArchiveBot = async (botId: string) => {
      if (confirm('Are you sure you want to archive this bot?')) {
          await archiveBot(botId);
          fetchBots();
      }
  }

  const Tooltip = ({ text }: { text?: string }) => {
      if (!text) return null;
      return (
          <div className="group relative inline-block ml-1">
              <Info className="w-3 h-3 text-gray-400 cursor-help" />
              <div className="invisible group-hover:visible absolute z-10 w-48 p-2 mt-1 text-xs text-white bg-gray-800 rounded shadow-lg -left-20">
                  {text}
              </div>
          </div>
      );
  };

  return (
    <>
    <Header />
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Automated Bots</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Bot
          </button>
        </div>

        {/* Bots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot) => (
            <div key={bot._id} className="bg-white rounded-lg shadow p-6 relative border border-gray-200">
              <button 
                  onClick={() => handleArchiveBot(bot._id)}
                  className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 transition-colors"
                  title="Archive Bot"
              >
                  <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex justify-between items-start mb-4 pr-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{bot.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded font-bold ${bot.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {bot.status}
                  </span>
                   <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{bot.mode}</span>
                </div>
              </div>

              <div className="flex space-x-2 mb-4">
                    <button 
                        onClick={() => toggleInsurance(bot)}
                        title={bot.insuranceEnabled ? "Insurance ON" : "Insurance OFF"}
                        className={`flex-1 flex items-center justify-center py-1 rounded text-xs font-bold ${bot.insuranceEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}
                    >
                        <Shield className="w-3 h-3 mr-1" />
                        {bot.insuranceEnabled ? 'Insured' : 'No Insurance'}
                    </button>
                    <button
                        onClick={() => toggleBotStatus(bot)}
                        className={`flex-1 flex items-center justify-center py-1 rounded text-xs font-bold ${bot.status === 'ACTIVE' ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                    >
                        {bot.status === 'ACTIVE' ? <><Pause className="w-3 h-3 mr-1" /> Pause</> : <><Play className="w-3 h-3 mr-1" /> Start</>}
                    </button>
              </div>

              <div className="space-y-3 text-sm text-gray-600">
                 <div className="flex justify-between">
                    <span>Strategy:</span>
                    <span className="font-medium">{bot.strategy}</span>
                 </div>
                 <div className="flex justify-between">
                    <span>Assets:</span>
                    <span className="font-medium truncate max-w-[150px]" title={bot.assets?.join(', ')}>
                        {bot.assets?.length > 3 ? `${bot.assets.slice(0, 3).join(', ')}...` : bot.assets?.join(', ')}
                    </span>
                 </div>
                 <div className="flex justify-between">
                    <span>Trade Amount:</span>
                    <span className="font-medium">${bot.config?.tradeAmount || bot.tradeAmount || 0}</span>
                 </div>
                 {/* Show strategy params if available */}
                 {bot.parameters && Object.keys(bot.parameters).length > 0 && (
                     <div className="text-xs bg-gray-50 p-2 rounded mt-1">
                         {Object.entries(bot.parameters).map(([key, val]) => (
                             <span key={key} className="mr-2 block">{key}: {val as string}</span>
                         ))}
                     </div>
                 )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Performance</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 p-2 rounded">
                          <div className="text-xs text-gray-500">Trades</div>
                          <div className="font-bold text-gray-900">{bot.stats?.totalTrades || 0}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                          <div className="text-xs text-gray-500">Win Rate</div>
                          <div className="font-bold text-gray-900">
                              {bot.stats?.totalTrades > 0 
                                ? ((bot.stats.wins / bot.stats.totalTrades) * 100).toFixed(0) 
                                : 0}%
                          </div>
                      </div>
                      <div className={`p-2 rounded ${bot.stats?.netPnL >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          <div className="text-xs opacity-80">Net PnL</div>
                          <div className="font-bold">
                              {bot.stats?.netPnL >= 0 ? '+' : ''}{bot.stats?.netPnL?.toFixed(2) || '0.00'}
                          </div>
                      </div>
                  </div>
                  <div className="mt-2 text-xs text-center text-gray-500">
                      Active Trades: {bot.stats?.activeTrades || 0} / {bot.config?.maxConcurrentTrades}
                  </div>
              </div>
            </div>
          ))}
          
          {bots.length === 0 && (
             <div className="col-span-full text-center py-20 text-gray-500">
                 <div className="mb-4 mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                     <Settings className="w-8 h-8 text-gray-400" />
                 </div>
                 <h3 className="text-lg font-medium">No Bots Created</h3>
                 <p>Create a bot to start automated trading.</p>
             </div>
          )}
        </div>
      </div>

      {/* Create Bot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Bot</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form action={createFormAction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Bot Name</label>
                <input name="name" type="text" required className="mt-1 w-full border rounded-md px-3 py-2" placeholder="e.g., Alpha One" />
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    Select Assets to Trade
                    <Tooltip text={definitions.assets} />
                </label>
                <div className="h-32 overflow-y-auto border rounded-md p-2 grid grid-cols-2 gap-2 bg-gray-50">
                    {instruments.map((inst) => (
                        <label key={inst.symbol} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                            <input type="checkbox" name="assets" value={inst.symbol} className="rounded text-indigo-600 focus:ring-indigo-500" />
                            <span className="text-xs font-medium text-gray-700">{inst.displayName}</span>
                        </label>
                    ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Select at least one asset.</p>
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700">
                    Strategy
                    <Tooltip text={definitions.strategy} />
                </label>
                <select 
                    name="strategy" 
                    className="mt-1 w-full border rounded-md px-3 py-2"
                    value={selectedStrategy}
                    onChange={(e) => setSelectedStrategy(e.target.value)}
                >
                  <option value="RANDOM_TEST">Random (Test)</option>
                  <option value="RSI_STRATEGY">RSI Reversal</option>
                  <option value="SMA_CROSSOVER">Golden Cross (SMA)</option>
                  <option value="MACD_STRATEGY">MACD Crossover (Premium)</option>
                </select>
                {definitions[selectedStrategy] && <p className="text-xs text-gray-500 mt-1">{definitions[selectedStrategy]}</p>}
              </div>

              {/* Dynamic Parameters */}
              {selectedStrategy === 'RSI_STRATEGY' && (
                  <div className="bg-gray-50 p-3 rounded-md">
                      <label className="flex items-center text-xs font-medium text-gray-700">
                          RSI Period
                          <Tooltip text={definitions.period} />
                      </label>
                      <input name="period" type="number" defaultValue={14} className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
                  </div>
              )}

              {selectedStrategy === 'MACD_STRATEGY' && (
                  <div className="bg-gray-50 p-3 rounded-md grid grid-cols-3 gap-2">
                      <div>
                          <label className="flex items-center text-xs font-medium text-gray-700">
                              Fast
                              <Tooltip text={definitions.fastPeriod} />
                          </label>
                          <input name="fastPeriod" type="number" defaultValue={12} className="mt-1 w-full border rounded-md px-2 py-2 text-sm" />
                      </div>
                      <div>
                          <label className="flex items-center text-xs font-medium text-gray-700">
                              Slow
                              <Tooltip text={definitions.slowPeriod} />
                          </label>
                          <input name="slowPeriod" type="number" defaultValue={26} className="mt-1 w-full border rounded-md px-2 py-2 text-sm" />
                      </div>
                      <div>
                          <label className="flex items-center text-xs font-medium text-gray-700">
                              Signal
                              <Tooltip text={definitions.signalPeriod} />
                          </label>
                          <input name="signalPeriod" type="number" defaultValue={9} className="mt-1 w-full border rounded-md px-2 py-2 text-sm" />
                      </div>
                  </div>
              )}

              {selectedStrategy === 'SMA_CROSSOVER' && (
                  <div className="bg-gray-50 p-3 rounded-md grid grid-cols-2 gap-4">
                      <div>
                          <label className="flex items-center text-xs font-medium text-gray-700">
                              Fast Period
                              <Tooltip text={definitions.fastPeriod} />
                          </label>
                          <input name="fastPeriod" type="number" defaultValue={10} className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
                      </div>
                      <div>
                          <label className="flex items-center text-xs font-medium text-gray-700">
                              Slow Period
                              <Tooltip text={definitions.slowPeriod} />
                          </label>
                          <input name="slowPeriod" type="number" defaultValue={50} className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
                      </div>
                  </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700">
                        Trade Amount ($)
                        <Tooltip text={definitions.tradeAmount} />
                    </label>
                    <input name="tradeAmount" type="number" defaultValue={10} min={1} className="mt-1 w-full border rounded-md px-3 py-2" />
                  </div>
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700">
                        Expiry (Sec)
                        <Tooltip text={definitions.expirySeconds} />
                    </label>
                    <input name="expirySeconds" type="number" defaultValue={60} min={5} className="mt-1 w-full border rounded-md px-3 py-2" />
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700">
                        Max Concurrent
                        <Tooltip text={definitions.maxConcurrentTrades} />
                    </label>
                    <input name="maxConcurrentTrades" type="number" defaultValue={3} min={1} max={10} className="mt-1 w-full border rounded-md px-3 py-2" />
                  </div>
                  <div className="flex items-center pt-6">
                     <label className="flex items-center space-x-2 cursor-pointer">
                         <input name="insuranceEnabled" type="checkbox" className="w-4 h-4 text-indigo-600 rounded" />
                         <span className="text-sm font-medium text-gray-700 flex items-center">
                            <Shield className="w-3 h-3 mr-1 text-blue-500" />
                            Enable Insurance
                            <Tooltip text={definitions.insuranceEnabled} />
                         </span>
                     </label>
                  </div>
              </div>
              
              <div className="border-t pt-4 mt-2">
                  <h4 className="text-xs font-semibold text-gray-500 mb-2">Risk Management</h4>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center text-xs font-medium text-gray-700">
                            Stop Loss (Net Loss $)
                            <Tooltip text={definitions.stopLossAmount} />
                        </label>
                        <input name="stopLossAmount" type="number" defaultValue={100} className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="flex items-center text-xs font-medium text-gray-700">
                            Take Profit (Net Win $)
                            <Tooltip text={definitions.takeProfitAmount} />
                        </label>
                        <input name="takeProfitAmount" type="number" defaultValue={200} className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
                      </div>
                  </div>
              </div>

              {createState?.error && <p className="text-sm text-red-500">{createState.error}</p>}
              
              <div className="pt-4">
                <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 font-medium">
                  Create Bot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
