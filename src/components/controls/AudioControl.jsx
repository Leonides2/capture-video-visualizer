import Button from "@/components/ui/Button";
import Slider from "@/components/ui/Slider";
import { VolumeOffIcon, VolumeOnIcon } from "@/components/ui/icons";
import { useAudioStore } from "@/stores/audioStore";
import { cn } from "@/utils/cn";

export default function AudioControl({ hasAudio }) {
  const volume = useAudioStore((s) => s.volume);
  const muted = useAudioStore((s) => s.muted);
  const { setVolume, toggleMute } = useAudioStore((s) => s.actions);

  const silent = muted || !hasAudio;
  const shownVolume = silent ? 0 : volume;

  return (
    <div className="flex items-center gap-2">
      <Button
        size="xs"
        onClick={toggleMute}
        disabled={!hasAudio}
        aria-label={silent ? "Activar audio" : "Silenciar"}
        title={hasAudio ? undefined : "Audio no disponible"}
      >
        {silent ? <VolumeOffIcon /> : <VolumeOnIcon />}
      </Button>
      <Slider
        min={0}
        max={100}
        value={shownVolume}
        onChange={(e) => setVolume(Number(e.target.value))}
        disabled={!hasAudio}
        className="w-24"
        aria-label="Control de volumen"
      />
      <span className={cn("text-sm min-w-10 whitespace-nowrap", hasAudio ? "text-white" : "text-gray-500")}>
        {hasAudio ? `${shownVolume}%` : "Sin Audio"}
      </span>
    </div>
  );
}
