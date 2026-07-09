export interface Holding {
  ticker: string;
  name: string;
  quantity: number;
  avgPrice: number;
  lastPrice: number;
  value: number;
}

export interface PortfolioResponse {
  credit: number;
  investedValue: number;
  holdings: Holding[];
}

export interface OrderRequest {
  ticker: string;
  quantity: number;
}

export interface OrderResult {
  message: string;
  cost?: number;
  proceeds?: number;
}
