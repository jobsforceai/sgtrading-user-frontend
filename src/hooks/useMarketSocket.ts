'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export type MarketTick = {
  symbol: string;
  last: number;
  ts: number;
};

export const useMarketSocket = () => {
  const [ticks, setTicks] = useState<MarketTick[]>([]);

  useEffect(() => {
    const socket: Socket = io('http://localhost:8080', {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Connected to market WS', socket.id);
    });

    socket.on('market:ticks', (data: MarketTick[]) => {
      console.log('WS Symbols received:', data.map(t => t.symbol));
      setTicks(data);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from market WS');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return ticks;
};
