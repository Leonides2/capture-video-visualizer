import { useSessionStore } from "@/stores/sessionStore";

/** Muestra errores de la sesión activa (p. ej. la capturadora dejó de enviar video). */
export default function CaptureErrorBanner() {
  const device = useSessionStore((s) => s.device);
  const error = useSessionStore((s) => s.error);
  const { setError } = useSessionStore((s) => s.actions);

  if (!device || !error) return null;

  return (
    <div
      role="alert"
      className="absolute top-16 left-1/2 -translate-x-1/2 z-40 max-w-md bg-red-900/90 text-red-100 text-sm rounded-lg px-4 py-2 shadow-lg flex items-center gap-3"
    >
      <span>{error}</span>
      <button
        type="button"
        onClick={() => setError(null)}
        aria-label="Cerrar aviso"
        className="text-red-300 hover:text-white text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}
