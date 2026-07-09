export interface BalanceResponse {
  credit: number;
}

export interface RechargeResult {
  message: string;
  credit: number;
}

export interface PremiumResult {
  message: string;
  credit: number;
  isPremium: boolean;
}
