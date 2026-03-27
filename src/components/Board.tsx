import { DragDropContext } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import type { Deal, StageId } from '../types';
import { STAGES } from '../data/stages';
import { Column } from './Column';

interface BoardProps {
  deals: Deal[];
  onAddDeal: (stageId: StageId) => void;
  onEditDeal: (deal: Deal) => void;
  onDeleteDeal: (id: string) => void;
  onDragEnd: (sourceStageId: StageId, destStageId: StageId, sourceIndex: number, destIndex: number) => void;
}

export function Board({ deals, onAddDeal, onEditDeal, onDeleteDeal, onDragEnd }: BoardProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const sourceStageId = result.source.droppableId as StageId;
    const destStageId = result.destination.droppableId as StageId;
    onDragEnd(sourceStageId, destStageId, result.source.index, result.destination.index);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 p-5 overflow-x-auto min-h-full items-start">
        {STAGES.map(stage => {
          const stageDeals = deals
            .filter(d => d.stageId === stage.id)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

          return (
            <Column
              key={stage.id}
              stage={stage}
              deals={stageDeals}
              onAddDeal={onAddDeal}
              onEditDeal={onEditDeal}
              onDeleteDeal={onDeleteDeal}
            />
          );
        })}
      </div>
    </DragDropContext>
  );
}
