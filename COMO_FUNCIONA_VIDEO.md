# 🎓 Cómo Funciona el Video en el Navegador

Guía técnica para entender cómo esta aplicación captura y muestra video de dispositivos de captura.

## 📚 Índice

1. [Conceptos Básicos](#conceptos-básicos)
2. [WebRTC y getUserMedia](#webrtc-y-getusermedia)
3. [Flujo de Trabajo](#flujo-de-trabajo)
4. [Código Explicado](#código-explicado)
5. [Limitaciones y Alternativas](#limitaciones-y-alternativas)

## Conceptos Básicos

### ¿Qué es WebRTC?

**WebRTC** (Web Real-Time Communication) es un conjunto de APIs que permiten comunicación en tiempo real en navegadores web.

**Componentes principales:**
- `getUserMedia()` - Acceso a cámara y micrófono
- `RTCPeerConnection` - Comunicación peer-to-peer (no usado aquí)
- `MediaStream` - Flujo de datos de audio/video

### ¿Qué es getUserMedia?

Es la API que permite acceder a dispositivos de entrada (cámaras, micrófonos) desde JavaScript.

```javascript
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
```

## WebRTC y getUserMedia

### 1. Solicitar Permisos

```javascript
// Solicitar acceso a video y audio
const stream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
});
```

**Lo que sucede:**
1. El navegador muestra un diálogo de permisos
2. El usuario debe aprobar el acceso
3. Si se aprueba, se retorna un `MediaStream`
4. Si se rechaza, se lanza una excepción

### 2. MediaStream

Un `MediaStream` es un objeto que contiene:
- **Video tracks**: Pistas de video (una o más)
- **Audio tracks**: Pistas de audio (una o más)

```javascript
const stream = await getUserMedia({ video: true, audio: true });

// Obtener las pistas
const videoTracks = stream.getVideoTracks();  // Array de video tracks
const audioTracks = stream.getAudioTracks();  // Array de audio tracks

console.log(videoTracks[0].label);  // "USB Video (534d:2109)"
```

### 3. Asignar al Elemento Video

```javascript
const videoElement = document.querySelector('video');
videoElement.srcObject = stream;  // Asignar el stream al video
videoElement.play();              // Reproducir
```

**Diferencia con video normal:**
- Video normal: `<video src="video.mp4">` (archivo)
- Stream: `<video srcObject={stream}>` (tiempo real)

### 4. Enumerar Dispositivos

```javascript
const devices = await navigator.mediaDevices.enumerateDevices();

// Tipos de dispositivos:
// - videoinput: Cámaras, capturadoras
// - audioinput: Micrófonos
// - audiooutput: Altavoces, auriculares

const cameras = devices.filter(d => d.kind === 'videoinput');
cameras.forEach(camera => {
  console.log(camera.label);     // "USB Video (534d:2109)"
  console.log(camera.deviceId);  // "45e45aae48f26943..."
});
```

### 5. Seleccionar Dispositivo Específico

```javascript
const stream = await getUserMedia({
  video: {
    deviceId: { exact: 'device-id-aqui' }
  }
});
```

## Flujo de Trabajo

### Diagrama del Flujo

```
Usuario abre la app
    ↓
Solicitar permisos (getUserMedia)
    ↓
Usuario aprueba
    ↓
Enumerar dispositivos (enumerateDevices)
    ↓
Mostrar lista de dispositivos
    ↓
Usuario selecciona dispositivo
    ↓
Consultar capacidades del dispositivo
    ↓
Solicitar stream con máxima calidad
    ↓
Asignar stream al elemento <video>
    ↓
Video se reproduce en tiempo real
```

### Código del Flujo Completo

```javascript
// 1. Solicitar permisos iniciales
await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

// 2. Enumerar dispositivos
const devices = await navigator.mediaDevices.enumerateDevices();
const videoDevices = devices.filter(d => d.kind === 'videoinput');

// 3. Usuario selecciona un dispositivo
const selectedDevice = videoDevices[1]; // Por ejemplo, el segundo

// 4. Obtener stream del dispositivo
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    deviceId: { exact: selectedDevice.deviceId },
    width: { ideal: 1920 },
    height: { ideal: 1080 }
  },
  audio: true
});

// 5. Asignar al elemento video
videoElement.srcObject = stream;
```

## Código Explicado

### Archivo: `src/hooks/useVideoDevices.js`

Este hook maneja toda la lógica de dispositivos de video.

#### Función: `getDevices()`

```javascript
const getDevices = async () => {
  try {
    // 1. Solicitar permisos
    await navigator.mediaDevices.getUserMedia({ 
      video: true,
      audio: true 
    });
    
    // 2. Obtener lista de dispositivos
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    // 3. Filtrar solo dispositivos de video
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    
    // 4. Guardar en estado
    setVideoDevices(videoDevices);
    
    // 5. Seleccionar el primero por defecto
    if (videoDevices.length > 0 && !selectedDevice) {
      setSelectedDevice(videoDevices[0]);
    }
  } catch (err) {
    setError("No se pudieron acceder a los dispositivos");
  }
};
```

**Qué hace:**
1. Solicita permisos al usuario
2. Obtiene todos los dispositivos de entrada
3. Filtra solo cámaras/capturadoras
4. Guarda la lista en el estado de React
5. Selecciona el primer dispositivo automáticamente

#### Función: `selectDevice()`

```javascript
const selectDevice = async (device) => {
  try {
    // 1. Detener stream anterior (si existe)
    if (videoRef.current && videoRef.current.srcObject) {
      const oldStream = videoRef.current.srcObject;
      oldStream.getTracks().forEach(track => track.stop());
    }

    // 2. Obtener un stream temporal para consultar capacidades
    const tempStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: device.deviceId } }
    });
    
    const videoTrack = tempStream.getVideoTracks()[0];
    const capabilities = videoTrack.getCapabilities();
    
    // 3. Determinar máxima resolución
    const maxResolution = {
      width: capabilities.width.max || 1920,
      height: capabilities.height.max || 1080,
      frameRate: capabilities.frameRate?.max || 60
    };
    
    // 4. Detener stream temporal
    tempStream.getTracks().forEach(track => track.stop());

    // 5. Solicitar stream con máxima calidad
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { 
        deviceId: { exact: device.deviceId },
        width: { exact: maxResolution.width },
        height: { exact: maxResolution.height },
        frameRate: { ideal: maxResolution.frameRate }
      },
      audio: {
        echoCancellation: false,  // Sin cancelación de eco
        noiseSuppression: false,  // Sin supresión de ruido
        autoGainControl: false    // Sin control automático de ganancia
      }
    });

    // 6. Asignar al elemento video
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
    }

    setSelectedDevice(device);
  } catch (err) {
    console.error("Error:", err);
  }
};
```

**Qué hace:**
1. **Limpia el stream anterior** para evitar fugas de memoria
2. **Consulta las capacidades** del dispositivo
3. **Detecta la máxima resolución** soportada
4. **Solicita un nuevo stream** con la mejor calidad posible
5. **Asigna el stream al video** para reproducción
6. **Configura el audio** sin procesamiento

### Restricciones (Constraints)

Las restricciones le dicen al navegador qué características quieres del stream.

#### Tipos de Restricciones

```javascript
{
  video: {
    deviceId: { exact: 'id' },      // Dispositivo específico
    width: { ideal: 1920 },         // Ancho preferido
    height: { ideal: 1080 },        // Alto preferido
    frameRate: { ideal: 60 },       // FPS preferidos
    aspectRatio: { ideal: 16/9 }    // Relación de aspecto
  }
}
```

#### Palabras Clave

- **`ideal`**: El navegador intenta cumplirlo, pero no falla si no puede
- **`exact`**: Debe cumplirse exactamente, falla si no es posible
- **`min`**: Valor mínimo aceptable
- **`max`**: Valor máximo aceptable

#### Ejemplo de Fallback

```javascript
try {
  // Intento 1: Resolución exacta
  stream = await getUserMedia({
    video: {
      width: { exact: 1920 },
      height: { exact: 1080 }
    }
  });
} catch (err) {
  // Intento 2: Resolución ideal (más flexible)
  stream = await getUserMedia({
    video: {
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    }
  });
}
```

### Capacidades del Dispositivo

```javascript
const capabilities = videoTrack.getCapabilities();

console.log(capabilities);
// {
//   width: { min: 640, max: 1920 },
//   height: { min: 480, max: 1080 },
//   frameRate: { min: 1, max: 30 },
//   aspectRatio: { min: 0.5, max: 2 },
//   facingMode: [],
//   resizeMode: ["none", "crop-and-scale"]
// }
```

**Qué nos dice:**
- Resolución mínima y máxima soportada
- FPS mínimo y máximo
- Relación de aspecto soportada

### Configuración del Stream

```javascript
const settings = videoTrack.getSettings();

console.log(settings);
// {
//   width: 1920,
//   height: 1080,
//   frameRate: 30,
//   aspectRatio: 1.7777777777777777,
//   deviceId: "45e45aae48f26943...",
//   groupId: "...",
//   facingMode: "environment"
// }
```

**Qué nos dice:**
- Configuración REAL que se está usando
- Puede ser diferente a lo solicitado

## Limitaciones y Alternativas

### Limitaciones de WebRTC

1. **Control Limitado**
   - No acceso a brillo, contraste, saturación
   - Depende de lo que el navegador expone
   - Puede no usar la máxima resolución

2. **Capa de Abstracción**
   - El navegador actúa como intermediario
   - Restricciones de seguridad
   - Estandarización entre navegadores

3. **Dependencia del Driver**
   - Si el driver no expone capacidades correctamente, WebRTC no puede acceder

### Alternativas Nativas

#### DirectShow (Windows)

```rust
// Código Rust hipotético
use windows::Media::Capture::*;

let devices = MediaCapture::find_all_video_devices()?;
let device = devices.get(0)?;

let capture = MediaCapture::new()?;
capture.initialize_with_settings(&settings)?;
capture.start_preview()?;
```

**Ventajas:**
- Control total sobre el dispositivo
- Acceso a todas las configuraciones
- Mejor rendimiento

**Desventajas:**
- Solo Windows
- Más complejo
- Requiere código nativo

#### FFmpeg

```bash
ffmpeg -f dshow -i video="USB Video" -f rawvideo pipe:1
```

**Ventajas:**
- Multiplataforma
- Muy potente
- Bien documentado

**Desventajas:**
- Requiere incluir FFmpeg (~50MB)
- Más complejo de integrar

## 🎯 Resumen

### Lo que hace esta aplicación:

1. **Solicita permisos** para acceder a cámaras/micrófonos
2. **Enumera dispositivos** disponibles
3. **Consulta capacidades** de cada dispositivo
4. **Solicita máxima calidad** disponible
5. **Reproduce en tiempo real** sin buffering
6. **Controla zoom y audio** desde la interfaz

### Tecnologías clave:

- **WebRTC getUserMedia**: Acceso a dispositivos
- **MediaStream**: Flujo de datos en tiempo real
- **MediaStreamTrack**: Control individual de pistas
- **Constraints**: Configuración de calidad
- **Capabilities**: Consulta de límites del dispositivo

### Por qué es útil:

- ✅ No requiere instalación de drivers adicionales
- ✅ Funciona en cualquier navegador moderno
- ✅ Multiplataforma (Windows, macOS, Linux)
- ✅ Latencia ultra baja
- ✅ Fácil de usar y mantener

---

**Recursos adicionales:**
- [MDN: getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [WebRTC Spec](https://www.w3.org/TR/webrtc/)
- [Media Capture and Streams](https://www.w3.org/TR/mediacapture-streams/)
