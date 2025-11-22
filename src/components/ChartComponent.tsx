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
  SeriesMarker,
  TickMarkType,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
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
  openTrades?: any[];
}

export const ChartComponent = ({
  data,
  liveTick,
  chartType,
  colors: { backgroundColor = "#000000", textColor = "#d1d5db" } = {},
  decimals = 2,
  openTrades = [],
}: ChartComponentProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ChartSeries | null>(null);
  const priceLineRef = useRef<IPriceLine | null>(null);
  const currentBarRef = useRef<{ time: number; open: number; high: number; low: number; close: number } | null>(null);
  
  // Map to track active trade price lines by Trade ID
  const activeTradeLinesRef = useRef<Map<string, IPriceLine>>(new Map());

  // Initialize chart + series
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
        attributionLogo: false, // Disable TradingView logo
      },
      localization: {
        timeFormatter: (timestamp: number) => {
          return new Date(timestamp * 1000).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          });
        },
      },
      grid: {
        vertLines: { color: "#333333", style: LineStyle.Dashed },
        horzLines: { color: "#333333", style: LineStyle.Dashed },
      },
      crosshair: { mode: CrosshairMode.Normal },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      rightPriceScale: {
        borderColor: "#444",
        scaleMargins: {
          top: 0.1, // like your SVG padding
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: "#444",
        timeVisible: true,
        secondsVisible: true,
        barSpacing: 10, // slightly wider
        tickMarkFormatter: (time: number, tickMarkType: TickMarkType, locale: string) => {
          const date = new Date(time * 1000);
          const options: Intl.DateTimeFormatOptions = { timeZone: "Asia/Kolkata" };
          
          switch (tickMarkType) {
            case TickMarkType.Year:
              return date.toLocaleDateString("en-IN", { ...options, year: "numeric" });
            case TickMarkType.Month:
              return date.toLocaleDateString("en-IN", { ...options, month: "short" });
            case TickMarkType.DayOfMonth:
              return date.toLocaleDateString("en-IN", { ...options, day: "numeric", month: "short" });
            case TickMarkType.Time:
              return date.toLocaleTimeString("en-IN", { ...options, hour: "2-digit", minute: "2-digit", hour12: false });
            case TickMarkType.TimeWithSeconds:
              return date.toLocaleTimeString("en-IN", { ...options, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
            default:
               return date.toLocaleTimeString("en-IN", { ...options, hour: "2-digit", minute: "2-digit", hour12: false });
          }
        },
      },
    });

    chartRef.current = chart;

    const priceFormat = {
      type: "price" as const,
      precision: decimals,
      minMove: 1 / Math.pow(10, decimals),
    };

    let series: ChartSeries;

    switch (chartType) {
      case "Area": {
        series = chart.addSeries(AreaSeries, {
          lineColor: "#2962FF",
          topColor: "rgba(41, 98, 255, 0.4)",
          bottomColor: "rgba(41, 98, 255, 0)",
          priceFormat,
        }) as ISeriesApi<"Area">;
        break;
      }

      case "Bar": {
        series = chart.addSeries(BarSeries, {
          upColor: "#26a69a",
          downColor: "#ef5350",
          thinBars: false,
          priceFormat,
        }) as ISeriesApi<"Bar">;
        break;
      }

      case "Heikin Ashi":
      case "Candlestick":
      default: {
        // Japanese candlestick style
        const candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: "#26a69a",
          downColor: "#ef5350",
          borderUpColor: "#26a69a",
          borderDownColor: "#ef5350",
          wickUpColor: "#26a69a",
          wickDownColor: "#ef5350",
          borderVisible: true,
          wickVisible: true,
          priceFormat,
        }) as ISeriesApi<"Candlestick">;

        priceLineRef.current = candleSeries.createPriceLine({
          price: 0,
          color: "#3b82f6", // like your SVG current price line
          lineWidth: 1,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
        });

        series = candleSeries;
        break;
      }
    }

    seriesRef.current = series;

    // ResizeObserver to handle container resizing (e.g. sidebar toggle)
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !entries[0].target) return;
      const newRect = entries[0].contentRect;
      chart.applyOptions({
        width: newRect.width,
        height: newRect.height,
      });
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      priceLineRef.current = null;
    };
  }, [backgroundColor, textColor, chartType, decimals]);

  // Reset current bar when data changes
  useEffect(() => {
    currentBarRef.current = null;
  }, [data, chartType]);

  // Set initial data
  useEffect(() => {
    if (!seriesRef.current || data.length === 0) return;
    
    // ... (rest of data preparation logic is same, just need to ensure it's not lost)
    type TimeLike = number | string | { day: string };

    const toNumberTime = (t: TimeLike): number => {
      if (typeof t === "number") return t;
      if (typeof t === "string") {
        const parsed = Number(t);
        return Number.isFinite(parsed) ? parsed : Date.parse(t) || 0;
      }
      return Date.parse(t.day);
    };

    function prepareData<T extends CandlestickData | LineData | BarData>(
      items: T[]
    ): T[] {
      const map = new Map<number, T>();
      for (const item of items) {
        const key = toNumberTime(item.time as TimeLike);
        map.set(key, item);
      }
      return Array.from(map.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([, v]) => v);
    }

    const prepared = prepareData(data);
    // ... (switch case for data setting same as before)
    switch (chartType) {
      case "Area": {
        const sanitizedArea = (prepared as any[])
          .map((it) => {
            let time: any = it.time;
            if (typeof time === "string") {
              const parsed = Number(time);
              time = Number.isFinite(parsed)
                ? parsed
                : Math.floor(Date.parse(time) / 1000);
            } else if (typeof time === "number") {
              time = time > 1e12 ? Math.floor(time / 1000) : Math.floor(time);
            } else if (
              typeof time === "object" &&
              time !== null &&
              (time as any).day
            ) {
              const day = (time as any).day;
              const parsed = Number(day);
              time = Number.isFinite(parsed)
                ? parsed
                : Math.floor(Date.parse(day) / 1000);
            }

            let value: any =
              (it as any).value != null
                ? (it as any).value
                : (it as any).close != null
                ? (it as any).close
                : (it as any).open != null
                ? (it as any).open
                : null;

            if (typeof value === "string") value = Number(value);
            if (typeof value !== "number" || !Number.isFinite(value))
              return null;

            return { time, value } as LineData;
          })
          .filter(Boolean) as LineData[];

        (seriesRef.current as ISeriesApi<"Area">).setData(sanitizedArea);
        break;
      }

      case "Bar": {
        const sanitizedBar = (prepared as any[])
          .map((it) => {
            const open =
              typeof it.open === "string" ? Number(it.open) : it.open;
            const high =
              typeof it.high === "string" ? Number(it.high) : it.high;
            const low = typeof it.low === "string" ? Number(it.low) : it.low;
            const close =
              typeof it.close === "string" ? Number(it.close) : it.close;

            let time: any = it.time;
            if (typeof time === "string") {
              const parsed = Number(time);
              time = Number.isFinite(parsed)
                ? parsed
                : Math.floor(Date.parse(time) / 1000);
            } else if (typeof time === "number") {
              time = time > 1e12 ? Math.floor(time / 1000) : Math.floor(time);
            } else if (
              typeof time === "object" &&
              time !== null &&
              (time as any).day
            ) {
              const day = (time as any).day;
              const parsed = Number(day);
              time = Number.isFinite(parsed)
                ? parsed
                : Math.floor(Date.parse(day) / 1000);
            }

            if (
              ![open, high, low, close].every(
                (n) => typeof n === "number" && Number.isFinite(n)
              )
            ) {
              return null;
            }

            return {
              time,
              open,
              high,
              low,
              close,
            } as BarData;
          })
          .filter(Boolean) as BarData[];

        (seriesRef.current as ISeriesApi<"Bar">).setData(sanitizedBar);
        break;
      }

    case 'Candlestick':
    case 'Heikin Ashi':
    default: {
      const sanitized = (prepared as any[]).map((it) => {
        // original OHLC
        const o0 = typeof it.open === 'string' ? Number(it.open) : it.open;
        const h0 = typeof it.high === 'string' ? Number(it.high) : it.high;
        const l0 = typeof it.low === 'string' ? Number(it.low) : it.low;
        const c0 = typeof it.close === 'string' ? Number(it.close) : it.close;

        let time: any = it.time;
        if (typeof time === 'string') {
          const parsed = Number(time);
          time = Number.isFinite(parsed)
            ? parsed
            : Math.floor(Date.parse(time) / 1000);
        } else if (typeof time === 'number') {
          time = time > 1e12 ? Math.floor(time / 1000) : Math.floor(time);
        } else if (typeof time === 'object' && time !== null && (time as any).day) {
          const day = (time as any).day;
          const parsed = Number(day);
          time = Number.isFinite(parsed)
            ? parsed
            : Math.floor(Date.parse(day) / 1000);
        }

        if (
          o0 == null ||
          h0 == null ||
          l0 == null ||
          c0 == null ||
          ![o0, h0, l0, c0].every(
            (n) => typeof n === 'number' && Number.isFinite(n)
          )
        ) {
          return null;
        }

        // copy so we can tweak
        let open = o0;
        let high = h0;
        let low = l0;
        let close = c0;

        // direction: up (green) or down (red)
        const isBull = close >= open;

        // base size for tiny padding (relative to price)
        const base = Math.abs(close || open || 1);
        const minBody = base * 0.001;  // body thickness
        const minWick = base * 0.002;  // total wick height

        // --- ensure body has some height but keep direction ---
        const bodyDiff = Math.abs(close - open);
        if (bodyDiff < minBody) {
          if (isBull) {
            // bullish: close above open
            open = close - minBody;
          } else {
            // bearish: open above close
            close = open - minBody;
          }
        }

        // --- ensure wick has some height around body ---
        let top = Math.max(open, close);
        let bottom = Math.min(open, close);

        if (high < top) high = top;
        if (low > bottom) low = bottom;

        const wickDiff = high - low;
        if (wickDiff < minWick) {
          const extra = (minWick - wickDiff) / 2;
          high = top + extra;
          low = bottom - extra;
        }

        return {
          time,
          open,
          high,
          low,
          close,
        } as CandlestickData;
      }).filter(Boolean) as CandlestickData[];

      (seriesRef.current as ISeriesApi<'Candlestick'>).setData(sanitized);
      break;
    }

    }

    chartRef.current?.timeScale().fitContent();
  }, [data, chartType]);

  // Live tick update with 5-second aggregation
  useEffect(() => {
    if (!seriesRef.current || !liveTick) return;

    // normalize timestamp (to seconds)
    const timestamp = Math.floor(
      (typeof liveTick.ts === "number" ? liveTick.ts : Number(liveTick.ts)) / 1000
    );
    const bucketTime = Math.floor(timestamp / 5) * 5; // 5-second intervals

    // coerce last price to a finite number
    const rawPrice: any = (liveTick as any).last;
    const price =
      typeof rawPrice === "number"
        ? rawPrice
        : typeof rawPrice === "string" && rawPrice.trim() !== ""
        ? Number(rawPrice)
        : NaN;

    if (!Number.isFinite(price)) {
      // invalid price — skip updating chart to avoid library assertions
      return;
    }

    // helper to normalize any time-like value into a numeric seconds timestamp
    const normalizeTimeToSeconds = (t: any): number => {
      if (typeof t === "number") {
        return t > 1e12 ? Math.floor(t / 1000) : Math.floor(t);
      }
      if (typeof t === "string") {
        const parsed = Number(t);
        if (Number.isFinite(parsed)) return parsed;
        const ms = Date.parse(t);
        if (!Number.isNaN(ms)) return Math.floor(ms / 1000);
        // fallback to bucketTime
        return bucketTime;
      }
      if (t && typeof t === "object" && (t as any).day) {
        const day = (t as any).day;
        const ms = Date.parse(day);
        if (!Number.isNaN(ms)) return Math.floor(ms / 1000);
        return bucketTime;
      }
      return bucketTime;
    };

    if (chartType === "Area") {
      (seriesRef.current as ISeriesApi<"Area">).update({
        time: bucketTime as any,
        value: price,
      });
    } else {
      // Bar or Candlestick/Heikin Ashi
      let bar = currentBarRef.current;

      if (bar && bar.time === bucketTime) {
        // Update existing bar
        bar.high = Math.max(bar.high, price);
        bar.low = Math.min(bar.low, price);
        bar.close = price;
        // Open remains the same
      } else {
        // New bar
        // Use previous bar's close as new open if available, else current price
        const openPrice = bar ? bar.close : price;
        bar = {
          time: bucketTime,
          open: openPrice,
          high: price,
          low: price,
          close: price,
        };
      }

      currentBarRef.current = bar;

      // normalize time before updating the series to avoid passing objects
      const updateBar = {
        ...bar,
        time: normalizeTimeToSeconds(bar.time),
      };

        if (chartType === "Bar") {
        (seriesRef.current as ISeriesApi<"Bar">).update(updateBar as BarData);
      } else {
        // ensure time is a primitive number and protect against library errors
        const candlestickUpdate = {
          ...updateBar,
          time: Number(normalizeTimeToSeconds(updateBar.time)),
        } as CandlestickData;

        try {
          (seriesRef.current as ISeriesApi<"Candlestick">).update(
            candlestickUpdate
          );
        } catch (err) {
          // skip invalid updates (e.g. "Cannot update oldest data") to avoid runtime errors
          // eslint-disable-next-line no-console
          console.warn("Chart update skipped:", err);
        }

        if (priceLineRef.current) {
          priceLineRef.current.applyOptions({ price });
        }
      }
    }

    chartRef.current?.timeScale().scrollToRealTime();
  }, [liveTick, chartType]);

  // Manage Open Trades Visualization
  useEffect(() => {
    if (!seriesRef.current) return;

    const currentIds = new Set(openTrades.map((t) => t._id));
    const activeMap = activeTradeLinesRef.current;

    // 1. Remove lines for closed trades
    activeMap.forEach((line, id) => {
      if (!currentIds.has(id)) {
        seriesRef.current?.removePriceLine(line);
        activeMap.delete(id);
      }
    });

    // 2. Add lines for new trades
    openTrades.forEach((trade) => {
      if (!activeMap.has(trade._id)) {
        const isUp = trade.direction === "UP";
        const color = isUp ? "#22c55e" : "#ef4444"; // green-500 : red-500
        
        const line = seriesRef.current?.createPriceLine({
          price: trade.entryPrice,
          color,
          lineWidth: 2,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `${trade.direction} $${trade.stakeUsd}`,
        });

        if (line) {
          activeMap.set(trade._id, line);
        }
      }
    });

    // 3. Set Markers (Arrows)
    const markers: any[] = openTrades.map((t) => {
      const ts = Math.floor(Date.parse(t.openAt || t.createdAt) / 1000);
      // Match chart aggregation (5s buckets) to ensure marker sits on a bar
      // Note: If historical data uses different resolution (e.g. 1s or 60s), this might need adjustment.
      // Assuming dynamic chart mainly runs on 5s live updates or 1s history.
      // If history is 1s, then just ts is fine. Let's try precise ts first, if it fails to show, we bucket.
      // Since I'm using `bucketTime` in live update, let's stick to that for consistency with live bars.
      const bucketTime = Math.floor(ts / 5) * 5; 
      
      const isUp = t.direction === 'UP';
      
      return {
        time: bucketTime,
        position: isUp ? 'belowBar' : 'aboveBar',
        color: isUp ? '#22c55e' : '#ef4444',
        shape: isUp ? 'arrowUp' : 'arrowDown',
        text: `${t.direction}`,
      };
    }).sort((a, b) => (a.time as number) - (b.time as number)); // Markers must be sorted by time

    // Some series types in the union may not have `setMarkers` in the TS types,
    // so guard at runtime and cast to `any` when calling to satisfy the compiler.
    if (seriesRef.current && typeof (seriesRef.current as any).setMarkers === "function") {
      (seriesRef.current as any).setMarkers(markers);
    }

  }, [openTrades, chartType]); // Re-run if trades change or chart type (series) changes

  return <div ref={chartContainerRef} className="h-full w-full" />;
};
