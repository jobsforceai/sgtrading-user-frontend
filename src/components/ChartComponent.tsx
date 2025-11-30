import React, { useEffect, useRef, useState, useMemo } from "react";
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
import { MarketTick } from "@/hooks/useSubscriptionMarketData";
import { Lock, ArrowUp, ArrowDown } from "lucide-react";

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
}

type TradePointer = {
  id: string;
  x: number | null;
  endX: number | null;
  y: number | null;
  direction?: string;
  color: string;
};

export const ChartComponent = ({
  data,
  liveTick,
  chartType,
  colors: { backgroundColor = "#000000", textColor = "#d1d5db" } = {},
  decimals = 2,
  openTradePoints,
  isMarketOpen = true,
}: ChartComponentProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ChartSeries | null>(null);
  const priceLineRef = useRef<IPriceLine | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const currentBarRef = useRef<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  } | null>(null);
  const tradePriceLines = useRef<Map<string, IPriceLine>>(new Map());

  const [tradePointers, setTradePointers] = useState<TradePointer[]>([]);
  const rawTradePointsRef = useRef<any[]>([]);
  console.log(`%c[ChartComponent Render] Chart Type: ${chartType}, Pointers in state: ${tradePointers.length}`, 'color: yellow');

  // Parse arbitrary time/expiry-like values into seconds (number)
  const parseToSeconds = (v: any): number | null => {
    if (v == null) return null;
    if (typeof v === "number" && Number.isFinite(v)) {
      return v > 1e12 ? Math.floor(v / 1000) : Math.floor(v);
    }
    if (typeof v === "object" && v !== null) {
      if (typeof (v as any).seconds === "number") return (v as any).seconds; // Firestore-like
      if (v instanceof Date) return Math.floor(v.getTime() / 1000);
      if (typeof (v as any).toDate === "function")
        return Math.floor((v as any).toDate().getTime() / 1000);
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
    console.warn(
      "ChartComponent: could not parse time from data item, it will be skipped",
      item
    );
    return null;
  };

  const rawTradePoints = useMemo(() => {
    const points = (openTradePoints || []).map((p: any) => {
      const tradeTime = parseToSeconds(p.time ?? p.openAt ?? p.createdAt) ?? 0;
      const expiryTime = parseToSeconds(p.expiresAt);
      const price = p.price ?? p.entryPrice ?? null;
      return {
        id: p._id ?? p.id,
        time: tradeTime,
        expiresAt: expiryTime,
        price,
        direction: p.direction,
        isWinning: p.isWinning,
      };
    });
    return points;
  }, [openTradePoints]);

  useEffect(() => {
    rawTradePointsRef.current = rawTradePoints;
  }, [rawTradePoints]);

  // recompute HTML pointer positions for trades
  const recomputeTradePointers = () => {
    const chart = chartRef.current;
    const series = seriesRef.current as
      | ISeriesApi<"Candlestick">
      | ISeriesApi<"Area">
      | ISeriesApi<"Bar">
      | null;

    if (!chart || !series) return;

    const timeScale = chart.timeScale();
    const points: TradePointer[] = [];

    for (const trade of rawTradePointsRef.current) {
      if (trade.price == null) continue;

      const x = timeScale.timeToCoordinate(trade.time as any);
      const y = (series as any).priceToCoordinate(trade.price);

      if (x == null || y == null) continue;

      let endX: number | null = null;
      if (trade.expiresAt != null) {
        endX = timeScale.timeToCoordinate(trade.expiresAt as any);
      }

      // If expiry is off-screen or not resolvable, extend to right edge of container
      if (endX == null && chartContainerRef.current) {
        endX = chartContainerRef.current.clientWidth - 2;
      }

      const isUp = trade.direction === "UP";
      const color = isUp ? "#22c55e" : "#ef4444";

      points.push({
        id: trade.id,
        x,
        endX,
        y,
        direction: trade.direction,
        color,
      });
    }

    console.log(`%c[recomputeTradePointers] Calculated ${points.length} pointers.`, 'color: cyan', points);
    setTradePointers(points);
  };

  // Initialize chart + series
  useEffect(() => {
    if (!chartContainerRef.current) return;
    console.log('%c[useEffect] Initializing chart...', 'color: green');

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
        attributionLogo: false,
      },
      localization: {
        timeFormatter: (timestamp: number) =>
          new Date(timestamp * 1000).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          }),
      },
      grid: {
        vertLines: { color: "#333333" },
        horzLines: { color: "#333333" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      rightPriceScale: { borderColor: "#444" },
      timeScale: {
        borderColor: "#444",
        timeVisible: true,
        secondsVisible: true,
        rightOffset: 100,
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
      case "Area":
        series = chart.addSeries(AreaSeries, {
          lineColor: "#2962FF",
          topColor: "rgba(41, 98, 255, 0.4)",
          bottomColor: "rgba(41, 98, 255, 0)",
          priceFormat,
        });
        break;
      default: {
        // Candlestick & Heikin Ashi
        const candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: "#26a69a",
          downColor: "#ef5350",
          borderUpColor: "#26a69a",
          borderDownColor: "#ef5350",
          wickUpColor: "#26a69a",
          wickDownColor: "#ef5350",
          priceFormat,
        });
        priceLineRef.current = candleSeries.createPriceLine({
          price: 0,
          color: "#3b82f6",
          lineWidth: 1,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
        });
        series = candleSeries;
        break;
      }
    }
    seriesRef.current = series;
    tradePriceLines.current.clear(); // Clear old price lines on chart change

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
      recomputeTradePointers();
    });
    resizeObserver.observe(chartContainerRef.current);

    const handleVisibleRangeChange = () => {
      recomputeTradePointers();
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
    chart.timeScale().subscribeVisibleTimeRangeChange(handleVisibleRangeChange);

    return () => {
      resizeObserver.disconnect();
      chart
        .timeScale()
        .unsubscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
      chart
        .timeScale()
        .unsubscribeVisibleTimeRangeChange(handleVisibleRangeChange);
      chart.remove();
      chartRef.current = null;
    };
  }, [backgroundColor, textColor, chartType, decimals]);

  // Set/Update historical data
  useEffect(() => {
    if (seriesRef.current) {
      let preparedData = data.map(ensureNumericTime).filter(Boolean) as any[];

      // Add robust validation based on chart type BEFORE setting data
      if (chartType === "Area") {
        preparedData = preparedData.filter(
          (item) => item && Number.isFinite((item as LineData).value)
        );
      } else {
        // Candlestick, Bar, Heikin Ashi
        preparedData = preparedData.filter(
          (item) =>
            item &&
            Number.isFinite((item as CandlestickData).open) &&
            Number.isFinite((item as CandlestickData).high) &&
            Number.isFinite((item as CandlestickData).low) &&
            Number.isFinite((item as CandlestickData).close)
        );
      }

      (seriesRef.current as ISeriesApi<"Area" | "Bar" | "Candlestick">).setData(
        preparedData as any
      );

      if (preparedData.length > 0) {
        lastTimeRef.current = preparedData[preparedData.length - 1]
          .time as number;
        chartRef.current?.timeScale().fitContent();
      } else {
        lastTimeRef.current = null;
      }

      // after data changes, recompute pointer coordinates
      recomputeTradePointers();
    }
  }, [data, chartType]);

  // Update for live ticks
  useEffect(() => {
    if (!seriesRef.current || !liveTick) return;

    const price = Number(liveTick.last);
    if (!Number.isFinite(price)) {
      console.warn(
        "ChartComponent: received a live tick with an invalid price, skipping update.",
        liveTick
      );
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
      const bucketTime =
        Math.floor(timestampInSeconds / candleInterval) * candleInterval;

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
        bar = {
          time: bucketTime,
          open: openPrice,
          high: price,
          low: price,
          close: price,
        };
      }

      currentBarRef.current = bar;
      if (Number.isFinite(bar.close)) {
        (seriesRef.current as ISeriesApi<"Bar" | "Candlestick">).update(
          bar as any
        );
        lastTimeRef.current = bucketTime;
      }
    }

    if (priceLineRef.current) {
      priceLineRef.current.applyOptions({ price });
    }

    // live price changed → recalc pointer y-coords
    recomputeTradePointers();
  }, [liveTick, chartType]);

  // Effect to manage and draw trade indicators (price lines only now)
  useEffect(() => {
    console.log(`%c[useEffect] Managing trade indicators for ${rawTradePoints.length} points.`, 'color: magenta');
    const series = seriesRef.current;
    if (!series) return;

    const currentTradeIds = new Set(rawTradePoints.map((p) => p.id));

    // If a new trade has appeared, scroll the chart to the end to make it visible
    const existingTradeIds = new Set(Array.from(tradePriceLines.current.keys()));
    const hasNewTrades = rawTradePoints.some((p) => !existingTradeIds.has(p.id));

    if (hasNewTrades) {
      chartRef.current?.timeScale().scrollToRealTime();
    }
    
    // Remove lines for trades that are no longer open
    tradePriceLines.current.forEach((line, id) => {
      if (!currentTradeIds.has(id)) {
        (series as any).removePriceLine(line);
        tradePriceLines.current.delete(id);
      }
    });

    // Create or update lines for current open trades
    rawTradePoints.forEach((trade) => {
      if (trade.price === null) return;
      let color = "#9ca3af"; // Neutral gray
      if (trade.isWinning === true) color = "#26a69a"; // Green
      else if (trade.isWinning === false) color = "#ef5350"; // Red

      const lineOptions = {
        price: trade.price,
        color,
        lineWidth: 2 as LineWidth,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: trade.direction,
      };

      const existingLine = tradePriceLines.current.get(trade.id);
      if (existingLine) {
        existingLine.applyOptions(lineOptions);
      } else {
        const newLine = (series as any).createPriceLine(lineOptions);
        tradePriceLines.current.set(trade.id, newLine);
      }
    });

    // The scroll action will trigger the 'visible range changed' event, which then calls recomputeTradePointers.
    // We can also call it directly as a fallback.
    recomputeTradePointers();
    
  }, [rawTradePoints, chartType]);

  return (
    <div className="h-full w-full relative">
      <div ref={chartContainerRef} className="h-full w-full" />

      {/* OlympTrade-style trade pointers as HTML overlay */}
      {tradePointers.map((p) => {
        if (p.x == null || p.y == null) return null; // Don't render if start point is off-screen
        const lineWidth = p.endX !== null && p.x !== null ? Math.max(0, p.endX - p.x) : 0;

                return (
                  <React.Fragment key={p.id}>
                    {/* Line connecting start to end */}
                    {lineWidth > 0 && (
                      <div
                        className="pointer-events-none absolute z-20"
                        style={{
                          left: p.x,
                          top: p.y,
                          width: lineWidth,
                          height: "2px",
                          backgroundColor: p.color,
                          opacity: 0.4,
                        }}
                      />
                    )}
        
                    {/* Start Point Marker */}
                    <div
                      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-20"
                      style={{ left: p.x, top: p.y }}
                    >
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.direction === "UP" ? (
                          <ArrowUp className="h-4 w-4 text-white" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-white" />
                        )}
                      </div>
                    </div>
        
                    {/* End Point Marker - only renders if it's on-screen */}
                    {p.endX !== null && (
                      <div
                        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-20"
                        style={{ left: p.endX, top: p.y }}
                      >
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
      {!isMarketOpen && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
          <Lock className="w-12 h-12 text-yellow-500" />
          <div className="mt-4 text-xl font-bold">Market Closed</div>
          <div className="text-sm text-gray-400">
            Trading for this asset is currently unavailable.
          </div>
        </div>
      )}
    </div>
  );
};
