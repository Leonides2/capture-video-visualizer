import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { MESSAGES } from "@/config/constants";
import { DEFAULT_CAPTURE_FORMAT } from "@/models/captureFormat";
import { cameraQueries } from "@/queries/cameraQueries";
import { cameraService } from "@/services/cameraService";
import { useSessionStore } from "@/stores/sessionStore";

const START_STREAM_KEY = ["stream", "start"];

/**
 * Acciones de la sesión de captura: seleccionar dispositivo, cambiar formato,
 * reconectar y apagar. Cualquier componente puede usarlo; el estado se comparte
 * a través de useSessionStore y la caché de TanStack Query.
 */
export function useCaptureSession() {
  const queryClient = useQueryClient();
  const { streamStarted, streamStopped, setError } = useSessionStore((s) => s.actions);
  const isStarting = useIsMutating({ mutationKey: START_STREAM_KEY }) > 0;

  const { mutateAsync: startStream } = useMutation({
    mutationKey: START_STREAM_KEY,
    mutationFn: ({ device, format }) => cameraService.startStream(device.id, format),
  });

  const { mutateAsync: stopStream } = useMutation({
    mutationFn: cameraService.stopStream,
  });

  const start = async ({ device, format, newConnection, errorMessage }) => {
    try {
      await startStream({ device, format });
      streamStarted({ device, format, newConnection });
      return true;
    } catch (err) {
      console.error("Error al iniciar el stream nativo:", err);
      setError(errorMessage);
      return false;
    }
  };

  const loadFormats = (deviceId) =>
    queryClient.fetchQuery(cameraQueries.formats(deviceId)).catch((err) => {
      console.warn("No se pudieron obtener formatos, usando default:", err);
      return [];
    });

  const selectDevice = async (device) => {
    const formats = await loadFormats(device.id);
    return start({
      device,
      format: formats[0] ?? DEFAULT_CAPTURE_FORMAT,
      newConnection: true,
      errorMessage: MESSAGES.startFailed(device.name),
    });
  };

  const changeFormat = async (format) => {
    const { device } = useSessionStore.getState();
    if (!device) return false;
    return start({ device, format, newConnection: false, errorMessage: MESSAGES.formatFailed });
  };

  /** Reinicia el hardware conservando el formato actual. */
  const reconnect = async () => {
    const { device, format } = useSessionStore.getState();
    if (!device) return false;
    return start({
      device,
      format: format ?? DEFAULT_CAPTURE_FORMAT,
      newConnection: true,
      errorMessage: MESSAGES.startFailed(device.name),
    });
  };

  const stop = async () => {
    try {
      await stopStream();
    } catch (err) {
      console.error("Error al detener el stream nativo:", err);
    }
    streamStopped();
  };

  return { selectDevice, changeFormat, reconnect, stop, isStarting };
}
