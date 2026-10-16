// El video lo captura Rust; el audio todavía se obtiene con WebRTC (getUserMedia).

/** "USB Video (1234:abcd)" -> "USB Video" */
const stripQualifiers = (label) => label.replace(/\s*\([^)]*\)\s*/g, "").trim();

/** Busca la entrada de audio cuyo nombre se parece al del dispositivo de video. */
async function findAudioInputFor(videoLabel) {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoBase = stripQualifiers(videoLabel);

  return (
    devices
      .filter((d) => d.kind === "audioinput")
      .find((a) => a.label.includes(videoBase) || stripQualifiers(a.label) === videoBase) ?? null
  );
}

export const audioService = {
  /** @returns {Promise<MediaStream>} */
  async openDeviceAudio(videoLabel) {
    const match = await findAudioInputFor(videoLabel);
    console.log("Audio device emparejado (WebRTC):", match);

    // Sin coincidencia se usa la entrada por defecto del sistema (comportamiento heredado).
    return navigator.mediaDevices.getUserMedia({
      video: false,
      audio: match ? { deviceId: { exact: match.deviceId } } : true,
    });
  },

  /** @param {MediaStream|null} stream */
  stop(stream) {
    stream?.getTracks().forEach((track) => track.stop());
  },
};
