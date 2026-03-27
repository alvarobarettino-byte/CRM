export type FundCategory =
  | 'global-equity'
  | 'us-equity'
  | 'european-equity'
  | 'emerging-markets'
  | 'bonds'
  | 'commodities'
  | 'thematic';

export interface Fund {
  id: string;
  name: string;
  ticker: string;
  category: FundCategory;
  subcategory: string;
  currency: string;
  exchange: string;
  description: string;
  isin: string;
}

export interface FundData {
  fund: Fund;
  prices: number[];
  monthlyReturns: number[];
  annualizedReturn: number;
  annualizedVolatility: number;
  sharpeRatio: number;
  error?: string;
}

export interface PortfolioResult {
  allocations: AllocationItem[];
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  totalInvestment: number;
}

export interface AllocationItem {
  fund: Fund;
  weight: number;
  amount: number;
  annualizedReturn: number;
  annualizedVolatility: number;
  sharpeRatio: number;
}
