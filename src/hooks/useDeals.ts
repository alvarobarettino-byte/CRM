import { useState, useEffect, useCallback } from 'react';
import type { Deal, StageId } from '../types';
import { SAMPLE_DEALS } from '../data/stages';

const STORAGE_KEY = 'ma-crm-deals';

export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return SAMPLE_DEALS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
  }, [deals]);

  const addDeal = useCallback((deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newDeal: Deal = {
      ...deal,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    setDeals(prev => [newDeal, ...prev]);
    return newDeal;
  }, []);

  const updateDeal = useCallback((id: string, updates: Partial<Deal>) => {
    setDeals(prev =>
      prev.map(d =>
        d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
      )
    );
  }, []);

  const deleteDeal = useCallback((id: string) => {
    setDeals(prev => prev.filter(d => d.id !== id));
  }, []);

  const moveDeal = useCallback((id: string, stageId: StageId) => {
    setDeals(prev =>
      prev.map(d =>
        d.id === id ? { ...d, stageId, updatedAt: new Date().toISOString() } : d
      )
    );
  }, []);

  const reorderDeals = useCallback((
    sourceStageId: StageId,
    destStageId: StageId,
    sourceIndex: number,
    destIndex: number
  ) => {
    setDeals(prev => {
      const stageDeals = prev.filter(d => d.stageId === sourceStageId);
      const otherDeals = prev.filter(d => d.stageId !== sourceStageId);

      const [moved] = stageDeals.splice(sourceIndex, 1);
      moved.stageId = destStageId;
      moved.updatedAt = new Date().toISOString();

      if (sourceStageId === destStageId) {
        stageDeals.splice(destIndex, 0, moved);
        return [...otherDeals, ...stageDeals];
      } else {
        const destDeals = prev.filter(d => d.stageId === destStageId);
        const rest = prev.filter(d => d.stageId !== sourceStageId && d.stageId !== destStageId);
        destDeals.splice(destIndex, 0, moved);
        return [...rest, ...stageDeals, ...destDeals];
      }
    });
  }, []);

  return { deals, addDeal, updateDeal, deleteDeal, moveDeal, reorderDeals };
}
