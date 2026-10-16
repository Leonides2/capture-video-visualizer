import { invoke } from "@tauri-apps/api/core";
import { STREAM_SERVER_URL } from "@/config/constants";
import { toCaptureFormat } from "@/models/captureFormat";

/**
 * @typedef {Object} CaptureDevice
 * @property {number} id   Índice de la cámara en el backend nativo.
 * @property {string} name
 * @property {string} description
 */

// Nombres de los comandos registrados en src-tauri/src/lib.rs
const COMMANDS = {
  listDevices: "get_video_devices",
  getFormats: "get_camera_formats",
  startStream: "start_video_stream",
  stopStream: "stop_video_stream",
};

/** Única puerta de entrada al motor de video nativo (Rust). */
export const cameraService = {
  /** @returns {Promise<CaptureDevice[]>} */
  async listDevices() {
    const devices = await invoke(COMMANDS.listDevices);
    return devices.map(({ id, name, description }) => ({ id, name, description }));
  },

  /** @returns {Promise<import("@/models/captureFormat").CaptureFormat[]>} */
  async getFormats(deviceId) {
    const formats = await invoke(COMMANDS.getFormats, { cameraId: deviceId });
    return formats.map(toCaptureFormat);
  },

  /**
   * Sin `codec`, el backend elige el formato compatible más cercano.
   * @returns {Promise<import("@/models/captureFormat").CaptureFormat>} Formato realmente activo.
   */
  async startStream(deviceId, { width, height, fps, codec }) {
    const active = await invoke(COMMANDS.startStream, { cameraId: deviceId, width, height, fps, codec });
    return toCaptureFormat(active);
  },

  stopStream() {
    return invoke(COMMANDS.stopStream);
  },

  /** URL del stream MJPEG; cambiar `streamKey` obliga al <img> a reconectarse. */
  streamUrl(streamKey) {
    return `${STREAM_SERVER_URL}?t=${streamKey}`;
  },
};
