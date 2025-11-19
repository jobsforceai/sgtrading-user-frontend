import { CandlestickData } from 'lightweight-charts';

export const convertToHeikinAshi = (data: CandlestickData[]): CandlestickData[] => {
  if (!data || data.length === 0) {
    return [];
  }

  // Filter out invalid data points (e.g. zero or negative prices)
  // We cast to 'any' to safely check properties even if type definition implies they exist
  const cleanData = data.filter((d: any) => 
    d.open > 0 && d.high > 0 && d.low > 0 && d.close > 0
  );

  const heikinAshiData: CandlestickData[] = [];

  for (let i = 0; i < cleanData.length; i++) {
    const current = cleanData[i];
    const previous = i > 0 ? heikinAshiData[i - 1] : null;

    const haClose = (current.open + current.high + current.low + current.close) / 4;

    const haOpen = previous
      ? (previous.open + previous.close) / 2
      : (current.open + current.close) / 2;

    const haHigh = Math.max(current.high, haOpen, haClose);
    const haLow = Math.min(current.low, haOpen, haClose);

    heikinAshiData.push({
      time: current.time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
    });
  }

  return heikinAshiData;
};