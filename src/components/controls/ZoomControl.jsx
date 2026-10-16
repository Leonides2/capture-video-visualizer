import Button from "@/components/ui/Button";
import Slider from "@/components/ui/Slider";
import { ZOOM } from "@/config/constants";
import { useViewStore } from "@/stores/viewStore";

export default function ZoomControl() {
  const zoom = useViewStore((s) => s.zoom);
  const { setZoom, zoomBy } = useViewStore((s) => s.actions);

  return (
    <div className="flex items-center gap-2">
      <Button size="xs" onClick={() => zoomBy(-ZOOM.step)} aria-label="Reducir zoom">
        −
      </Button>
      <Slider
        min={ZOOM.min}
        max={ZOOM.max}
        value={zoom}
        onChange={(e) => setZoom(Number(e.target.value))}
        className="w-32"
        aria-label="Control de zoom"
      />
      <Button size="xs" onClick={() => zoomBy(ZOOM.step)} aria-label="Aumentar zoom">
        +
      </Button>
      <span className="text-white text-sm min-w-12">{zoom}%</span>
    </div>
  );
}
