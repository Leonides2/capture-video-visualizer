import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function useVideoDevices(videoRef) {
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [error, setError] = useState(null);
  const [hasAudio, setHasAudio] = useState(true);
  const [isNativeStream, setIsNativeStream] = useState(false);
  const [cameraFormats, setCameraFormats] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [streamKey, setStreamKey] = useState(Date.now());

  const getDevices = async () => {
    try {
      console.log("Solicitando dispositivos desde Rust Nokhwa...");
      const devices = await invoke('get_video_devices');

      console.log("Dispositivos de Video Nativos Encontrados:", devices);
      // Mapear al mismo formato que usábamos en web para mantener compatibilidad UI
      const mappedDevices = devices.map(d => ({
        deviceId: d.id.toString(), // en Rust pasamos id numérico
        label: d.name,
        groupId: d.description, // lo reusamos por si acaso
        kind: 'videoinput'
      }));

      setVideoDevices(mappedDevices);
      if (mappedDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(mappedDevices[0]);
      }
      setError(null);
    } catch (err) {
      console.error("Error al obtener dispositivos desde Rust:", err);
      setError("No se pudieron acceder a los dispositivos de video mediante Rust.");
    }
  };

  const selectDevice = async (device) => {
    try {
      if (!device) {
        if (isNativeStream) {
          try {
            await invoke('stop_video_stream');
          } catch (e) {
            console.error("Error stopping native stream:", e);
          }
        }
        if (videoRef.current && videoRef.current.srcObject) {
          const oldStream = videoRef.current.srcObject;
          oldStream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
        setSelectedDevice(null);
        setIsNativeStream(false);
        setCameraFormats([]);
        setSelectedFormat(null);
        return;
      }

      console.log("Iniciando stream nativo para:", device.label);

      // Detener stream anterior de WebRTC si hubiera quedado abierto
      if (videoRef.current && videoRef.current.srcObject) {
        const oldStream = videoRef.current.srcObject;
        oldStream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }

      // Iniciar el stream en Rust obteniendo primero los formatos
      const cameraId = parseInt(device.deviceId, 10);

      let formats = [];
      try {
        formats = await invoke('get_camera_formats', { cameraId });
        console.log("Formatos compatibles:", formats);
      } catch (fmtErr) {
        console.warn("No se pudieron obtener formatos, usando default:", fmtErr);
      }

      setCameraFormats(formats);
      const defaultFormat = formats.length > 0 ? formats[0] : { width: 1280, height: 720, fps: 30 };
      setSelectedFormat(defaultFormat);

      await invoke('start_video_stream', {
        cameraId,
        width: defaultFormat.width,
        height: defaultFormat.height,
        fps: defaultFormat.fps
      });

      // --- RECUPERAR AUDIO MEDIANTE WEBRTC ---
      // Buscamos un dispositivo de audio que coincida con la capturadora
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(d => d.kind === 'audioinput');

      let matchedAudioDevice = null;
      if (device.groupId) {
        matchedAudioDevice = audioInputs.find(a => a.groupId === device.groupId);
      }

      if (!matchedAudioDevice) {
        // Fallback heurístico por similitud de nombre (ej: "USB Video Device" -> "USB Audio Device")
        const videoLabelBase = device.label.replace(/\s*\([^)]*\)\s*/g, '').trim();
        matchedAudioDevice = audioInputs.find(a => {
          const audioLabelBase = a.label.replace(/\s*\([^)]*\)\s*/g, '').trim();
          return a.label.includes(videoLabelBase) || audioLabelBase === videoLabelBase;
        });
      }

      console.log("Audio device emparejado (WebRTC):", matchedAudioDevice);

      try {
        const audioConstraints = {
          video: false, // El video se encarga Rust nativo
          audio: matchedAudioDevice ? { deviceId: { exact: matchedAudioDevice.deviceId } } : true,
        };
        const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasAudio(stream.getAudioTracks().length > 0);
      } catch (audioErr) {
        console.warn("No se pudo iniciar el audio WebRTC:", audioErr);
        setHasAudio(false);
      }

      setIsNativeStream(true);
      setStreamKey(Date.now());

      setSelectedDevice(device);
      setError(null);
    } catch (err) {
      console.error("Error al seleccionar dispositivo nativo:", err);
      setError(`Error al iniciar la capturadora en Rust: ${device.label}`);
    }
  };

  const changeFormat = async (format) => {
    if (!selectedDevice) return;
    try {
      console.log("Cambiando formato a:", format);
      const cameraId = parseInt(selectedDevice.deviceId, 10);
      await invoke('start_video_stream', {
        cameraId,
        width: format.width,
        height: format.height,
        fps: format.fps
      });
      setSelectedFormat(format);
      setStreamKey(Date.now());
    } catch (err) {
      console.error("Error cambiando el formato:", err);
      setError("Error al aplicar el nuevo formato de resolución.");
    }
  };

  const reconnectDevice = async () => {
    if (selectedDevice) {
      console.log(`🔄 Reiniciando conexión con: ${selectedDevice.label}`);
      await selectDevice(selectedDevice);
    }
  };

  useEffect(() => {
    getDevices();
  }, []);

  return {
    videoDevices,
    selectedDevice,
    error,
    hasAudio,
    isNativeStream,
    streamKey,
    cameraFormats,
    selectedFormat,
    selectDevice,
    changeFormat,
    reconnectDevice,
    refreshDevices: getDevices
  };
}
