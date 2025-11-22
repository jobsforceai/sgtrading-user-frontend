// Mapping from API symbol format to Backend Subscription format
// API: BTCUSDT, EURUSD=X, AAPL
// Backend: btcusdt, eur_usd, aapl

export const toBackendSymbol = (apiSymbol: string): string => {
  if (!apiSymbol) return '';
  
  const s = apiSymbol.toLowerCase();

  // Forex: EURUSD=X -> eur_usd
  if (s.includes('=x')) {
    const raw = s.replace('=x', ''); // eurusd
    // Insert underscore after 3rd char (standard forex pair length)
    if (raw.length === 6) {
      return `${raw.substring(0, 3)}_${raw.substring(3)}`;
    }
    return raw;
  }

  // Crypto: BTCUSDT -> btcusdt (already lowercased)
  // Stocks: AAPL -> aapl (already lowercased)
  
  return s;
};

export const toYahooFinanceSymbol = (symbol: string): string => {
  // Per documentation: "Use the internal backend symbol format for all interactions... including Fetching historical data."
  // So we simply return the backend symbol format here.
  return toBackendSymbol(symbol);
};
