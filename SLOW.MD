
# 2️⃣ Frontend Doc – Live Chart + Smooth Animation

You already have a `ChartComponent` that takes `data` and renders with `lightweight-charts`. We just need:

1. A **client hook** that connects to `socket.io` and receives `market:tick` events.
2. A simple way to:

   * Update the chart data for each symbol.
   * Animate the price movement (chart already animates nicely if data changes).

---

## 1. Symbols & mapping

We will:

*   For **real-time WebSocket data** (from our `socket.io` server), use **Binance lowercase symbols** like: `btcusdt`, `ethusdt`, `bnbusdt` etc.
*   For **historical data** (from `GET /api/v1/markets/candles`), use **Yahoo Finance symbols** like: `BTC-USD`, `ETH-USD`, `AAPL`, `EURUSD=X`, `GLD`.

Create a config:

```ts
// src/modules/market/market.config.ts
export const BINANCE_SYMBOLS = [
  'btcusdt',
  'ethusdt',
  // add more slowly; keep it small at first
];

export const BINANCE_WS_URL = 'wss://stream.binance.com:9443/stream';
```

## 2. Frontend WS hook (Next.js, client)

Install socket.io client:

```bash
npm install socket.io-client
```

Create a hook:

```ts
// app/hooks/useMarketSocket.ts
'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type MarketTick = {
  symbol: string;
  last: number;
  ts: number;
};

export const useMarketSocket = () => {
  const [ticks, setTicks] = useState<MarketTick[]>([]);

  useEffect(() => {
    const socket: Socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Connected to market WS', socket.id);
    });

    socket.on('market:ticks', (data: MarketTick[]) => {
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
```

Set `NEXT_PUBLIC_WS_URL` to your backend server (same URL as HTTP, socket.io handles the path, e.g. `http://localhost:8080`).

---

## 3. Converting ticks → chart data (for Candlestick Chart)

For a proper candlestick chart, you'll need to combine historical data with live ticks. The strategy is to fetch initial historical candles and then update the *last candle* with each new live tick.

```ts
// app/hooks/useCandlestickSeries.ts (renamed for clarity)
'use client';

import { useEffect, useState, useCallback } from 'react';
import type { CandlestickData } from 'lightweight-charts';
import { useMarketSocket } from './useMarketSocket';

// Assume a utility to fetch historical data via HTTP
// You'll need to implement this, e.g., using `axios` or `fetch`
const fetchHistoricalCandles = async (symbol: string, resolution: string, from: number, to: number): Promise<CandlestickData[]> => {
  // Example: Replace with your actual API call
  const response = await fetch(`/api/v1/markets/candles?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}`);
  if (!response.ok) {
    console.error('Failed to fetch historical candles', response.statusText);
    return [];
  }
  const data = await response.json();
  // Ensure data is sorted by time ascending
  return data.sort((a: CandlestickData, b: CandlestickData) => a.time - b.time);
};

export const useCandlestickSeries = (symbol: string, resolution: string = '1') => {
  const liveTicks = useMarketSocket(); // All live ticks from WS
  const [series, setSeries] = useState<CandlestickData[]>([]);
  const [lastTickTime, setLastTickTime] = useState<number>(0);

  // 1. Fetch initial historical data
  useEffect(() => {
    const loadInitialData = async () => {
      // Fetch data for the last 24 hours (example)
      const now = Math.floor(Date.now() / 1000);
      const twentyFourHoursAgo = now - (24 * 60 * 60);
      const initialCandles = await fetchHistoricalCandles(symbol, resolution, twentyFourHoursAgo, now);
      setSeries(initialCandles);
      if (initialCandles.length > 0) {
        setLastTickTime(initialCandles[initialCandles.length - 1].time);
      }
    };
    loadInitialData();
  }, [symbol, resolution]);

  // 2. Update the last candle with live ticks
  useEffect(() => {
    const relevantTicks = liveTicks.filter(
      (t) => t.symbol.toLowerCase() === symbol.toLowerCase() && Math.floor(t.ts / 1000) >= lastTickTime
    );

    if (!relevantTicks.length) return;

    setSeries((prevSeries) => {
      const updatedSeries = [...prevSeries];
      let currentLastCandle = updatedSeries[updatedSeries.length - 1];

      for (const tick of relevantTicks) {
        const tickTime = Math.floor(tick.ts / 1000); // Convert ms to seconds

        // If the tick is for a new minute (new candle)
        if (tickTime > currentLastCandle.time) {
          // Create a new candle based on the last known price
          const newCandleTime = currentLastCandle.time + (60 * parseInt(resolution, 10)); // Assuming resolution is in minutes
          currentLastCandle = {
            time: newCandleTime,
            open: tick.last,
            high: tick.last,
            low: tick.last,
            close: tick.last,
          };
          updatedSeries.push(currentLastCandle);
        } else {
          // Update the current last candle
          currentLastCandle.close = tick.last;
          currentLastCandle.high = Math.max(currentLastCandle.high, tick.last);
          currentLastCandle.low = Math.min(currentLastCandle.low, tick.last);
        }
      }

      // Keep only a reasonable number of candles for performance
      const MAX_CANDLES = 500; // Adjust as needed
      if (updatedSeries.length > MAX_CANDLES) {
        return updatedSeries.slice(updatedSeries.length - MAX_CANDLES);
      }
      return updatedSeries;
    });

    // Update lastTickTime to prevent reprocessing old ticks
    if (relevantTicks.length > 0) {
      setLastTickTime(Math.floor(relevantTicks[relevantTicks.length - 1].ts / 1000));
    }

  }, [liveTicks, symbol, resolution, lastTickTime]);

  return series;
};

---

## 4. Using it in your chart page

You already have `ChartComponent`. For a candlestick chart:

```tsx
// app/(dashboard)/trade/page.tsx
'use client';

import { ChartComponent } from '@/components/ChartComponent';
import { useCandlestickSeries } from '@/hooks/useCandlestickSeries'; // Note the new hook name

export default function TradePage() {
  // Use a Binance symbol for crypto, as live data comes from Binance WS
  const btcCandles = useCandlestickSeries('btcusdt', '1'); // 1-minute resolution

  return (
    <div className="h-[400px] w-full">
      <ChartComponent
        data={btcCandles}
        chartType="Candlestick" // Changed to Candlestick
        colors={{
          backgroundColor: '#020617',
          textColor: '#f9fafb',
        }}
      />
    </div>
  );
}
```

`lightweight-charts` will handle **smooth transitions** when you call `.setData()` with slightly updated series every second.

If you want **super smooth** (no hard jumps):

* Instead of calling `setData` for the whole series, you can store the series instance in the chart component and use `series.update({ time, value })`.
  But your current implementation (`setData` on every change) is okay to start with.

---

## 5. “Sleek animation” notes for frontend team

Give this to them:

*   The **visual smoothness** for a candlestick chart will come from:

    *   Updating the **last candle** of the series with live prices every 1 second (or even 200–500ms if backend throttles that).
    *   `lightweight-charts` naturally animates points between updates.
*   UX recommendations:

    *   Show **current price label** on the right side of chart (price scale).
    *   Add a tiny **marker** / glow on the latest point (e.g. `series.createPriceLine` or overlay a small dot using custom series options).
    *   Use subtle background + grid (you already have navy + blue lines, which is good).
*   Don’t overdo animations (no crazy Framer Motion on the chart itself). Let the chart library handle the motion; use Framer Motion only for surrounding UI (cards, panel transitions, etc.).

---

## Summary you can tell both teams

**Backend:**

*   Implement **Binance WebSocket worker** that:

    *   Subscribes to **Binance lowercase symbols** (`btcusdt@trade`, `ethusdt@trade`, etc.).
    *   Writes the latest price into Redis keys `price:BINANCE:{symbol}`.
*   Implement a **MarketCacheService** that reads from Redis and a REST endpoint `GET /api/v1/markets/quotes?symbol={binance_symbol}`.
*   Start a **socket.io server** that:

    *   Every 1s reads all configured **Binance symbols** from Redis.
    *   Emits `market:ticks` event to clients with the array of `{ symbol, last, ts }`.

**Frontend:**

*   **Symbol Management:**

    *   For **real-time data** (from our `socket.io` server and `GET /markets/quotes`), use **Binance lowercase symbols** (e.g., `btcusdt`).
    *   For **historical data** (from `GET /api/v1/markets/candles`), use **Yahoo Finance symbols** (e.g., `BTC-USD`, `AAPL`, `EURUSD=X`).
*   Use `socket.io-client` to connect to backend WS.
*   Subscribe to `market:ticks` event.
*   **Chart Implementation:**

    1.  **Initial Load:** Fetch historical candlestick data from `GET /api/v1/markets/candles` (using Yahoo Finance symbols) to draw the initial chart.
    2.  **Live Updates:** Use the incoming `market:ticks` (from Binance symbols) to update the *last candle* of the candlestick chart. You will need to map the Binance symbol from the tick to the corresponding Yahoo Finance symbol if your chart is initialized with Yahoo Finance symbols.
*   The chart will update every second and animate smoothly, giving that “live trading terminal” feel.

If you want, next I can:

*   Turn the backend worker + WS into **ready-to-paste TypeScript files** with imports matched to your folder structure, or
*   Tune the chart component to use `.update()` instead of `.setData()` for even smoother streaming behaviour.