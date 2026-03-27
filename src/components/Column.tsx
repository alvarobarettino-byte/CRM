import { Droppable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import type { Deal, Stage, StageId } from '../types';
import { DealCard } from './DealCard';

interface ColumnProps {
  stage: Stage;
  deals: Deal[];
  onAddDeal: (stageId: StageId) => void;
  onEditDeal: (deal: Deal) => void;
  onDeleteDeal: (id: string) => void;
}

function totalValue(deals: Deal[]) {
  const sum = deals.reduce((acc, d) => acc + (d.dealSize ?? 0), 0);
  if (sum === 0) return null;
  if (sum >= 1000) return `€${(sum / 1000).toFixed(1)}B`;
  return `€${sum}M`;
}

export function Column({ stage, deals, onAddDeal, onEditDeal, onDeleteDeal }: ColumnProps) {
  const total = totalValue(deals);

  return (
    <div className="flex flex-col w-64 flex-shrink-0">
      {/* Column Header */}
      <div
        className="rounded-xl px-3 py-2.5 mb-2 border"
        style={{ backgroundColor: stage.bgColor, borderColor: stage.borderColor }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
            <span className="text-sm font-semibold" style={{ color: stage.color }}>
              {stage.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: stage.color }}
            >
              {deals.length}
            </span>
          </div>
        </div>
        {total && (
          <p className="text-xs mt-1 font-medium" style={{ color: stage.color, opacity: 0.8 }}>
            {total} total
          </p>
        )}
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-[120px] rounded-xl transition-colors p-1 -m-1 ${
              snapshot.isDraggingOver ? 'bg-indigo-50/60' : ''
            }`}
          >
            {deals.map((deal, index) => (
              <DealCard
                key={deal.id}
                deal={deal}
                index={index}
                onEdit={onEditDeal}
                onDelete={onDeleteDeal}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add Deal Button */}
      <button
        onClick={() => onAddDeal(stage.id)}
        className="mt-2 flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all border border-dashed border-slate-200 hover:border-slate-300 w-full"
      >
        <Plus size={13} />
        Añadir deal
      </button>
    </div>
  );
}
