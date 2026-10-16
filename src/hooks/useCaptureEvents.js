import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { CAPTURE_EVENTS } from "@/config/constants";
import { useSessionStore } from "@/stores/sessionStore";

/** Escucha métricas y errores que emite el hilo de captura nativo. */
export function useCaptureEvents() {
  const { setStats, setError } = useSessionStore((s) => s.actions);

  useEffect(() => {
    const subscriptions = [
      listen(CAPTURE_EVENTS.stats, (event) => setStats(event.payload)),
      listen(CAPTURE_EVENTS.error, (event) => setError(event.payload)),
    ];
    return () => subscriptions.forEach((subscription) => subscription.then((unlisten) => unlisten()));
  }, [setStats, setError]);
}
