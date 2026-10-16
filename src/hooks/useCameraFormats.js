import { useQuery } from "@tanstack/react-query";
import { cameraQueries } from "@/queries/cameraQueries";

const NO_FORMATS = [];

/**
 * Formatos del dispositivo leídos desde la caché. Los carga useCaptureSession
 * antes de abrir el stream; aquí no se consultan porque la cámara ya está en uso.
 */
export function useCameraFormats(deviceId) {
  const { data } = useQuery({ ...cameraQueries.formats(deviceId), enabled: false });
  return data ?? NO_FORMATS;
}
