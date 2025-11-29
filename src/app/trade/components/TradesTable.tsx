


'use client';

import React, { useEffect, useState } from 'react';

import { Bot, Shield } from 'lucide-react';

import { MarketTick } from '@/hooks/useSubscriptionMarketData';

import { toBackendSymbol } from '@/lib/symbolMapping';



type Trade = {

  _id: string;

  botId?: string;

  instrumentSymbol: string;

  symbol: string;

  direction: 'UP' | 'DOWN';

  stakeUsd: number;

  entryPrice: number;

  exitPrice?: number;

  createdAt: string;

  expiresAt: string;

  settledAt: string;

  closedAt: string;

  outcome: 'WIN' | 'LOSS' | 'DRAW';

  payoutAmount: number;

  isInsured: boolean;

  platformFee: number;

  mode: 'LIVE' | 'DEMO';

};







const TradeRow = ({ trade, type, prices }: { trade: Trade, type: 'OPEN' | 'HISTORY', prices?: Record<string, MarketTick> }) => {

  const [timeLeft, setTimeLeft] = useState<string>('');



  useEffect(() => {

    if (type === 'OPEN') {

      const interval = setInterval(() => {

        const now = Date.now();

        const target = new Date(trade.expiresAt).getTime();

        const diff = Math.max(0, Math.floor((target - now) / 1000));



        if (diff === 0) {

          setTimeLeft('Closing...');

        } else {

          const mins = Math.floor(diff / 60);

          const secs = diff % 60;

          setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);

        }

      }, 1000);



      return () => clearInterval(interval);

    }

  }, [trade.expiresAt, type]);



  let currentPrice = 0;

  let isWinning = false;

  let statusText = '...';



  if (type === 'OPEN' && prices) {

    const sym = trade.instrumentSymbol || trade.symbol;

    const backendSymMapped = toBackendSymbol(sym);



    const tick = prices[backendSymMapped];

    if (tick) {

      currentPrice = tick.last;

      if (trade.direction === 'UP') {

        isWinning = currentPrice > trade.entryPrice;

      } else {

        isWinning = currentPrice < trade.entryPrice;

      }

      statusText = isWinning ? 'WINNING' : 'LOSING';

    }

  }



  let payoutDisplay = '0.00';

  if (type === 'HISTORY') {

    if (trade.payoutAmount !== undefined && trade.payoutAmount !== null) {

      payoutDisplay = Number(trade.payoutAmount).toFixed(2);

    } else {

      payoutDisplay = '0.00';

    }

  }



  return (

    <tr className="border-b border-gray-800 hover:bg-[#2a2e39]">

      <td className="p-2 text-white font-medium">

        {trade.botId && <Bot className="w-3 h-3 inline mr-1 text-indigo-400" />}

        {trade.instrumentSymbol || trade.symbol}

      </td>

      <td className={`p-2 font-bold ${trade.direction === 'UP' ? 'text-green-500' : 'text-red-500'}`}>{trade.direction}</td>

      <td className="p-2">${trade.stakeUsd}</td>

      <td className="p-2">{trade.entryPrice}</td>



      <td className={`p-2 ${type === 'OPEN' ? (isWinning ? 'text-green-500' : 'text-red-500') : ''}`}>

        {type === 'OPEN' ? (currentPrice > 0 ? currentPrice : '...') : trade.exitPrice}

      </td>



      {type === 'OPEN' && (

        <td className={`p-2 font-bold ${isWinning ? 'text-green-500' : 'text-red-500'}`}>

          {statusText}

        </td>

      )}



      <td className="p-2">

        {type === 'OPEN' ? (

          <span>{timeLeft}</span>

        ) : (

          new Date(trade.settledAt || trade.closedAt).toLocaleTimeString()

        )}

      </td>



      {type === 'HISTORY' && (

        <>

          <td className={`p-2 font-bold ${trade.outcome === 'WIN' ? 'text-green-500' : trade.outcome === 'DRAW' ? 'text-yellow-500' : 'text-red-500'}`}>{trade.outcome}</td>

          <td className={`p-2 ${trade.outcome === 'WIN' ? 'text-green-500' : trade.outcome === 'DRAW' ? 'text-yellow-500' : 'text-gray-500'}`}>

            <div className="flex items-center">

              ${payoutDisplay}

              {trade.isInsured && <Shield className="w-3 h-3 ml-1 text-blue-500" />}

            </div>

            {trade.platformFee > 0 && <div className="text-[9px] text-gray-500">Fee: -${Number(trade.platformFee).toFixed(2)}</div>}

          </td>

        </>

      )}

    </tr>

  );

};



const TradesTable = ({ trades, type, prices }: { trades: Trade[], type: 'OPEN' | 'HISTORY', prices?: Record<string, MarketTick> }) => {

  return (

    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600">

      <table className="w-full text-left text-xs text-gray-400">

        <thead className="bg-[#2a2e39] sticky top-0 z-10">

          <tr>

            <th className="p-2">Symbol</th>

            <th className="p-2">Direction</th>

            <th className="p-2">Stake</th>

            <th className="p-2">Entry Price</th>

            <th className="p-2">{type === 'OPEN' ? 'Current Price' : 'Exit Price'}</th>

            {type === 'OPEN' && <th className="p-2">Status</th>}

            <th className="p-2">{type === 'OPEN' ? 'Time Left' : 'Closed At'}</th>

            {type === 'HISTORY' && <th className="p-2">Outcome</th>}

            {type === 'HISTORY' && <th className="p-2">Payout</th>}

          </tr>

        </thead>

        <tbody>

          {trades.length === 0 ? (

            <tr><td colSpan={type === 'OPEN' ? 7 : 8} className="p-4 text-center">No {type.toLowerCase()} trades</td></tr>

          ) : (

            trades.map((t) => <TradeRow key={t._id} trade={t} type={type} prices={prices} />)

          )}

        </tbody>

      </table>

    </div>

  );

}



export default TradesTable;
