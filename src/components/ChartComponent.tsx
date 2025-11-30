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
  CandlestickSeries,
  IPriceLine,
  LineWidth,
} from "lightweight-charts";
import { useEffect, useRef, useState, useMemo } from "react";
import { MarketTick } from "@/hooks/useSubscriptionMarketData";
import { Lock } from 'lucide-react';

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
  openTradePoints?: any[];
  isMarketOpen?: boolean;
  onVisibleRangeChange?: (range: { from: number; to: number } | null) => void;
  scaleFactor?: number;
}

export const ChartComponent = ({
  data,
  liveTick,
  chartType,
  colors: { backgroundColor = "#000000", textColor = "#d1d5db" } = {},
  decimals = 2,
  openTradePoints,
  isMarketOpen = true,
  onVisibleRangeChange,
  scaleFactor = 28,
}: ChartComponentProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ChartSeries | null>(null);
  const priceLineRef = useRef<IPriceLine | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const currentBarRef = useRef<{ time: number; open: number; high: number; low: number; close: number } | null>(null);
  const tradePriceLines = useRef<Map<string, IPriceLine>>(new Map());
  const [overlayPoints, setOverlayPoints] = useState<any[]>([]);
  const [visibleRange, setVisibleRange] = useState<{ from: number; to: number } | null>(null);

  // Parse arbitrary time/expiry-like values into seconds (number)
  const parseToSeconds = (v: any): number | null => {
    if (v == null) return null;
    if (typeof v === 'number' && Number.isFinite(v)) {
      return v > 1e12 ? Math.floor(v / 1000) : Math.floor(v);
    }
    if (typeof v === 'object' && v !== null) {
      if (typeof v.seconds === 'number') return v.seconds; // Firestore-like
      if (v instanceof Date) return Math.floor(v.getTime() / 1000);
      if (typeof v.toDate === 'function') return Math.floor(v.toDate().getTime() / 1000);
    }
    const n = Number(v);
    if (Number.isFinite(n)) {
      return n > 1e12 ? Math.floor(n / 1000) : Math.floor(n);
    }
    const parsed = Date.parse(String(v));
    if (!Number.isNaN(parsed)) return Math.floor(parsed / 1000);
    return null;
  };

  // helper: ensure a series data item has a numeric `time` (seconds)
  const ensureNumericTime = (item: any) => {
    if (!item) return null;
    const numericTime = parseToSeconds(item.time);
    if (numericTime !== null) {
      return { ...item, time: numericTime };
    }
    console.warn('ChartComponent: could not parse time from data item, it will be skipped', item);
    return null;
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

  // Subscribe to visible range changes and notify parent (normalized to seconds)
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || typeof (chart.timeScale as any) !== 'function') return;
    const timeScale = chart.timeScale();
    const handler = () => {
      const vr = (timeScale as any).getVisibleRange ? (timeScale as any).getVisibleRange() : null;
      if (!vr || typeof vr.from === 'undefined' || typeof vr.to === 'undefined') {
        onVisibleRangeChange?.(null);
        setVisibleRange(null);
        return;
      }
      // normalize to seconds if values are in ms
      let from = vr.from as number;
      let to = vr.to as number;
      if (from > 1e12) { from = Math.floor(from / 1000); to = Math.floor(to / 1000); }
      const normalizedRange = { from: Math.floor(from), to: Math.floor(to) };
      onVisibleRangeChange?.(normalizedRange);
      setVisibleRange(normalizedRange);
    };
    let cleanup = () => {};
    if (typeof (timeScale as any).subscribeVisibleTimeRangeChange === 'function') {
      const maybe = (timeScale as any).subscribeVisibleTimeRangeChange(handler);
      if (typeof maybe === 'function') cleanup = maybe;
    }
    // invoke once immediately to provide initial range
    handler();
    return () => { cleanup(); };
  }, [onVisibleRangeChange]);

  // Set/Update historical data
  useEffect(() => {
    if (seriesRef.current) {
      let preparedData = data.map(ensureNumericTime).filter(Boolean);

      // Add robust validation based on chart type BEFORE setting data
      if (chartType === 'Area') {
        preparedData = preparedData.filter(item => item && Number.isFinite((item as LineData).value));
      } else { // Candlestick, Bar, Heikin Ashi
        preparedData = preparedData.filter(item => 
          item && 
          Number.isFinite((item as CandlestickData).open) &&
          Number.isFinite((item as CandlestickData).high) &&
          Number.isFinite((item as CandlestickData).low) &&
          Number.isFinite((item as CandlestickData).close)
        );
      }

      (seriesRef.current as ISeriesApi<"Area" | "Bar" | "Candlestick">).setData(preparedData as any);
      
      if (preparedData.length > 0) {
        lastTimeRef.current = preparedData[preparedData.length - 1].time as number;
        chartRef.current?.timeScale().fitContent();
        
        // Force overlay recalculation after data is set and chart has rendered
        // This ensures coordinates are available for the first trade
        setTimeout(() => {
          const chart = chartRef.current;
          const ts = chart?.timeScale?.();
          if (ts) {
            const vr = (ts as any).getVisibleRange ? (ts as any).getVisibleRange() : null;
            if (vr) {
              let from = vr.from as number;
              let to = vr.to as number;
              if (from > 1e12) { from = Math.floor(from / 1000); to = Math.floor(to / 1000); }
              setVisibleRange({ from: Math.floor(from), to: Math.floor(to) });
            }
          }
        }, 50);
      } else {
		lastTimeRef.current = null;
	  }
    }
  }, [data, chartType]);

  // Update for live ticks
  useEffect(() => {
    if (!seriesRef.current || !liveTick) return;
    
    const price = Number(liveTick.last);
    if (!Number.isFinite(price)) {
        console.warn('ChartComponent: received a live tick with an invalid price, skipping update.', liveTick);
        return;
    }

    const timestampInSeconds = Math.floor(Number(liveTick.ts) / 1000);
    const lastDataTime = lastTimeRef.current;

    if (chartType === "Area") {
      if (lastDataTime && timestampInSeconds < lastDataTime) {
        return; // Ignore out-of-order ticks
      }
      const point = { time: timestampInSeconds as any, value: price };
      if (Number.isFinite(point.value)) {
        (seriesRef.current as ISeriesApi<"Area">).update(point);
        lastTimeRef.current = timestampInSeconds;
      }
    } else {
      const candleInterval = 5; // 5 seconds per candle
      const bucketTime = Math.floor(timestampInSeconds / candleInterval) * candleInterval;
      
      if (lastDataTime && bucketTime < lastDataTime) {
        return; // Ignore ticks for buckets older than the last series point
      }

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
      if (Number.isFinite(bar.close)) {
        (seriesRef.current as ISeriesApi<"Bar" | "Candlestick">).update(bar as any);
        lastTimeRef.current = bucketTime;
      }
    }

    if (priceLineRef.current) {
      priceLineRef.current.applyOptions({ price });
    }
  }, [liveTick, chartType]);

  const rawTradePoints = useMemo(() => {
    const result = (openTradePoints || []).map((p: any) => {
        const tradeTime = parseToSeconds(p.time ?? p.openAt ?? p.createdAt) ?? 0;
        const price = p.price ?? p.entryPrice ?? null;
        
        // Determine expiryTime: PREFER expiresAt (absolute timestamp) over duration-based calculation
        let expiryTime: number | null = null;
        
        // First try: use expiresAt if available (most reliable)
        if (p.expiresAt) {
          const parsed = parseToSeconds(p.expiresAt);
          if (parsed) expiryTime = parsed;
        }
        
        // Fallback: compute from duration if expiresAt is not available
        if (!expiryTime) {
          const durationSeconds = Number(p.expirySeconds ?? p.requestedExpirySeconds ?? p.expiry ?? 0) || 0;
          if (durationSeconds > 0 && durationSeconds < 10 * 24 * 3600) {
            expiryTime = tradeTime + Math.floor(durationSeconds);
          }
        }

        return {
            id: p._id ?? p.id,
            time: tradeTime,
            price,
            direction: p.direction,
            isWinning: p.isWinning,
            expirySeconds: Number(p.expirySeconds ?? p.requestedExpirySeconds ?? p.expiry ?? 0) || undefined,
            expiryTime,
        };
    });
    return result;
  }, [openTradePoints]);

  // Effect to manage and draw trade indicators (lines and markers)
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    const currentTradeIds = new Set(rawTradePoints.map(p => p.id));
    
    // Remove lines for trades that are no longer open
    tradePriceLines.current.forEach((line, id) => {
      if (!currentTradeIds.has(id)) {
        (series as any).removePriceLine(line);
        tradePriceLines.current.delete(id);
      }
    });

    // Create or update lines for current open trades
    rawTradePoints.forEach(trade => {
      let color = '#9ca3af'; // Neutral gray
      if (trade.isWinning === true) color = '#26a69a'; // Green
      else if (trade.isWinning === false) color = '#ef5350'; // Red

      // Check if line already exists, if so remove it
      const existingLine = tradePriceLines.current.get(trade.id);
      if (existingLine) {
        (series as any).removePriceLine(existingLine);
        tradePriceLines.current.delete(trade.id);
      }
    });

    // Set markers for the entry points and expiry points
    // Note: setMarkers only works on Candlestick/Bar series, not Area
    if ('setMarkers' in series && chartType !== 'Area') {
      const markers: any[] = [];
      rawTradePoints.forEach(trade => {
        let color = '#9ca3af';
        if (trade.isWinning === true) color = '#26a69a';
        else if (trade.isWinning === false) color = '#ef5350';

        // Entry marker (arrow up/down)
        markers.push({
          time: trade.time,
          position: trade.direction === 'UP' ? 'belowBar' : 'aboveBar',
          color,
          shape: trade.direction === 'UP' ? 'arrowUp' : 'arrowDown',
          size: 2,
        });

        // Expiry marker (square) at computed expiryTime, if available
        if (trade.expiryTime && trade.expiryTime > trade.time) {
          markers.push({
            time: trade.expiryTime,
            position: 'inBar' as const,
            color: '#ffffff',
            shape: 'square' as const,
            text: 'End',
            size: 2,
          });
        }
      });

      // Determine whether the chart's internal time values are in ms or seconds
      let timeMultiplier = 1;
      try {
        const timeScale = (chartRef.current as any)?.timeScale?.();
        const vr = timeScale?.getVisibleRange?.();
        if (vr && typeof vr.from === 'number' && vr.from > 1e12) timeMultiplier = 1000;
      } catch (e) {
        // ignore
      }

      // Apply multiplier when setting markers so they align with chart's time units
      const markersToSet = markers.map(m => ({ ...m, time: typeof m.time === 'number' ? m.time * timeMultiplier : m.time }));
      (series as any).setMarkers(markersToSet);
    }

    // Compute overlay positions (DOM fallback) for ALL chart types
    // This works for Area, Candlestick, Bar, etc.
    try {
      const chart = chartRef.current;
      const ts = chart?.timeScale?.();
      
      // Ensure chart and series are fully initialized before computing overlays
      if (!chart || !ts || !series) {
        return;
      }
      
      // Skip if no trades to display
      if (rawTradePoints.length === 0) {
        setOverlayPoints([]);
        return;
      }
      
      // Determine time multiplier again (in case we skipped the setMarkers block)
      let timeMultiplier = 1;
      try {
        const vr = ts?.getVisibleRange?.();
        if (vr && typeof vr.from === 'number' && vr.from > 1e12) timeMultiplier = 1000;
      } catch (e) {
        // ignore
      }

      const getX = (t: number) => {
        if (!ts || typeof ts.timeToCoordinate !== 'function') return null;
        const coord = ts.timeToCoordinate((t * timeMultiplier) as any);
        // Return coordinate even if it's technically off-screen (we'll clamp in rendering)
        if (typeof coord === 'number' && !Number.isNaN(coord)) return coord;
        return null;
      };

      const getY = (price: number) => {
        try {
          const y = (series as any).priceToCoordinate?.(price);
          if (typeof y === 'number' && !Number.isNaN(y)) return y;
        } catch (e) {}
        return null;
      };

      // Get chart container width for clamping
      const chartWidth = chartContainerRef.current?.clientWidth ?? 800;

      const overlay: any[] = [];
      rawTradePoints.forEach(trade => {
        const vr = ts?.getVisibleRange?.();
        
        const x1 = getX(trade.time);
        const y1 = trade.price != null ? getY(trade.price) : null;
        let x2: number | null = null;
      
        
        if (trade.expiryTime && x1 !== null && vr) {
          x2 = getX(trade.expiryTime);
          
          // If x2 is null, compute it based on time duration and visible range
          if (x2 === null) {
            try {
              const chartWidth = chartContainerRef.current?.clientWidth ?? 800;
              const visibleFrom = (vr.from as any) > 1e12 ? (vr.from as any) / 1000 : (vr.from as any);
              const visibleTo = (vr.to as any) > 1e12 ? (vr.to as any) / 1000 : (vr.to as any);
              const visibleDuration = visibleTo - visibleFrom; // seconds
              const pixelsPerSecond = chartWidth / visibleDuration;
              const tradeDuration = trade.expiryTime - trade.time; // seconds
              const durationInPixels = tradeDuration * pixelsPerSecond;
              
              x2 = x1 + (durationInPixels * scaleFactor);
            } catch (e) {
            }
          }
        }
        
        if (x1 != null && y1 != null) {
          overlay.push({ id: trade.id, x1, y1, x2, price: trade.price, isWinning: trade.isWinning, direction: trade.direction });
        }
      });
      setOverlayPoints(overlay);
    } catch (e) {
      // Silently handle errors
    }

  }, [rawTradePoints, chartType, visibleRange]);

  return (
    <div className="h-full w-full relative">
      <div ref={chartContainerRef} className="h-full w-full" />
      {/* HTML overlay fallback for entry/expiry markers and duration lines */}
      <div className="absolute inset-0 pointer-events-none z-40">
        {overlayPoints.map(pt => {
          const x1 = Math.round(pt.x1);
          const y = Math.round(pt.y1);
          const x2 = pt.x2 != null ? Math.round(pt.x2) : null;
          const color = pt.isWinning === true ? '#26a69a' : pt.isWinning === false ? '#ef5350' : '#9ca3af';
          const left = x1;
          const right = x2;
          return (
            <div key={pt.id}>
              {/* entry marker - larger and more visible */}
              <div style={{ 
                position: 'absolute', 
                left: left - 8, 
                top: y - 8, 
                width: 16, 
                height: 16, 
                background: color, 
                borderRadius: '50%',
                border: '2px solid white',
                boxShadow: '0 0 4px rgba(0,0,0,0.5)',
                transform: 'translateZ(0)',
                transition: 'left 0.2s ease-out, top 0.2s ease-out'
              }} />
              {/* entry label */}
              <div style={{
                position: 'absolute',
                left: left - 20,
                top: y + 12,
                fontSize: 10,
                color: 'white',
                background: color,
                padding: '2px 4px',
                borderRadius: 2,
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                transition: 'left 0.2s ease-out, top 0.2s ease-out'
              }}>ENTRY</div>
              {/* expiry marker */}
              {right != null && (
                <>
                  <div style={{ 
                    position: 'absolute', 
                    left: right - 8, 
                    top: y - 8, 
                    width: 16, 
                    height: 16, 
                    background: '#ffffff', 
                    border: `3px solid ${color}`,
                    borderRadius: '50%',
                    boxShadow: '0 0 4px rgba(0,0,0,0.5)',
                    transform: 'translateZ(0)',
                    transition: 'left 0.2s ease-out, top 0.2s ease-out'
                  }} />
                  {/* expiry label */}
                  <div style={{
                    position: 'absolute',
                    left: right - 22,
                    top: y + 12,
                    fontSize: 10,
                    color: 'white',
                    background: color,
                    padding: '2px 4px',
                    borderRadius: 2,
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    transition: 'left 0.2s ease-out, top 0.2s ease-out'
                  }}>EXPIRY</div>
                </>
              )}
              {/* duration line connecting entry to expiry */}
              {right != null && (
                <div style={{ 
                  position: 'absolute', 
                  left: Math.min(left, right), 
                  top: y, 
                  height: 2, 
                  width: Math.max(2, Math.abs(right - left)), 
                  borderTop: `1px dashed ${color}`, 
                  opacity: 0.6,
                  transition: 'left 0.2s ease-out, width 0.2s ease-out, top 0.2s ease-out'
                }} />
              )}
            </div>
          );
        })}
      </div>
      {!isMarketOpen && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
            <Lock className="w-12 h-12 text-yellow-500" />
            <div className="mt-4 text-xl font-bold">Market Closed</div>
            <div className="text-sm text-gray-400">Trading for this asset is currently unavailable.</div>
        </div>
      )}
    </div>
  );
};
