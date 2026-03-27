import { useState, useMemo } from 'react';
import type { Deal, StageId } from './types';
import { useDeals } from './hooks/useDeals';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Board } from './components/Board';
import { DealModal } from './components/DealModal';
import { SECTORS } from './data/stages';

export default function App() {
  const { deals, addDeal, updateDeal, deleteDeal, reorderDeals } = useDeals();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [initialStageId, setInitialStageId] = useState<StageId>('identificacion');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [showDashboard, setShowDashboard] = useState(true);

  const activeSectors = useMemo(() => {
    return SECTORS.filter(s => deals.some(d => d.sector === s));
  }, [deals]);

  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      if (filterPriority && deal.priority !== filterPriority) return false;
      if (filterSector && deal.sector !== filterSector) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          deal.company.toLowerCase().includes(q) ||
          deal.contactName.toLowerCase().includes(q) ||
          deal.sector.toLowerCase().includes(q) ||
          deal.assignedTo.toLowerCase().includes(q) ||
          deal.tags.some(t => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [deals, filterPriority, filterSector, searchQuery]);

  const openAdd = (stageId: StageId = 'identificacion') => {
    setEditingDeal(null);
    setInitialStageId(stageId);
    setModalOpen(true);
  };

  const openEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setModalOpen(true);
  };

  const handleSave = (data: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingDeal) {
      updateDeal(editingDeal.id, data);
    } else {
      addDeal(data);
    }
    setModalOpen(false);
    setEditingDeal(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Seguro que quieres eliminar este deal?')) {
      deleteDeal(id);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterPriority={filterPriority}
        onFilterChange={setFilterPriority}
        filterSector={filterSector}
        onSectorChange={setFilterSector}
        onAddDeal={() => openAdd()}
        sectors={activeSectors}
        showDashboard={showDashboard}
        onToggleDashboard={() => setShowDashboard(v => !v)}
      />

      {showDashboard && <Dashboard deals={deals} />}

      <main className="flex-1 overflow-auto">
        <Board
          deals={filteredDeals}
          onAddDeal={openAdd}
          onEditDeal={openEdit}
          onDeleteDeal={handleDelete}
          onDragEnd={reorderDeals}
        />
      </main>

      {modalOpen && (
        <DealModal
          deal={editingDeal}
          initialStageId={initialStageId}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingDeal(null); }}
        />
      )}
    </div>
  );
}
