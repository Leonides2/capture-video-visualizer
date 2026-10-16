import { formatLabel } from "@/models/captureFormat";
import { useSessionStore } from "@/stores/sessionStore";
import { useViewStore } from "@/stores/viewStore";

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-400">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default function CaptureStatsOverlay() {
  const showStats = useViewStore((s) => s.showStats);
  const device = useSessionStore((s) => s.device);
  const format = useSessionStore((s) => s.format);
  const stats = useSessionStore((s) => s.stats);

  if (!showStats || !device) return null;

  return (
    <div className="absolute top-16 right-4 z-40 min-w-64 bg-black/75 text-gray-100 text-xs font-mono rounded-lg px-3 py-2 space-y-0.5 pointer-events-none">
      <StatRow label="Formato" value={format ? formatLabel(format) : "—"} />
      {stats ? (
        <>
          <StatRow label="Captura" value={`${stats.captureFps.toFixed(1)} fps`} />
          <StatRow label="Entregados" value={`${stats.servedFps.toFixed(1)} fps`} />
          <StatRow label="Saltados" value={`${stats.skippedFrames} /s`} />
          <StatRow
            label="Codificación"
            value={stats.passthrough ? "MJPEG passthrough" : `${stats.encodeMs.toFixed(1)} ms/frame`}
          />
          <StatRow label="Tamaño" value={`${Math.round(stats.frameKb)} KB/frame`} />
        </>
      ) : (
        <p className="text-gray-400">Esperando métricas...</p>
      )}
    </div>
  );
}
