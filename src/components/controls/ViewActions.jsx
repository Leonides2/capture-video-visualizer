import Button from "@/components/ui/Button";
import { useViewStore } from "@/stores/viewStore";

export default function ViewActions({ onToggleFullscreen }) {
  const showStats = useViewStore((s) => s.showStats);
  const { resetView, toggleStats } = useViewStore((s) => s.actions);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={showStats ? "primary" : "secondary"}
        onClick={toggleStats}
        aria-pressed={showStats}
        title="Mostrar fps y métricas del stream"
      >
        Stats
      </Button>
      <Button onClick={resetView} title="Reiniciar zoom y modo de ajuste">
        Reiniciar
      </Button>
      <Button variant="primary" onClick={onToggleFullscreen}>
        Pantalla Completa
      </Button>
    </div>
  );
}
