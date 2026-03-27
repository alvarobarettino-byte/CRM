import { TrendingUp, Target, CheckCircle, Clock, BarChart3, ArrowUpRight } from 'lucide-react';
import type { Deal } from '../types';
import { STAGES } from '../data/stages';

interface DashboardProps {
  deals: Deal[];
}

export function Dashboard({ deals }: DashboardProps) {
  const totalDeals = deals.length;
  const activeDeals = deals.filter(d => d.stageId !== 'cerrado' && d.stageId !== 'descartado');
  const closedDeals = deals.filter(d => d.stageId === 'cerrado');
  const discardedDeals = deals.filter(d => d.stageId === 'descartado');

  const totalPipeline = activeDeals.reduce((s, d) => s + (d.dealSize ?? 0), 0);
  const totalClosed = closedDeals.reduce((s, d) => s + (d.dealSize ?? 0), 0);

  const conversionRate = totalDeals > 0
    ? Math.round((closedDeals.length / totalDeals) * 100)
    : 0;

  const highPriority = deals.filter(d => d.priority === 'Alta' && d.stageId !== 'cerrado' && d.stageId !== 'descartado').length;

  const formatM = (v: number) => {
    if (v >= 1000) return `€${(v / 1000).toFixed(1)}B`;
    return `€${v}M`;
  };

  const metrics = [
    {
      label: 'Pipeline Activo',
      value: formatM(totalPipeline),
      sub: `${activeDeals.length} deals activos`,
      icon: BarChart3,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Cerrado (ganado)',
      value: formatM(totalClosed),
      sub: `${closedDeals.length} deals cerrados`,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Tasa de conversión',
      value: `${conversionRate}%`,
      sub: `${closedDeals.length} de ${totalDeals} totales`,
      icon: TrendingUp,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'Alta prioridad',
      value: String(highPriority),
      sub: 'deals activos urgentes',
      icon: Target,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
    {
      label: 'Total en curso',
      value: String(activeDeals.length),
      sub: `${discardedDeals.length} descartados`,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  // Stage distribution
  const stageStats = STAGES.map(stage => ({
    stage,
    count: deals.filter(d => d.stageId === stage.id).length,
    value: deals.filter(d => d.stageId === stage.id).reduce((s, d) => s + (d.dealSize ?? 0), 0),
  })).filter(s => s.count > 0);

  const maxCount = Math.max(...stageStats.map(s => s.count), 1);

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4">
      {/* Metrics row */}
      <div className="flex gap-4 overflow-x-auto pb-1">
        {metrics.map(m => (
          <div key={m.label} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 flex-shrink-0 min-w-[160px]">
            <div className={`w-9 h-9 rounded-lg ${m.bg} flex items-center justify-center`}>
              <m.icon size={16} className={m.color} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 leading-tight">{m.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{m.label}</p>
            </div>
          </div>
        ))}

        {/* Stage bar chart mini */}
        <div className="flex-1 bg-slate-50 rounded-xl px-4 py-3 min-w-[300px] flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpRight size={14} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">Distribución del funnel</span>
          </div>
          <div className="flex items-end gap-2 h-10">
            {stageStats.map(({ stage, count }) => (
              <div key={stage.id} className="flex flex-col items-center gap-1 flex-1" title={`${stage.label}: ${count}`}>
                <span className="text-[9px] text-slate-500 font-medium">{count}</span>
                <div
                  className="w-full rounded-sm min-h-[4px] transition-all"
                  style={{
                    backgroundColor: stage.color,
                    height: `${Math.max(4, (count / maxCount) * 32)}px`,
                    opacity: 0.8,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-1 flex-wrap">
            {stageStats.map(({ stage }) => (
              <div key={stage.id} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="text-[9px] text-slate-400">{stage.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
