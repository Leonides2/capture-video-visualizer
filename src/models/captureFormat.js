/**
 * @typedef {Object} CaptureFormat
 * @property {string} id       Identificador estable (p. ej. "1920x1080@60-MJPEG").
 * @property {number} width
 * @property {number} height
 * @property {number} fps
 * @property {string|null} codec  Formato de píxel reportado por el backend (MJPEG, YUYV...).
 */

/** @returns {CaptureFormat} */
export function toCaptureFormat({ width, height, fps, format = null }) {
  return {
    id: `${width}x${height}@${fps}${format ? `-${format}` : ""}`,
    width,
    height,
    fps,
    codec: format,
  };
}

/** @param {CaptureFormat} format */
export function formatLabel({ width, height, fps, codec }) {
  return `${width}x${height} - ${fps}fps${codec ? ` (${codec})` : ""}`;
}

/** Se usa cuando el backend no puede listar los formatos de la cámara. */
export const DEFAULT_CAPTURE_FORMAT = toCaptureFormat({ width: 1280, height: 720, fps: 30 });
