import { Draggable } from '@hello-pangea/dnd';
import { Building2, User, TrendingUp, MoreHorizontal, Edit2, Trash2, Tag } from 'lucide-react';
import { useState } from 'react';
import type { Deal, Priority } from '../types';

interface DealCardProps {
  deal: Deal;
  index: number;
  onEdit: (deal: Deal) => void;
  onDelete: (id: string) => void;
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  Alta: { label: 'Alta', className: 'bg-red-100 text-red-700' },
  Media: { label: 'Media', className: 'bg-amber-100 text-amber-700' },
  Baja: { label: 'Baja', className: 'bg-slate-100 text-slate-500' },
};

function formatDeal(size: number | null) {
  if (size === null) return null;
  if (size >= 1000) return `€${(size / 1000).toFixed(1)}B`;
  return `€${size}M`;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const avatarColors = [
  'bg-violet-200 text-violet-700',
  'bg-cyan-200 text-cyan-700',
  'bg-pink-200 text-pink-700',
  'bg-emerald-200 text-emerald-700',
  'bg-amber-200 text-amber-700',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % avatarColors.length;
  return avatarColors[hash];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Hoy';
  if (d === 1) return 'Ayer';
  if (d < 7) return `Hace ${d}d`;
  if (d < 30) return `Hace ${Math.floor(d / 7)}sem`;
  if (d < 365) return `Hace ${Math.floor(d / 30)}m`;
  return `Hace ${Math.floor(d / 365)}a`;
}

export function DealCard({ deal, index, onEdit, onDelete }: DealCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Draggable draggableId={deal.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-xl border border-slate-200 p-3.5 mb-2.5 cursor-grab active:cursor-grabbing transition-all select-none group ${
            snapshot.isDragging
              ? 'shadow-xl border-indigo-300 rotate-1 scale-105'
              : 'hover:shadow-md hover:border-slate-300'
          }`}
        >
          {/* Top row */}
          <div className="flex items-start justify-between gap-2 mb-2.5">
            <div className="flex items-start gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Building2 size={14} className="text-indigo-500" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-slate-900 leading-tight truncate max-w-[150px]">
                  {deal.company}
                </h4>
                <span className="text-xs text-slate-400">{deal.sector}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${priorityConfig[deal.priority].className}`}>
                {deal.priority}
              </span>
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
                  className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                >
                  <MoreHorizontal size={14} />
                </button>
                {menuOpen && (
                  <div
                    className="absolute right-0 top-7 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden min-w-[130px]"
                    onMouseLeave={() => setMenuOpen(false)}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(deal); }}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 w-full text-left transition-colors"
                    >
                      <Edit2 size={12} /> Editar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(deal.id); }}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                    >
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Deal metrics */}
          {(deal.dealSize !== null || deal.evEbitda !== null) && (
            <div className="flex gap-2 mb-2.5">
              {deal.dealSize !== null && (
                <div className="flex items-center gap-1 bg-slate-50 rounded-md px-2 py-1">
                  <span className="text-[11px] font-bold text-slate-700">{formatDeal(deal.dealSize)}</span>
                </div>
              )}
              {deal.evEbitda !== null && (
                <div className="flex items-center gap-1 bg-slate-50 rounded-md px-2 py-1">
                  <TrendingUp size={10} className="text-slate-400" />
                  <span className="text-[11px] text-slate-600">{deal.evEbitda}x</span>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {deal.tags && deal.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2.5">
              <Tag size={10} className="text-slate-300 mt-0.5" />
              {deal.tags.slice(0, 2).map(tag => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">
                  {tag}
                </span>
              ))}
              {deal.tags.length > 2 && (
                <span className="text-[10px] text-slate-400">+{deal.tags.length - 2}</span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center ${getAvatarColor(deal.assignedTo)}`}>
                {getInitials(deal.assignedTo)}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <User size={10} />
                <span className="truncate max-w-[80px]">{deal.contactName}</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400">{timeAgo(deal.updatedAt)}</span>
          </div>
        </div>
      )}
    </Draggable>
  );
}
