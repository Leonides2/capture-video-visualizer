import { create } from "zustand";
import { DEFAULT_FIT_MODE, ZOOM } from "@/config/constants";

const clampZoom = (value) => Math.min(ZOOM.max, Math.max(ZOOM.min, value));

/** Cómo se presenta el video en pantalla (zoom y modo de ajuste). */
export const useViewStore = create((set) => ({
  zoom: ZOOM.default,
  objectFit: DEFAULT_FIT_MODE,
  actions: {
    setZoom: (zoom) => set({ zoom: clampZoom(zoom) }),
    zoomBy: (delta) => set((state) => ({ zoom: clampZoom(state.zoom + delta) })),
    setObjectFit: (objectFit) => set({ objectFit }),
    resetView: () => set({ zoom: ZOOM.default, objectFit: DEFAULT_FIT_MODE }),
  },
}));
