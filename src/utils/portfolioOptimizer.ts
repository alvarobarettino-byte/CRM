import type { Fund, FundData, PortfolioResult } from '../types/investment';

const RISK_FREE_RATE = 0.035; // 3.5% anual (tasa BCE aproximada)
const NUM_SIMULATIONS = 40000;
const MAX_FUNDS = 15;

// Fetch historical monthly prices from Yahoo Finance (via Vite proxy)
export async function fetchFundData(fund: Fund): Promise<FundData> {
  const url = `/yf/v8/finance/chart/${fund.ticker}?interval=1mo&range=1y&includePrePost=false`;

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const json = await response.json();
    const result = json?.chart?.result?.[0];

    if (!result) throw new Error('Sin datos de Yahoo Finance');

    const adjClose: number[] =
      result.indicators?.adjclose?.[0]?.adjclose ??
      result.indicators?.quote?.[0]?.close ??
      [];

    const validPrices = adjClose.filter((p: number | null) => p != null && isFinite(p));

    if (validPrices.length < 3) throw new Error('Datos insuficientes');

    const monthlyReturns = calculateMonthlyReturns(validPrices);
    const annualizedReturn = calculateAnnualizedReturn(monthlyReturns);
    const annualizedVolatility = calculateAnnualizedVolatility(monthlyReturns);
    const sharpeRatio =
      annualizedVolatility > 0
        ? (annualizedReturn - RISK_FREE_RATE) / annualizedVolatility
        : 0;

    return {
      fund,
      prices: validPrices,
      monthlyReturns,
      annualizedReturn,
      annualizedVolatility,
      sharpeRatio,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return {
      fund,
      prices: [],
      monthlyReturns: [],
      annualizedReturn: 0,
      annualizedVolatility: 0,
      sharpeRatio: 0,
      error: message,
    };
  }
}

function calculateMonthlyReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
  }
  return returns;
}

function calculateAnnualizedReturn(monthlyReturns: number[]): number {
  if (monthlyReturns.length === 0) return 0;
  const mean = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
  return mean * 12;
}

function calculateAnnualizedVolatility(monthlyReturns: number[]): number {
  if (monthlyReturns.length < 2) return 0;
  const mean = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
  const variance =
    monthlyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
    (monthlyReturns.length - 1);
  return Math.sqrt(variance) * Math.sqrt(12);
}

function buildCovarianceMatrix(fundDataList: FundData[]): number[][] {
  const n = fundDataList.length;
  const minLen = Math.min(...fundDataList.map((f) => f.monthlyReturns.length));
  const trimmed = fundDataList.map((f) =>
    f.monthlyReturns.slice(f.monthlyReturns.length - minLen)
  );

  const cov: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const meanI = trimmed[i].reduce((a, b) => a + b, 0) / minLen;
      const meanJ = trimmed[j].reduce((a, b) => a + b, 0) / minLen;

      let covIJ = 0;
      for (let k = 0; k < minLen; k++) {
        covIJ += (trimmed[i][k] - meanI) * (trimmed[j][k] - meanJ);
      }
      covIJ = (covIJ / (minLen - 1)) * 12; // Anualizar

      cov[i][j] = covIJ;
      cov[j][i] = covIJ;
    }
  }

  return cov;
}

function portfolioMetrics(
  weights: number[],
  returns: number[],
  cov: number[][]
): { portfolioReturn: number; volatility: number; sharpe: number } {
  const n = weights.length;
  const portfolioReturn = weights.reduce((sum, w, i) => sum + w * returns[i], 0);

  let variance = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      variance += weights[i] * weights[j] * cov[i][j];
    }
  }

  const volatility = Math.sqrt(Math.max(0, variance));
  const sharpe = volatility > 0 ? (portfolioReturn - RISK_FREE_RATE) / volatility : 0;

  return { portfolioReturn, volatility, sharpe };
}

// Genera pesos aleatorios usando distribución Dirichlet (suma = 1, todos >= 0)
function randomWeights(n: number): number[] {
  const raw = Array.from({ length: n }, () => -Math.log(Math.random() + 1e-10));
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((w) => w / sum);
}

export function optimizePortfolio(
  fundDataList: FundData[],
  totalInvestment: number
): PortfolioResult {
  const valid = fundDataList.filter((f) => !f.error && f.monthlyReturns.length >= 3);

  if (valid.length === 0) {
    throw new Error('No hay fondos con datos suficientes para optimizar');
  }

  const returns = valid.map((f) => f.annualizedReturn);
  const cov = buildCovarianceMatrix(valid);
  const n = valid.length;

  let bestSharpe = -Infinity;
  let bestWeights = new Array(n).fill(1 / n);

  for (let sim = 0; sim < NUM_SIMULATIONS; sim++) {
    const weights = randomWeights(n);
    const { sharpe } = portfolioMetrics(weights, returns, cov);
    if (sharpe > bestSharpe) {
      bestSharpe = sharpe;
      bestWeights = weights;
    }
  }

  // Aplicar restricción de máximo MAX_FUNDS fondos
  if (n > MAX_FUNDS) {
    const indexed = bestWeights.map((w, i) => ({ w, i }));
    indexed.sort((a, b) => b.w - a.w);

    const kept = new Set(indexed.slice(0, MAX_FUNDS).map((x) => x.i));
    bestWeights = bestWeights.map((w, i) => (kept.has(i) ? w : 0));

    const sum = bestWeights.reduce((a, b) => a + b, 0);
    bestWeights = bestWeights.map((w) => w / sum);
  }

  // Eliminar pesos insignificantes (< 1%)
  const threshold = 0.01;
  const significantWeights = bestWeights.map((w) => (w >= threshold ? w : 0));
  const totalWeight = significantWeights.reduce((a, b) => a + b, 0);
  const finalWeights = significantWeights.map((w) => w / totalWeight);

  const { portfolioReturn, volatility, sharpe } = portfolioMetrics(finalWeights, returns, cov);

  const allocations = valid
    .map((fd, i) => ({
      fund: fd.fund,
      weight: finalWeights[i],
      amount: finalWeights[i] * totalInvestment,
      annualizedReturn: fd.annualizedReturn,
      annualizedVolatility: fd.annualizedVolatility,
      sharpeRatio: fd.sharpeRatio,
    }))
    .filter((a) => a.weight > 0)
    .sort((a, b) => b.weight - a.weight);

  return {
    allocations,
    expectedReturn: portfolioReturn,
    volatility,
    sharpeRatio: sharpe,
    totalInvestment,
  };
}
