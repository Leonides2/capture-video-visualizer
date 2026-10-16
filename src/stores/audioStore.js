import { create } from "zustand";
import { DEFAULT_VOLUME } from "@/config/constants";

/** Preferencias de salida de audio (independientes del dispositivo). */
export const useAudioStore = create((set) => ({
  volume: DEFAULT_VOLUME,
  muted: false,
  actions: {
    setVolume: (volume) => set({ volume, muted: volume === 0 }),
    toggleMute: () => set((state) => ({ muted: !state.muted })),
  },
}));
