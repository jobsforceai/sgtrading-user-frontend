'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUserStore } from '@/store/user';
import { useTradeStore } from '@/store/trade';
import { useAuthStore } from '@/store/auth';
import { Trade } from '@/types/trade';
import { getOpenTrades, getTradeHistory } from '@/actions/trade';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080';

let socket: Socket | null = null;

export const useSubscriptionTradeData = () => {
  const { tokens } = useAuthStore();
  const { tradingMode } = useUserStore();
  const { setOpenTrades, setHistoryTrades, setNotification } = useTradeStore();
  const isConnecting = useRef(false);
  const prevOpenTradesRef = useRef(new Set<string>());

  // Effect for initial data fetching via REST API
  useEffect(() => {
    const accessToken = tokens?.accessToken;
    if (!accessToken) return;

    const fetchInitialData = async () => {
      console.log(`[InitialData] Fetching initial data for mode: ${tradingMode}`);
      
      // Fetch initial open trades
      const openRes = await getOpenTrades();
      if (openRes && !openRes.error) {
        const currentOpenTrades = openRes.filter((t: any) => t.mode === tradingMode);
        console.log(`[InitialData] Fetched ${currentOpenTrades.length} open trades.`);
        setOpenTrades(currentOpenTrades);
        prevOpenTradesRef.current = new Set(currentOpenTrades.map((t: Trade) => t._id));
      } else {
        console.error('[InitialData] Error fetching open trades:', openRes?.error);
      }

      // Fetch initial history (e.g., first 50 trades)
      const historyRes = await getTradeHistory(tradingMode, 1, 50);
      if (historyRes && !historyRes.error) {
        console.log(`[InitialData] Fetched ${historyRes.length} history trades.`);
        setHistoryTrades(historyRes);
      } else {
        console.error('[InitialData] Error fetching trade history:', historyRes?.error);
      }
    };

    fetchInitialData();
  }, [tokens?.accessToken, tradingMode, setOpenTrades, setHistoryTrades]);


  // Effect for settlement detection
  useEffect(() => {
    const detectSettledTrades = async () => {
      const { openTrades, historyTrades } = useTradeStore.getState();
      const currentOpenTradeIds = new Set(openTrades.map(t => t._id));

      const settledIds = [...prevOpenTradesRef.current].filter(id => !currentOpenTradeIds.has(id));

      if (settledIds.length > 0) {
        console.log('[SettlementDetection] Detected settled trade IDs:', settledIds);
        const historyRes = await getTradeHistory(tradingMode, 1, settledIds.length + 5);
        if (historyRes && !historyRes.error) {
          const newHistoryItems: Trade[] = [];
          settledIds.forEach(id => {
            const settledTrade = historyRes.find((t: Trade) => t._id === id);
            if (settledTrade) {
              newHistoryItems.push(settledTrade);
              setNotification({
                message: `Trade ${settledTrade.instrumentSymbol || settledTrade.symbol} ${settledTrade.outcome}! Payout: $${Number(settledTrade.payoutAmount ?? 0).toFixed(2)}`,
                type: settledTrade.outcome === 'WIN' ? 'success' : 'error',
              });
            }
          });
          if (newHistoryItems.length > 0) {
            setHistoryTrades([...newHistoryItems, ...historyTrades]);
          }
        }
      }
      prevOpenTradesRef.current = currentOpenTradeIds;
    };
    detectSettledTrades();
  }, [useTradeStore.getState().openTrades, tradingMode, setHistoryTrades, setNotification]);


  // Effect for WebSocket connection and polling
  useEffect(() => {
    const accessToken = tokens?.accessToken;
    if (!accessToken) return;

    if (!socket || !socket.connected) {
        if (isConnecting.current) return;
        isConnecting.current = true;

        if (socket) socket.disconnect();

        socket = io(WS_URL, {
            transports: ['websocket'],
            auth: { token: `Bearer ${accessToken}` },
            autoConnect: false,
        });

        socket.on('connect', () => {
            console.log('[TradeSocket] ==> Connected to trade WS.', socket?.id);
            isConnecting.current = false;
        });

        socket.on('disconnect', (reason: string) => {
            console.log('[TradeSocket] ==> Disconnected from trade WS:', reason);
            isConnecting.current = false;
        });

        socket.on('connect_error', (err: Error) => {
            console.error('[TradeSocket] ==> Connection Error:', err.message);
            isConnecting.current = false;
        });

        socket.on('trades:new', (trade: Trade) => {
            console.log('[TradeSocket] <== Received trades:new:', trade);
            if (trade.mode === tradingMode) {
                const { openTrades } = useTradeStore.getState();
                setOpenTrades([trade, ...openTrades]);
            }
        });
        
        socket.connect();
    }

    const fetchOpenTrades = async () => {
      const openRes = await getOpenTrades();
      if (openRes && !openRes.error) {
        const currentOpenTrades = openRes.filter((t: any) => t.mode === tradingMode);
        setOpenTrades(currentOpenTrades);
      }
    };

    const pollingInterval = setInterval(fetchOpenTrades, 2000);

    return () => {
      console.log('[TradeSocket] Cleanup: Clearing polling interval.');
      clearInterval(pollingInterval);
      // Note: We are not disconnecting the socket here to maintain the connection across re-renders.
      // Listeners are specific to this effect instance and should be cleaned up.
      socket?.off('trades:new');
    };
  }, [tokens?.accessToken, tradingMode, setOpenTrades, setHistoryTrades, setNotification]);
};
