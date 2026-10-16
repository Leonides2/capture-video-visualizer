import { useEffect, useState } from "react";
import { audioService } from "@/services/audioService";

const NO_AUDIO = { stream: null, hasAudio: false };

/**
 * Adquiere el audio asociado al dispositivo de video y lo libera al cambiar
 * de dispositivo, reconectar (connectionId) o desmontar.
 */
export function useDeviceAudio(deviceName, connectionId) {
  const [audio, setAudio] = useState(NO_AUDIO);

  useEffect(() => {
    if (!deviceName) {
      setAudio(NO_AUDIO);
      return;
    }

    let cancelled = false;
    let acquired = null;

    audioService
      .openDeviceAudio(deviceName)
      .then((stream) => {
        if (cancelled) return audioService.stop(stream);
        acquired = stream;
        setAudio({ stream, hasAudio: stream.getAudioTracks().length > 0 });
      })
      .catch((err) => {
        console.warn("No se pudo iniciar el audio WebRTC:", err);
        if (!cancelled) setAudio(NO_AUDIO);
      });

    return () => {
      cancelled = true;
      audioService.stop(acquired);
    };
  }, [deviceName, connectionId]);

  return audio;
}
