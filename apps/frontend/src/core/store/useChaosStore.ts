import { create } from 'zustand';

export interface ActiveSabotage {
  id: string;
  targetId: string;
  effectType: string;
  authorId: string;
  expiresAt: number;
}

interface ChaosState {
  activeSabotages: ActiveSabotage[];
  addSabotage: (sabotage: ActiveSabotage) => void;
  removeSabotage: (id: string) => void;
  clearExpired: () => void;
}

export const useChaosStore = create<ChaosState>((set) => ({
  activeSabotages: [],
  addSabotage: (sabotage) =>
    set((state) => ({
      activeSabotages: [...state.activeSabotages.filter((s) => s.id !== sabotage.id), sabotage],
    })),
  removeSabotage: (id) =>
    set((state) => ({
      activeSabotages: state.activeSabotages.filter((s) => s.id !== id),
    })),
  clearExpired: () =>
    set((state) => {
      const now = Date.now();
      return {
        activeSabotages: state.activeSabotages.filter((s) => s.expiresAt > now),
      };
    }),
}));
