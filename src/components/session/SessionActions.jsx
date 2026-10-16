import Button from "@/components/ui/Button";
import { PowerIcon, ReconnectIcon } from "@/components/ui/icons";
import { useCaptureSession } from "@/hooks/useCaptureSession";
import { useSessionStore } from "@/stores/sessionStore";

/** Botones de la esquina superior derecha: apagar y reconectar la capturadora. */
export default function SessionActions() {
  const device = useSessionStore((s) => s.device);
  const { stop, reconnect, isStarting } = useCaptureSession();

  if (!device) return null;

  return (
    <div className="absolute top-4 right-4 z-50 flex gap-2">
      <Button variant="dangerOutline" size="md" onClick={stop} title="Apagar transmisión">
        <PowerIcon />
        Apagar
      </Button>
      <Button
        variant="danger"
        size="md"
        onClick={reconnect}
        disabled={isStarting}
        title="Forzar reinicio de hardware (útil si la imagen se congela)"
      >
        <ReconnectIcon />
        {isStarting ? "Reconectando..." : "Reconectar"}
      </Button>
    </div>
  );
}
