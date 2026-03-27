import { Plus, Search, Filter, TrendingUp } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterPriority: string;
  onFilterChange: (p: string) => void;
  filterSector: string;
  onSectorChange: (s: string) => void;
  onAddDeal: () => void;
  sectors: string[];
  showDashboard: boolean;
  onToggleDashboard: () => void;
}

export function Header({
  searchQuery,
  onSearchChange,
  filterPriority,
  onFilterChange,
  filterSector,
  onSectorChange,
  onAddDeal,
  sectors,
  showDashboard,
  onToggleDashboard,
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4 sticky top-0 z-30 shadow-sm">
      {/* Brand */}
      <div className="flex items-center gap-2.5 mr-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <TrendingUp size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-900 leading-tight">M&A CRM</h1>
          <p className="text-[10px] text-slate-400">Pipeline de oportunidades</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Buscar empresa, contacto..."
          className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-slate-50"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter size={13} className="text-slate-400" />
        <select
          value={filterPriority}
          onChange={e => onFilterChange(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white text-slate-600"
        >
          <option value="">Prioridad</option>
          <option value="Alta">Alta</option>
          <option value="Media">Media</option>
          <option value="Baja">Baja</option>
        </select>

        {sectors.length > 0 && (
          <select
            value={filterSector}
            onChange={e => onSectorChange(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white text-slate-600"
          >
            <option value="">Sector</option>
            {sectors.map(s => <option key={s}>{s}</option>)}
          </select>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Dashboard toggle */}
        <button
          onClick={onToggleDashboard}
          className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
            showDashboard
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
          }`}
        >
          Dashboard
        </button>

        {/* Add Deal */}
        <button
          onClick={onAddDeal}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={15} />
          Nuevo deal
        </button>
      </div>
    </header>
  );
}
