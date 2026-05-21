import { create } from 'zustand';
import { actionSyncMercyState } from '../../app/actions/auth';
import { useAuthStore } from './useAuthStore';

interface MercyState {
  failures: number;
  isMercyActive: boolean;
  showActivationModal: boolean;
  setMercyState: (failures: number, isMercyActive: boolean) => void;
  incrementFailures: () => Promise<void>;
  triggerMercy: () => Promise<void>;
  setMercyActive: (isActive: boolean) => Promise<void>;
  dismissActivationModal: () => void;
}

export const useMercyStore = create<MercyState>((set, get) => ({
  failures: 0,
  isMercyActive: false,
  showActivationModal: false,
  setMercyState: (failures: number, isMercyActive: boolean) => {
    set({ failures, isMercyActive });
  },
  incrementFailures: async () => {
    const state = get();
    const nextFailures = state.failures + 1;
    const shouldActivate = nextFailures >= 10 && !state.isMercyActive;
    const nextMercyActive = state.isMercyActive || shouldActivate;

    set({
      failures: nextFailures,
      isMercyActive: nextMercyActive,
      showActivationModal: shouldActivate ? true : state.showActivationModal,
    });

    try {
      const res = await actionSyncMercyState(nextFailures, nextMercyActive);
      if (res.success && res.data) {
        // Prevent race condition: only update user profile if local failures haven't increased past this request
        if (get().failures <= nextFailures) {
          useAuthStore.getState().setUser(res.data);
        }
      } else {
        console.error('Failed to sync mercy state:', res.error?.message);
      }
    } catch (err) {
      console.error('Network error during mercy sync:', err);
    }
  },
  triggerMercy: async () => {
    const wasActive = get().isMercyActive;
    set({
      isMercyActive: true,
      showActivationModal: !wasActive ? true : get().showActivationModal,
    });
    try {
      const res = await actionSyncMercyState(get().failures, true);
      if (res.success && res.data) {
        useAuthStore.getState().setUser(res.data);
      } else {
        console.error('Failed to trigger mercy mode:', res.error?.message);
      }
    } catch (err) {
      console.error('Network error during mercy trigger:', err);
    }
  },
  setMercyActive: async (isActive: boolean) => {
    const wasActive = get().isMercyActive;
    const nextFailures = isActive ? get().failures : 0; // Reset failures to 0 if deactivating

    set({
      isMercyActive: isActive,
      failures: nextFailures,
      showActivationModal: (isActive && !wasActive) ? true : get().showActivationModal,
    });
    try {
      const res = await actionSyncMercyState(nextFailures, isActive);
      if (res.success && res.data) {
        // Only update if local state matches the sync target or hasn't drifted
        if (get().isMercyActive === isActive) {
          useAuthStore.getState().setUser(res.data);
        }
      } else {
        console.error('Failed to set mercy active:', res.error?.message);
      }
    } catch (err) {
      console.error('Network error during setting mercy active:', err);
    }
  },
  dismissActivationModal: () => {
    set({ showActivationModal: false });
  },
}));

