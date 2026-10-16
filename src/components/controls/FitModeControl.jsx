import Button from "@/components/ui/Button";
import { FIT_MODES } from "@/config/constants";
import { useViewStore } from "@/stores/viewStore";

export default function FitModeControl() {
  const objectFit = useViewStore((s) => s.objectFit);
  const { setObjectFit } = useViewStore((s) => s.actions);

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Modo de ajuste">
      {FIT_MODES.map(({ value, label }) => (
        <Button
          key={value}
          variant={objectFit === value ? "primary" : "secondary"}
          aria-pressed={objectFit === value}
          onClick={() => setObjectFit(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
