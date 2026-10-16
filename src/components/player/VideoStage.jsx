import { cameraService } from "@/services/cameraService";
import { useSessionStore } from "@/stores/sessionStore";
import { useViewStore } from "@/stores/viewStore";

function getMediaStyle(objectFit, zoom) {
  const stretch = objectFit === "fill";
  return {
    objectFit,
    transform: `scale(${zoom / 100})`,
    width: stretch ? "100%" : "auto",
    height: stretch ? "100%" : "auto",
    maxWidth: stretch ? "none" : "100%",
    maxHeight: stretch ? "none" : "100%",
    imageRendering: "crisp-edges",
  };
}

function NativeStream({ streamKey }) {
  const zoom = useViewStore((s) => s.zoom);
  const objectFit = useViewStore((s) => s.objectFit);

  return (
    <img
      className="transition-all duration-200"
      src={cameraService.streamUrl(streamKey)}
      alt="Capture stream"
      style={getMediaStyle(objectFit, zoom)}
    />
  );
}

function EmptyState() {
  return (
    <div className="text-center">
      <p className="text-gray-400 text-lg">Selecciona un dispositivo de video</p>
      <p className="text-gray-500 text-sm mt-2">Haz clic en el menú para elegir una cámara</p>
    </div>
  );
}

/** Área de video; `ref` apunta al contenedor que se maximiza en pantalla completa. */
export default function VideoStage({ ref }) {
  const device = useSessionStore((s) => s.device);
  const streamKey = useSessionStore((s) => s.streamKey);

  return (
    <div ref={ref} className="absolute inset-0 flex items-center justify-center bg-black z-10 overflow-hidden">
      {device ? <NativeStream key={streamKey} streamKey={streamKey} /> : <EmptyState />}
    </div>
  );
}
