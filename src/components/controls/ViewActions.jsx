import Button from "@/components/ui/Button";
import { useViewStore } from "@/stores/viewStore";

export default function ViewActions({ onToggleFullscreen }) {
  const { resetView } = useViewStore((s) => s.actions);

  return (
    <div className="flex items-center gap-2">
      <Button onClick={resetView} title="Reiniciar zoom y modo de ajuste">
        Reiniciar
      </Button>
      <Button variant="primary" onClick={onToggleFullscreen}>
        Pantalla Completa
      </Button>
    </div>
  );
}
