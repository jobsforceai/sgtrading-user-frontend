// A simple mapping to convert symbols for different API endpoints.
const mapping: { [key: string]: string } = {
  btcusdt: 'BTC-USD',
  ethusdt: 'ETH-USD',
};

/**
 * Converts a symbol to the format expected by the historical data endpoint (Yahoo Finance).
 * @param symbol The input symbol (e.g., 'btcusdt').
 * @returns The converted symbol (e.g., 'BTC-USD').
 */
export const toYahooFinanceSymbol = (symbol: string): string => {
  return mapping[symbol.toLowerCase()] || symbol;
};
