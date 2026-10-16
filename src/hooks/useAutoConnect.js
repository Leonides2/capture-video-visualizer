import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { cameraQueries } from "@/queries/cameraQueries";
import { useCaptureSession } from "@/hooks/useCaptureSession";

/** Al arrancar la app, inicia el primer dispositivo disponible (una sola vez). */
export function useAutoConnect() {
  const { data: devices } = useQuery(cameraQueries.devices());
  const { selectDevice } = useCaptureSession();
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current || !devices?.length) return;
    attempted.current = true;
    selectDevice(devices[0]);
  }, [devices, selectDevice]);
}
