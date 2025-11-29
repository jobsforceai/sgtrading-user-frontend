export type Trade = {
  _id: string;
  botId?: string;
  instrumentSymbol: string;
  symbol: string;
  direction: 'UP' | 'DOWN';
  stakeUsd: number;
  entryPrice: number;
  exitPrice?: number;
  createdAt: string;
  expiresAt: string;
  settledAt: string;
  closedAt: string;
  outcome: 'WIN' | 'LOSS' | 'DRAW';
  payoutAmount: number;
  isInsured: boolean;
  platformFee: number;
  mode: 'LIVE' | 'DEMO';
};
