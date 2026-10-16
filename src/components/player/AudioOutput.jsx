import { useEffect, useRef } from "react";
import { useAudioStore } from "@/stores/audioStore";

/** Reproduce el MediaStream de audio aplicando volumen y mute del store. */
export default function AudioOutput({ stream }) {
  const ref = useRef(null);
  const volume = useAudioStore((s) => s.volume);
  const muted = useAudioStore((s) => s.muted);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream;
    if (stream) el.play().catch((err) => console.warn("No se pudo reproducir el audio:", err));
  }, [stream]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.volume = volume / 100;
    el.muted = muted;
  }, [volume, muted]);

  return <audio ref={ref} autoPlay hidden />;
}
