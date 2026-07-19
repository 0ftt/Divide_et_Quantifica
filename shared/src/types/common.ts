export type UserRole = 'user' | 'admin';

export type TransactionType = 'recharge' | 'premium' | 'buy' | 'sell';

// Intervalli supportati dalla serie storica: devono restare allineati a
// TIMEFRAMES in server/src/services/yahoo.service.ts.
export type ChartTimeframe = '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '5y';
