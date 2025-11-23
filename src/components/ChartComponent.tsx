"use client";

import {
  ColorType,
  createChart,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  BarData,
  LineStyle,
  AreaSeries,
  BarSeries,
  CandlestickSeries,
  IPriceLine,
  TickMarkType,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";
import { MarketTick } from "@/hooks/useMarketSocket";

type ChartSeries =
  | ISeriesApi<"Candlestick">
  | ISeriesApi<"Area">
  | ISeriesApi<"Bar">;

interface ChartComponentProps {
  data: (CandlestickData | LineData | BarData)[];
  liveTick?: MarketTick;
  chartType: "Candlestick" | "Area" | "Bar" | "Heikin Ashi";
  colors?: {
    backgroundColor?: string;
    textColor?: string;
  };
  decimals?: number;
  openTradePoints?: { id: string; time: number; price: number | null; color?: string; text?: string; expiry?: number }[];
}

export const ChartComponent = ({
  data,
  liveTick,
  chartType,
  colors: { backgroundColor = "#000000", textColor = "#d1d5db" } = {},
  decimals = 2,
  openTradePoints,
}: ChartComponentProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ChartSeries | null>(null);
  const priceLineRef = useRef<IPriceLine | null>(null);
  const currentBarRef = useRef<{ time: number; open: number; high: number; low: number; close: number } | null>(null);
  const [overlayPoints, setOverlayPoints] = useState<any[]>([]);
  const [debugRawPoints, setDebugRawPoints] = useState<any[]>([]);

  // helper: ensure a series data item has a numeric `time` (seconds)
  const ensureNumericTime = (item: any) => {
    if (!item) return item;
    const t = item.time;
    if (typeof t === 'number' && Number.isFinite(t)) {
      return { ...item, time: Math.floor(t > 1e12 ? t / 1000 : t) };
    }
    const parsed = Date.parse(t as string);
    if (!Number.isNaN(parsed)) {
      return { ...item, time: Math.floor(parsed / 1000) };
    }
    return item;
  };

  // Initialize chart + series
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
        attributionLogo: false,
      },
      localization: {
        timeFormatter: (timestamp: number) => new Date(timestamp * 1000).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
      },
      grid: { vertLines: { color: "#333333" }, horzLines: { color: "#333333" } },
      crosshair: { mode: CrosshairMode.Normal },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      rightPriceScale: { borderColor: "#444" },
      timeScale: { borderColor: '#444', timeVisible: true, secondsVisible: true, rightOffset: 100 },
    });
    chartRef.current = chart;

    const priceFormat = { type: "price" as const, precision: decimals, minMove: 1 / Math.pow(10, decimals) };
    let series: ChartSeries;

    switch (chartType) {
      case "Area":
        series = chart.addSeries(AreaSeries, { lineColor: "#2962FF", topColor: "rgba(41, 98, 255, 0.4)", bottomColor: "rgba(41, 98, 255, 0)", priceFormat });
        break;
      case "Bar":
        series = chart.addSeries(BarSeries, { upColor: "#26a69a", downColor: "#ef5350", priceFormat });
        break;
      default: // Candlestick & Heikin Ashi
        const candleSeries = chart.addSeries(CandlestickSeries, { upColor: "#26a69a", downColor: "#ef5350", borderUpColor: "#26a69a", borderDownColor: "#ef5350", wickUpColor: "#26a69a", wickDownColor: "#ef5350", priceFormat });
        priceLineRef.current = candleSeries.createPriceLine({ price: 0, color: "#3b82f6", lineWidth: 1, lineStyle: LineStyle.Solid, axisLabelVisible: true });
        series = candleSeries;
        break;
    }
    seriesRef.current = series;

    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [backgroundColor, textColor, chartType, decimals]);

  // Set/Update historical data
  useEffect(() => {
    if (seriesRef.current) {
      const preparedData = data.map(ensureNumericTime);
      (seriesRef.current as ISeriesApi<"Area" | "Bar" | "Candlestick">).setData(preparedData as any);
      if (data.length > 0) {
        chartRef.current?.timeScale().fitContent();
      }
    }
  }, [data, chartType]);

  // Update for live ticks
  useEffect(() => {
    if (!seriesRef.current || !liveTick) return;
    const price = Number(liveTick.last);
    if (!Number.isFinite(price)) return;

    const timestamp = Math.floor(Number(liveTick.ts) / 1000);
    const bucketTime = Math.floor(timestamp / 5) * 5;

    if (chartType === "Area") {
      (seriesRef.current as ISeriesApi<"Area">).update({ time: bucketTime as any, value: price });
    } else {
      let bar = currentBarRef.current;
      if (bar && bar.time === bucketTime) {
        bar.high = Math.max(bar.high, price);
        bar.low = Math.min(bar.low, price);
        bar.close = price;
      } else {
        const openPrice = bar ? bar.close : price;
        bar = { time: bucketTime, open: openPrice, high: price, low: price, close: price };
      }
      currentBarRef.current = bar;
      (seriesRef.current as ISeriesApi<"Bar" | "Candlestick">).update(bar as any);
    }
    if (priceLineRef.current) {
      priceLineRef.current.applyOptions({ price });
    }
  }, [liveTick, chartType]);

  // Consolidated logic for visualizing open trades
  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;

    // Compute normalized raw points early so we can debug them even if data isn't loaded
    // (helps diagnose why lines aren't rendering when the chart is empty).

    // 1. Prepare raw data for markers from the single source of truth
    // Normalize times and expiry fields from the API. Support multiple possible
    // fields: `time`, `openAt`, `createdAt` for the trade time; `entryPrice` or
    // `price` for the trade price; and `expiresAt` (ISO), `requestedExpirySeconds`
    // (relative seconds), or legacy `expiry` for the duration.
    const raw = (openTradePoints || []).map((p: any) => {
      // Determine trade time (seconds)
      const tradeTime = ((): number => {
        if (typeof p.time === 'number' && Number.isFinite(p.time)) return Math.floor(p.time);
        if (p.openAt) {
          const parsed = Date.parse(p.openAt);
          if (!Number.isNaN(parsed)) return Math.floor(parsed / 1000);
        }
        if (p.createdAt) {
          const parsed = Date.parse(p.createdAt);
          if (!Number.isNaN(parsed)) return Math.floor(parsed / 1000);
        }
        return 0;
      })();

      const price = p.price ?? p.entryPrice ?? null;

      // Raw expiry input could be one of several forms
      const expiryRaw = p.expiry ?? p.requestedExpirySeconds ?? 0;

      // Compute expiryTime (absolute seconds). Prefer explicit `expiresAt` if provided.
      let expiryTime = 0;
      if (p.expiresAt) {
        const parsed = Date.parse(p.expiresAt);
        if (!Number.isNaN(parsed)) expiryTime = Math.floor(parsed / 1000);
      }
      // If expiresAt not provided, derive from expiryRaw: if expiryRaw > tradeTime
      // assume it's already an absolute timestamp; otherwise treat as relative seconds.
      if (!expiryTime && expiryRaw) {
        expiryTime = expiryRaw > tradeTime ? Math.floor(expiryRaw) : Math.floor(tradeTime + expiryRaw);
      }

      return {
        id: p._id ?? p.id,
        time: tradeTime,
        price,
        color: p.color ?? '#999',
        text: p.text ?? (p.direction ? String(p.direction) : ''),
        expiry: expiryRaw,
        expiryTime,
      };
    });

    // expose normalized points to state for an on-screen debug panel
    setDebugRawPoints(raw);

    // GUARD: Exit if the chart is not ready or historical data hasn't loaded.
    if (!chart || !series || data.length === 0) {
      if (seriesRef.current && 'setMarkers' in seriesRef.current) {
        (seriesRef.current as any).setMarkers([]);
      }
      setOverlayPoints([]);
      console.log('ChartComponent: normalized openTradePoints (early)', raw);
      return;
    }

    // Check if any of the points provide a duration/expiry to draw horizontal lines
    const hasDuration = raw.some(r => r.expiry && r.expiryTime && r.expiryTime > r.time);
    if (!hasDuration && (openTradePoints || []).length > 0) {
      console.log('ChartComponent: no expiry/duration found in openTradePoints; duration lines will not be rendered.', { raw });
    }
    // Debug: always log normalized points so we can inspect times/prices
    console.log('ChartComponent: normalized openTradePoints', raw);

    // 2. Set the built-in library markers if the series type supports it
    if ('setMarkers' in series) {
      const markers: any[] = [];
      raw.forEach(r => {
        // Start marker
        markers.push({
          time: r.time,
          position: 'inBar' as const,
          color: r.color,
          shape: 'circle' as const,
          text: r.text,
        });
        // End marker
        if (r.expiryTime && r.expiryTime > r.time) {
          markers.push({
            time: r.expiryTime,
            position: 'inBar' as const,
            color: '#A9A9A9', // A neutral color for the end marker
            shape: 'square' as const,
            text: 'End',
          });
        }
      });
      markers.sort((a, b) => a.time - b.time);
      try {
        (series as any).setMarkers?.(markers);
      } catch (e) {
        console.error("Failed to set markers:", e);
      }
    }

    // 3. Set up a continuous RAF loop to update the custom HTML overlay markers
    let rafId: number;
    const updateOverlayPositions = () => {
      const timeScale = chart.timeScale();
      const newOverlayPoints = [];
      
      for (const r of raw) {
        if (r.price === null) continue;
        // Get visible range and container width for mapping times outside the visible range
        const vr = (timeScale as any).getVisibleRange ? (timeScale as any).getVisibleRange() : null;
        const containerWidth = chartContainerRef.current?.clientWidth ?? 0;
        // Determine whether visible range values are in milliseconds (large numbers)
        const visibleRangeIsMs = !!(vr && typeof vr.from === 'number' && vr.from > 1e12);
        const unitMultiplier = visibleRangeIsMs ? 1000 : 1;
        const mapTimeToPixel = (t: number): number | null => {
          if (!vr || typeof vr.from === 'undefined' || typeof vr.to === 'undefined' || vr.to === vr.from) return null;
          const from = (vr.from as number);
          const to = (vr.to as number);
          const tt = t * unitMultiplier;
          return ((tt - from) / (to - from)) * containerWidth;
        };

        // Adjust the time when calling timeToCoordinate if visible range uses ms
        let x: any = timeScale.timeToCoordinate((visibleRangeIsMs ? r.time * 1000 : r.time) as any);
        if (x === null) {
          const mapped = mapTimeToPixel(r.time);
          x = typeof mapped === 'number' ? mapped : null;
        }

        // guard that the series exposes priceToCoordinate
        const priceToCoordFn = (series as any)?.priceToCoordinate;
        if (typeof priceToCoordFn !== 'function') continue;
        const y = priceToCoordFn.call(series, r.price);

        if (x !== null && y !== null) {
          // Only draw a duration horizontal line if an expiryTime is present and valid
          let width = 0;
          if (r.expiryTime && r.expiryTime > r.time) {
            let x2: any = timeScale.timeToCoordinate((visibleRangeIsMs ? r.expiryTime * 1000 : r.expiryTime) as any);
            if (x2 === null) {
              const mapped2 = mapTimeToPixel(r.expiryTime as any);
              if (typeof mapped2 === 'number') {
                x2 = mapped2;
              } else {
                // Fallback: if mapping not available, put at container edge depending on expiry
                x2 = (r.expiryTime * unitMultiplier) > ((vr && (vr.to as number)) || (r.time * unitMultiplier)) ? containerWidth : 0;
              }
            }
            const rawWidth = (typeof x2 === 'number' && x2 > x) ? x2 - x : 0;
            width = Math.max(Math.round(rawWidth), 8);
          }
          newOverlayPoints.push({ id: r.id, left: x, top: y, color: r.color, text: r.text, width });
        }
      }
      setOverlayPoints(newOverlayPoints);
      // Debug overlay coordinates
      if (newOverlayPoints.length === 0) {
        console.log('ChartComponent: no overlay points calculated (maybe out of range or price/time missing)', { raw });
      } else {
        console.log('ChartComponent: overlay coordinates', newOverlayPoints);
      }
      rafId = requestAnimationFrame(updateOverlayPositions);
    };

    rafId = requestAnimationFrame(updateOverlayPositions);

    // 4. Cleanup: stop the loop when dependencies change
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [data, openTradePoints, chartType]); // Dependencies ensure this runs when data is ready

  return (
    <div className="h-full w-full relative">
      <div ref={chartContainerRef} className="h-full w-full" />
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
        {overlayPoints.map((p) => (
          <div key={p.id}>
            <div
              title={p.text}
              style={{
                position: 'absolute',
                left: `${p.left}px`,
                top: `${p.top}px`,
                transform: 'translate(-50%, -50%)',
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: p.color,
                border: '2px solid rgba(255,255,255,0.9)',
                boxShadow: '0 0 6px rgba(0,0,0,0.6)'
              }}
            />
            {p.width > 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: `${p.left}px`,
                  top: `${p.top}px`,
                  width: `${Math.max(p.width, 8)}px`,
                  height: '1px',
                  background: p.color,
                  transform: 'translateY(-50%)',
                  opacity: 0.95,
                  borderRadius: 2,
                  boxShadow: '0 1px 6px rgba(0,0,0,0.6)',
                  
                }}
              />
            )}
          </div>
        ))}
        {/* Debug panel: shows normalized trade points and overlay coords for troubleshooting */}
        {/* {debugRawPoints.length > 0 && (
          <div style={{ position: 'absolute', right: 6, bottom: 6, zIndex: 10000, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: 8, maxWidth: 320, fontSize: 12, borderRadius: 6, overflow: 'auto' }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Chart Debug</div>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(debugRawPoints, null, 2)}</pre>
          </div>
        )} */}
      </div>
    </div>
  );
};