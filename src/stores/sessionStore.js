import { create } from "zustand";

const initialState = {
  /** @type {import("@/services/cameraService").CaptureDevice|null} */
  device: null,
  /** @type {import("@/models/captureFormat").CaptureFormat|null} */
  format: null,
  /** Cambia cada vez que el stream nativo (re)arranca para recargar el <img>. */
  streamKey: 0,
  /** Cambia al seleccionar o reconectar un dispositivo para re-adquirir el audio. */
  connectionId: 0,
  error: null,
  /** Métricas del pipeline nativo (evento capture-stats), una vez por segundo. */
  stats: null,
};

/** Estado de la sesión de captura activa. La lógica asíncrona vive en useCaptureSession. */
export const useSessionStore = create((set) => ({
  ...initialState,
  actions: {
    streamStarted: ({ device, format, newConnection }) =>
      set((state) => ({
        device,
        format,
        error: null,
        stats: null,
        streamKey: Date.now(),
        connectionId: newConnection ? state.connectionId + 1 : state.connectionId,
      })),
    streamStopped: () => set(initialState),
    setError: (error) => set({ error }),
    setStats: (stats) => set({ stats }),
  },
}));
