import { useState, useCallback } from 'react';
import {
  TrendingUp,
  Search,
  CheckSquare,
  Square,
  BarChart2,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { REVOLUT_FUNDS, CATEGORY_LABELS, CATEGORY_COLORS } from '../data/revolutFunds';
import { fetchFundData, optimizePortfolio } from '../utils/portfolioOptimizer';
import type { FundCategory, FundData, PortfolioResult } from '../types/investment';

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as FundCategory[];

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtPct(n: number) {
  return `${(n * 100).toFixed(2)}%`;
}

function fmtEur(n: number) {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

function MetricCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-1">
      <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</span>
      <span className={`text-2xl font-bold ${color ?? 'text-slate-800'}`}>{value}</span>
      {sub && <span className="text-xs text-slate-400">{sub}</span>}
    </div>
  );
}

function AllocationBar({ weight, color }: { weight: number; color: string }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-2.5">
      <div
        className="h-2.5 rounded-full transition-all duration-500"
        style={{ width: `${weight * 100}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function InvestmentCalculator() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FundCategory | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [investment, setInvestment] = useState(20000);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<PortfolioResult | null>(null);
  const [fundDataList, setFundDataList] = useState<FundData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [showFundDetail, setShowFundDetail] = useState<string | null>(null);

  const filteredFunds = REVOLUT_FUNDS.filter((f) => {
    if (selectedCategory !== 'all' && f.category !== selectedCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return f.name.toLowerCase().includes(q) || f.ticker.toLowerCase().includes(q) || f.subcategory.toLowerCase().includes(q);
    }
    return true;
  });

  const toggleFund = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(filteredFunds.map((f) => f.id)));
  const clearAll = () => setSelectedIds(new Set());

  const handleOptimize = useCallback(async () => {
    const selected = REVOLUT_FUNDS.filter((f) => selectedIds.has(f.id));
    if (selected.length < 2) {
      alert('Selecciona al menos 2 fondos para optimizar la cartera.');
      return;
    }

    setLoading(true);
    setResult(null);
    setErrors([]);
    setProgress(`Descargando datos históricos (0/${selected.length})...`);

    const fetchedData: FundData[] = [];
    const fetchErrors: string[] = [];

    for (let i = 0; i < selected.length; i++) {
      setProgress(`Descargando ${selected[i].ticker} (${i + 1}/${selected.length})...`);
      const data = await fetchFundData(selected[i]);
      fetchedData.push(data);
      if (data.error) {
        fetchErrors.push(`${selected[i].ticker}: ${data.error}`);
      }
    }

    setFundDataList(fetchedData);

    const validCount = fetchedData.filter((d) => !d.error).length;
    if (validCount < 2) {
      setErrors([...fetchErrors, 'No hay suficientes fondos con datos para optimizar.']);
      setLoading(false);
      setProgress('');
      return;
    }

    setProgress(`Optimizando ratio Sharpe con ${validCount} fondos (40,000 simulaciones)...`);
    // pequeña pausa para que el progreso se muestre
    await new Promise((r) => setTimeout(r, 50));

    try {
      const optimized = optimizePortfolio(fetchedData, investment);
      setResult(optimized);
      setErrors(fetchErrors);
    } catch (err) {
      setErrors([...(err instanceof Error ? [err.message] : ['Error desconocido']), ...fetchErrors]);
    }

    setLoading(false);
    setProgress('');
  }, [selectedIds, investment]);

  const sharpeColor =
    result === null
      ? 'text-slate-800'
      : result.sharpeRatio >= 1
      ? 'text-emerald-600'
      : result.sharpeRatio >= 0.5
      ? 'text-amber-600'
      : 'text-red-600';

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Calculadora de Inversión Revolut</h1>
          <p className="text-sm text-slate-500">
            Optimización de cartera por ratio Sharpe · Fondos UCITS disponibles en Revolut
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT: Fund selector ── */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Investment amount */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Importe de inversión (€)
            </label>
            <input
              type="number"
              min={1000}
              step={1000}
              value={investment}
              onChange={(e) => setInvestment(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <p className="text-xs text-slate-400 mt-1">
              Tasa libre de riesgo: 3.5% (referencia BCE)
            </p>
          </div>

          {/* Category filter + search */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar fondos..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  style={
                    selectedCategory === cat
                      ? { backgroundColor: CATEGORY_COLORS[cat] }
                      : undefined
                  }
                >
                  {CATEGORY_LABELS[cat].split(' ').slice(-1)[0]}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">
                {selectedIds.size} seleccionados · max 15 para optimizar
              </span>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-xs text-violet-600 hover:underline">
                  Todos
                </button>
                <button onClick={clearAll} className="text-xs text-slate-400 hover:underline">
                  Limpiar
                </button>
              </div>
            </div>
          </div>

          {/* Fund list */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex-1">
            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
              {filteredFunds.map((fund) => {
                const selected = selectedIds.has(fund.id);
                const color = CATEGORY_COLORS[fund.category];
                const expanded = showFundDetail === fund.id;
                return (
                  <div key={fund.id} className={`transition-colors ${selected ? 'bg-violet-50' : 'hover:bg-slate-50'}`}>
                    <button
                      className="w-full text-left px-4 py-3 flex items-start gap-3"
                      onClick={() => toggleFund(fund.id)}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {selected ? (
                          <CheckSquare className="w-4 h-4 text-violet-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-500 font-mono">
                            {fund.ticker}
                          </span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium"
                            style={{ backgroundColor: color }}
                          >
                            {fund.subcategory}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-800 leading-snug mt-0.5 truncate">
                          {fund.name}
                        </p>
                      </div>
                      <button
                        className="flex-shrink-0 text-slate-400 hover:text-slate-600 mt-0.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowFundDetail(expanded ? null : fund.id);
                        }}
                      >
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </button>
                    {expanded && (
                      <div className="px-4 pb-3 pl-11 text-xs text-slate-500 space-y-1">
                        <p>{fund.description}</p>
                        <p className="font-mono text-slate-400">ISIN: {fund.isin} · {fund.exchange}</p>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredFunds.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">
                  No se encontraron fondos
                </p>
              )}
            </div>
          </div>

          {/* Optimize button */}
          <button
            onClick={handleOptimize}
            disabled={loading || selectedIds.size < 2}
            className="w-full py-3 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Optimizando...
              </>
            ) : (
              <>
                <BarChart2 className="w-4 h-4" />
                Optimizar cartera
              </>
            )}
          </button>
        </div>

        {/* ── RIGHT: Results ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Progress */}
          {loading && progress && (
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-violet-600 animate-spin flex-shrink-0" />
              <p className="text-sm text-violet-700 font-medium">{progress}</p>
            </div>
          )}

          {/* Errors / warnings */}
          {errors.length > 0 && !loading && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700">
                  Avisos ({errors.length})
                </span>
              </div>
              <ul className="list-disc pl-5 space-y-1">
                {errors.map((e, i) => (
                  <li key={i} className="text-xs text-amber-700">
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Empty state */}
          {!loading && !result && (
            <div className="flex-1 bg-white rounded-xl border border-slate-200 border-dashed flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-600">Selecciona fondos y optimiza</p>
                <p className="text-sm text-slate-400 mt-1 max-w-xs">
                  Selecciona al menos 2 fondos del listado y pulsa "Optimizar cartera" para
                  calcular la asignación óptima por ratio Sharpe.
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 max-w-sm">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500">
                    El optimizador descarga retornos históricos del último año desde Yahoo Finance y
                    ejecuta 40,000 simulaciones Monte Carlo para maximizar el ratio Sharpe de tu cartera.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <>
              {/* Portfolio metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard
                  label="Ratio Sharpe"
                  value={fmt(result.sharpeRatio)}
                  sub="Objetivo: > 1.0"
                  color={sharpeColor}
                />
                <MetricCard
                  label="Retorno esperado"
                  value={fmtPct(result.expectedReturn)}
                  sub="Anualizado (12m)"
                  color={result.expectedReturn >= 0 ? 'text-emerald-600' : 'text-red-600'}
                />
                <MetricCard
                  label="Volatilidad"
                  value={fmtPct(result.volatility)}
                  sub="Desviación anualizada"
                />
                <MetricCard
                  label="Fondos en cartera"
                  value={String(result.allocations.length)}
                  sub={`de ${selectedIds.size} seleccionados`}
                />
              </div>

              {/* Visual allocation */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-violet-600" />
                  Distribución óptima · {fmtEur(result.totalInvestment)}
                </h2>

                <div className="space-y-3">
                  {result.allocations.map((item) => {
                    const color = CATEGORY_COLORS[item.fund.category];
                    return (
                      <div key={item.fund.id} className="flex items-center gap-3">
                        <div className="w-28 flex-shrink-0">
                          <span className="text-xs font-bold text-slate-500 font-mono">
                            {item.fund.ticker}
                          </span>
                        </div>
                        <div className="flex-1">
                          <AllocationBar weight={item.weight} color={color} />
                        </div>
                        <div className="w-12 text-right">
                          <span className="text-sm font-semibold text-slate-700">
                            {fmtPct(item.weight)}
                          </span>
                        </div>
                        <div className="w-20 text-right">
                          <span className="text-sm font-bold text-violet-700">
                            {fmtEur(item.amount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Fondo
                      </th>
                      <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Peso
                      </th>
                      <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Importe
                      </th>
                      <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Retorno
                      </th>
                      <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Volatilidad
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Sharpe
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.allocations.map((item) => {
                      const color = CATEGORY_COLORS[item.fund.category];
                      return (
                        <tr key={item.fund.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: color }}
                              />
                              <div>
                                <span className="font-mono font-bold text-slate-600 text-xs">
                                  {item.fund.ticker}
                                </span>
                                <p className="text-slate-700 text-xs leading-snug max-w-[220px] truncate">
                                  {item.fund.name}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-slate-700">
                            {fmtPct(item.weight)}
                          </td>
                          <td className="px-3 py-3 text-right font-bold text-violet-700">
                            {fmtEur(item.amount)}
                          </td>
                          <td
                            className={`px-3 py-3 text-right font-medium ${
                              item.annualizedReturn >= 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}
                          >
                            {fmtPct(item.annualizedReturn)}
                          </td>
                          <td className="px-3 py-3 text-right text-slate-600">
                            {fmtPct(item.annualizedVolatility)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`font-bold ${
                                item.sharpeRatio >= 1
                                  ? 'text-emerald-600'
                                  : item.sharpeRatio >= 0.5
                                  ? 'text-amber-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {fmt(item.sharpeRatio)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Strategy summary */}
              <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-5">
                <h3 className="font-semibold text-violet-800 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Estrategia de inversión · {fmtEur(result.totalInvestment)}
                </h3>
                <div className="space-y-2">
                  {result.allocations.map((item) => (
                    <div
                      key={item.fund.id}
                      className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded text-white"
                          style={{ backgroundColor: CATEGORY_COLORS[item.fund.category] }}
                        >
                          {fmtPct(item.weight)}
                        </span>
                        <span className="text-sm font-medium text-slate-700">{item.fund.name}</span>
                      </div>
                      <span className="text-sm font-bold text-violet-800">{fmtEur(item.amount)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-violet-200 flex items-start gap-2">
                  <Info className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-violet-700">
                    Cartera optimizada con {result.allocations.length} fondos · Sharpe esperado:{' '}
                    <strong>{fmt(result.sharpeRatio)}</strong> · Retorno anual estimado:{' '}
                    <strong>{fmtPct(result.expectedReturn)}</strong> · Volatilidad:{' '}
                    <strong>{fmtPct(result.volatility)}</strong>. Basado en datos históricos del
                    último año. Rentabilidades pasadas no garantizan resultados futuros.
                  </p>
                </div>
              </div>

              {/* Fund data status */}
              {fundDataList.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Estado de datos descargados
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {fundDataList.map((fd) => (
                      <div
                        key={fd.fund.id}
                        className={`flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5 ${
                          fd.error
                            ? 'bg-red-50 text-red-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            fd.error ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                        />
                        <span className="font-mono font-bold">{fd.fund.ticker}</span>
                        {!fd.error && (
                          <span className="text-slate-500">
                            {fd.monthlyReturns.length}m · {fmtPct(fd.annualizedReturn)}
                          </span>
                        )}
                        {fd.error && <span className="truncate">{fd.error}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
