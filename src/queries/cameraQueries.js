import { queryOptions } from "@tanstack/react-query";
import { cameraService } from "@/services/cameraService";

export const cameraKeys = {
  all: ["camera"],
  devices: () => [...cameraKeys.all, "devices"],
  formats: (deviceId) => [...cameraKeys.all, "formats", deviceId],
};

export const cameraQueries = {
  devices: () =>
    queryOptions({
      queryKey: cameraKeys.devices(),
      queryFn: cameraService.listDevices,
    }),

  // Consultar formatos abre la cámara, así que se cachean de forma indefinida:
  // no se vuelven a pedir al reconectar ni mientras el dispositivo está en uso.
  formats: (deviceId) =>
    queryOptions({
      queryKey: cameraKeys.formats(deviceId),
      queryFn: () => cameraService.getFormats(deviceId),
      staleTime: Infinity,
    }),
};
