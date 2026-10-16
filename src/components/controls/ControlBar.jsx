import AudioControl from "@/components/controls/AudioControl";
import FitModeControl from "@/components/controls/FitModeControl";
import FormatSelector from "@/components/controls/FormatSelector";
import ViewActions from "@/components/controls/ViewActions";
import ZoomControl from "@/components/controls/ZoomControl";
import Divider from "@/components/ui/Divider";
import { useCameraFormats } from "@/hooks/useCameraFormats";
import { useSessionStore } from "@/stores/sessionStore";

/** Barra inferior de controles; solo se muestra con un dispositivo activo. */
export default function ControlBar({ hasAudio, onToggleFullscreen }) {
  const device = useSessionStore((s) => s.device);
  const formats = useCameraFormats(device?.id);

  if (!device) return null;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg max-w-[95vw]">
      <div className="flex items-center gap-4 flex-wrap justify-center">
        <ZoomControl />
        <Divider />
        <FitModeControl />
        <Divider />
        {formats.length > 0 && (
          <>
            <FormatSelector formats={formats} />
            <Divider />
          </>
        )}
        <ViewActions onToggleFullscreen={onToggleFullscreen} />
        <Divider />
        <AudioControl hasAudio={hasAudio} />
      </div>
    </div>
  );
}
