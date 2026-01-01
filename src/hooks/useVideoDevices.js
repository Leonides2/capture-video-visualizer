import { useState, useEffect } from 'react';

export function useVideoDevices(videoRef) {
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [error, setError] = useState(null);

  const getDevices = async () => {
    try {
      // Solicitar permisos de cámara y audio (sin restricciones estrictas)
      await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true 
      });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      console.log("Dispositivos de Video Encontrados:");
      videoDevices.forEach((device, index) => {
        console.log(`${index}: ${device.label} (ID: ${device.deviceId})`);
      });

      setVideoDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(videoDevices[0]);
      }
      setError(null);
    } catch (err) {
      console.error("Error al acceder a los dispositivos de video:", err);
      setError("No se pudieron acceder a los dispositivos de video. Verifica los permisos.");
    }
  };

  const selectDevice = async (device) => {
    try {
      // Detener el stream anterior si existe
      if (videoRef.current && videoRef.current.srcObject) {
        const oldStream = videoRef.current.srcObject;
        oldStream.getTracks().forEach(track => track.stop());
      }

      // Obtener las capacidades del dispositivo
      let stream = null;
      let maxResolution = null;

      try {
        // Primero obtener un stream temporal para consultar capacidades
        const tempStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: device.deviceId } }
        });
        
        const videoTrack = tempStream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities();
        
        console.log("Capacidades del dispositivo:", capabilities);
        
        // Detener el stream temporal
        tempStream.getTracks().forEach(track => track.stop());

        // Determinar la máxima resolución soportada
        if (capabilities.width && capabilities.height) {
          maxResolution = {
            width: capabilities.width.max || 1920,
            height: capabilities.height.max || 1080,
            frameRate: capabilities.frameRate?.max || 60
          };
          
          console.log(`Máxima resolución detectada: ${maxResolution.width}x${maxResolution.height} @ ${maxResolution.frameRate}fps`);
        }
      } catch (capError) {
        console.log("No se pudieron obtener capacidades, usando valores por defecto");
      }

      // Intentar con la máxima resolución detectada o valores ideales
      const constraints = {
        video: { 
          deviceId: { exact: device.deviceId },
          width: maxResolution ? { exact: maxResolution.width } : { ideal: 1920 },
          height: maxResolution ? { exact: maxResolution.height } : { ideal: 1080 },
          frameRate: maxResolution ? { ideal: maxResolution.frameRate } : { ideal: 60 }
        },
        audio: {
          deviceId: { exact: device.deviceId },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      };

      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (constraintError) {
        console.log("Restricciones máximas no soportadas, intentando con valores ideales");
        
        // Segundo intento con valores ideales sin exact
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              deviceId: { exact: device.deviceId },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 60 }
            },
            audio: {
              deviceId: { exact: device.deviceId },
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false
            }
          });
        } catch (idealError) {
          console.log("Valores ideales no soportados, intentando sin restricciones de audio específico");
          
          // Tercer intento sin deviceId de audio (algunas capturadoras no tienen audio)
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: device.deviceId } },
              audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
              }
            });
          } catch (audioError) {
            console.log("Audio no disponible, intentando solo video");
            
            // Último intento: solo video sin audio
            stream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: device.deviceId } }
            });
          }
        }
      }

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = false;
        videoRef.current.volume = 1.0;

        // Mostrar la resolución real obtenida
        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        console.log(`✅ Resolución final: ${settings.width}x${settings.height} @ ${settings.frameRate}fps`);
        
        // Mostrar información de audio
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
          const audioTrack = audioTracks[0];
          const audioSettings = audioTrack.getSettings();
          console.log(`🔊 Audio disponible - Dispositivo: ${audioTrack.label}`);
          console.log("Configuración de audio:", audioSettings);
        } else {
          console.log("⚠️ Sin audio disponible en este dispositivo");
        }
        
        // Mostrar información adicional
        console.log("Configuración completa del video:", settings);
      }

      setSelectedDevice(device);
      setError(null);
    } catch (err) {
      console.error("Error al seleccionar dispositivo:", err);
      setError(`Error al acceder al dispositivo: ${device.label}`);
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
    selectDevice,
    reconnectDevice,
    refreshDevices: getDevices
  };
}
