/** Servidor MJPEG local levantado por el backend de Rust (ver src-tauri/src/camera.rs). */
export const STREAM_SERVER_URL = "http://127.0.0.1:18342/stream";

/** Eventos emitidos por el hilo de captura (src-tauri/src/camera/mod.rs). */
export const CAPTURE_EVENTS = {
  stats: "capture-stats",
  error: "capture-error",
};

export const ZOOM = {
  min: 50,
  max: 200,
  step: 10,
  default: 100,
};

export const FIT_MODES = [
  { value: "contain", label: "Ajustar" },
  { value: "cover", label: "Llenar" },
  { value: "fill", label: "Estirar" },
];

export const DEFAULT_FIT_MODE = "contain";

export const DEFAULT_VOLUME = 100;

export const MESSAGES = {
  devicesUnavailable: "No se pudieron acceder a los dispositivos de video mediante Rust.",
  startFailed: (deviceName) => `Error al iniciar la capturadora en Rust: ${deviceName}`,
  formatFailed: "Error al aplicar el nuevo formato de resolución.",
};
