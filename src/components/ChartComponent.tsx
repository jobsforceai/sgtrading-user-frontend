'use client';

import {
  ColorType,
  createChart,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  BarData,
  PriceLineOptions,
  LineStyle,
  AreaSeries,
  BarSeries,
  CandlestickSeries,
} from 'lightweight-charts';
import { useEffect, useRef } from 'react';
import { MarketTick } from '@/hooks/useMarketSocket';

type ChartSeries =
  | ISeriesApi<'Candlestick'>
  | ISeriesApi<'Area'>
  | ISeriesApi<'Bar'>;

interface ChartComponentProps {
  data: (CandlestickData | LineData | BarData)[];
  liveTick?: MarketTick;
  chartType: 'Candlestick' | 'Area' | 'Bar' | 'Heikin Ashi';
  colors?: {
    backgroundColor?: string;
    textColor?: string;
  };
}

export const ChartComponent = ({
  data,
  liveTick,
  chartType,
  colors: { backgroundColor = '#131722', textColor = '#d1d5db' } = {},
}: ChartComponentProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ChartSeries | null>(null);
  const priceLineRef = useRef<any>(null);

  // Initialize chart and series
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: 'rgba(70, 130, 180, 0.1)' },
        horzLines: { color: 'rgba(70, 130, 180, 0.1)' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });
    chartRef.current = chart;

    let series: ChartSeries;

    switch (chartType) {
      case 'Area': {
        series = chart.addSeries(AreaSeries, {
          lineColor: '#2962FF',
          topColor: 'rgba(41, 98, 255, 0.4)',
          bottomColor: 'rgba(41, 98, 255, 0)',
        }) as ISeriesApi<'Area'>;
        break;
      }
      case 'Bar': {
        series = chart.addSeries(BarSeries, {
          upColor: '#26a69a',
          downColor: '#ef5350',
        }) as ISeriesApi<'Bar'>;
        break;
      }
      default: {
        const candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderDownColor: '#ef5350',
          borderUpColor: '#26a69a',
          wickDownColor: '#ef5350',
          wickUpColor: '#26a69a',
        }) as ISeriesApi<'Candlestick'>;

        priceLineRef.current = candleSeries.createPriceLine({
          price: 0,
          color: '#4682B4',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
        });

        series = candleSeries;
        break;
      }
    }
    seriesRef.current = series;

    chart.timeScale().applyOptions({ timeVisible: true, secondsVisible: true });

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [backgroundColor, textColor, chartType]);

  // Set initial data
// Set initial data
useEffect(() => {
  if (!seriesRef.current || data.length === 0) return;

  type TimeLike = number | string | { day: string };

  const toNumberTime = (t: TimeLike): number => {
    if (typeof t === 'number') return t;
    if (typeof t === 'string') {
      const parsed = Number(t);
      return Number.isFinite(parsed) ? parsed : Date.parse(t) || 0;
    }
    return Date.parse(t.day);
  };

  function prepareData<T extends CandlestickData | LineData | BarData>(items: T[]): T[] {
    const map = new Map<number, T>();
    for (const item of items) {
      const key = toNumberTime(item.time as TimeLike);
      // keep the last item for a given timestamp to avoid duplicates
      map.set(key, item);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, v]) => v);
  }

  const prepared = prepareData(data);

  switch (chartType) {
    case 'Area': {
      const sanitizedArea = (prepared as any[]).map((it) => {
        // normalize time → seconds
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

        let value: any =
          (it as any).value != null
            ? (it as any).value
            : (it as any).close != null
            ? (it as any).close
            : (it as any).open != null
            ? (it as any).open
            : null;

        if (typeof value === 'string') value = Number(value);
        if (typeof value !== 'number' || !Number.isFinite(value)) return null;

        return { time, value } as LineData;
      }).filter(Boolean) as LineData[];

      (seriesRef.current as ISeriesApi<'Area'>).setData(sanitizedArea);
      break;
    }

    case 'Bar': {
      const sanitizedBar = (prepared as any[]).map((it) => {
        const open = typeof it.open === 'string' ? Number(it.open) : it.open;
        const high = typeof it.high === 'string' ? Number(it.high) : it.high;
        const low = typeof it.low === 'string' ? Number(it.low) : it.low;
        const close = typeof it.close === 'string' ? Number(it.close) : it.close;

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
          ![open, high, low, close].every(
            (n) => typeof n === 'number' && Number.isFinite(n)
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
      }).filter(Boolean) as BarData[];

      (seriesRef.current as ISeriesApi<'Bar'>).setData(sanitizedBar);
      break;
    }

    case 'Candlestick':
    case 'Heikin Ashi':
    default: {
      const sanitized = (prepared as any[]).map((it) => {
        const open = typeof it.open === 'string' ? Number(it.open) : it.open;
        const high = typeof it.high === 'string' ? Number(it.high) : it.high;
        const low = typeof it.low === 'string' ? Number(it.low) : it.low;
        const close = typeof it.close === 'string' ? Number(it.close) : it.close;

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
          ![open, high, low, close].every(
            (n) => typeof n === 'number' && Number.isFinite(n)
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
        } as CandlestickData;
      }).filter(Boolean) as CandlestickData[];

      (seriesRef.current as ISeriesApi<'Candlestick'>).setData(sanitized);
      break;
    }
  }

  chartRef.current?.timeScale().fitContent();
}, [data, chartType]);


  // Update with live tick
  useEffect(() => {
    if (!seriesRef.current || !liveTick) return;

    const time = Math.floor(liveTick.ts / 1000) as any; // casting to any to satisfy Time type

    if (chartType === 'Area') {
      (seriesRef.current as ISeriesApi<'Area'>).update({
        time,
        value: liveTick.last,
      });
    } else if (chartType === 'Bar') {
      (seriesRef.current as ISeriesApi<'Bar'>).update({
        time,
        open: liveTick.last,
        high: liveTick.last,
        low: liveTick.last,
        close: liveTick.last,
      });
    } else {
      (seriesRef.current as ISeriesApi<'Candlestick'>).update({
        time,
        open: liveTick.last,
        high: liveTick.last,
        low: liveTick.last,
        close: liveTick.last,
      });

      if (priceLineRef.current) {
        priceLineRef.current.applyOptions({ price: liveTick.last });
      }
    }

    chartRef.current?.timeScale().scrollToRealTime();
  }, [liveTick, chartType]);

  return <div ref={chartContainerRef} className="h-full w-full" />;
};
