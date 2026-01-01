# 🎥 Capture Video Visualizer

Un visualizador de video ligero y rápido para capturadoras de video, cámaras web y dispositivos de captura HDMI. Alternativa minimalista a OBS para cuando solo necesitas ver el video de tu capturadora.

![Tauri](https://img.shields.io/badge/Tauri-2.0-blue)
![React](https://img.shields.io/badge/React-19.1-61dafb)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-38bdf8)

## ✨ Características

- 🎮 **Visualización en tiempo real** de capturadoras de video y cámaras
- 🎛️ **Controles de zoom** (50% - 200%)
- 📐 **Modos de ajuste**: Ajustar, Llenar, Estirar
- 🔊 **Control de audio** con volumen y mute
- 🖥️ **Pantalla completa**
- ⚡ **Latencia ultra baja** - Acceso directo al stream sin procesamiento
- 🪶 **Ligero** - No requiere OBS en segundo plano
- 🎯 **Detección inteligente** de máxima resolución disponible

## 🎯 Casos de Uso

- Monitoreo de consolas de videojuegos (PS5, Xbox, Switch)
- Vista previa de cámaras HDMI
- Testing de equipos de captura
- Visualización de segunda PC
- Alternativa ligera a OBS para solo visualización

## 🚀 Inicio Rápido

### Prerrequisitos

- [Node.js](https://nodejs.org/) (v18 o superior)
- [Bun](https://bun.sh/) o npm
- [Rust](https://www.rust-lang.org/) (para compilar Tauri)

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/capture-video-visualizer.git
cd capture-video-visualizer

# Instalar dependencias
bun install
# o con npm
npm install

# Ejecutar en modo desarrollo
bun run tauri dev
# o con npm
npm run tauri dev
```

## 📦 Compilar para Windows

### Compilación de Producción

```bash
# Compilar la aplicación
bun run tauri build
# o con npm
npm run tauri build
```

El ejecutable se generará en:
```
src-tauri/target/release/capture-video-visualizer.exe
```

El instalador se generará en:
```
src-tauri/target/release/bundle/msi/capture-video-visualizer_0.1.0_x64_en-US.msi
src-tauri/target/release/bundle/nsis/capture-video-visualizer_0.1.0_x64-setup.exe
```

### Opciones de Distribución

**Instalador MSI** (Recomendado para empresas):
```
src-tauri/target/release/bundle/msi/
```

**Instalador NSIS** (Recomendado para usuarios finales):
```
src-tauri/target/release/bundle/nsis/
```

**Ejecutable Portable**:
```
src-tauri/target/release/capture-video-visualizer.exe
```

## 🎮 Cómo Usar

1. **Iniciar la aplicación**
2. **Permitir permisos** de cámara y micrófono cuando se solicite
3. **Hacer clic en el menú** (≡) en la esquina superior izquierda
4. **Seleccionar tu dispositivo** de video (capturadora, cámara, etc.)
5. **Ajustar controles** según necesites:
   - **Zoom**: Ampliar/reducir el video
   - **Modo de Ajuste**: Cómo se adapta el video a la pantalla
   - **Volumen**: Controlar el audio
   - **Pantalla Completa**: Maximizar la visualización

## 🛠️ Tecnologías Utilizadas

- **[Tauri](https://tauri.app/)** - Framework para aplicaciones de escritorio
- **[React](https://react.dev/)** - Biblioteca de UI
- **[Vite](https://vitejs.dev/)** - Build tool y dev server
- **[TailwindCSS](https://tailwindcss.com/)** - Framework de CSS
- **[WebRTC getUserMedia API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)** - Captura de video/audio

## 📁 Estructura del Proyecto

```
capture-video-visualizer/
├── src/
│   ├── components/          # Componentes React
│   │   ├── MenuButton.jsx   # Botón del menú
│   │   ├── DeviceMenu.jsx   # Menú de dispositivos
│   │   ├── VideoPlayer.jsx  # Reproductor de video
│   │   └── VideoControls.jsx # Controles de zoom/audio
│   ├── hooks/               # Custom React hooks
│   │   ├── useVideoDevices.js  # Lógica de dispositivos
│   │   └── useVideoControls.js # Lógica de controles
│   ├── App.jsx             # Componente principal
│   ├── App.css             # Estilos globales
│   └── main.jsx            # Punto de entrada
├── src-tauri/              # Backend de Tauri (Rust)
│   ├── src/
│   │   └── lib.rs          # Código Rust
│   ├── tauri.conf.json     # Configuración de Tauri
│   └── Cargo.toml          # Dependencias de Rust
├── public/                 # Archivos estáticos
├── package.json            # Dependencias de Node
└── vite.config.js          # Configuración de Vite
```

## 🎓 Conceptos Técnicos (Para Desarrolladores)

### Cómo Funciona la Captura de Video en el Navegador

#### **1. WebRTC getUserMedia API**
```javascript
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
```
- API estándar del navegador para acceder a cámaras y micrófonos
- Funciona en Chrome, Firefox, Edge, Safari
- Requiere permisos del usuario (por seguridad)

#### **2. MediaStream**
```javascript
const stream = await getUserMedia({ video: {...} });
videoElement.srcObject = stream;
```
- Objeto que contiene pistas (tracks) de video y audio
- Se asigna directamente al elemento `<video>`
- Reproducción en tiempo real sin buffering

#### **3. Detección de Dispositivos**
```javascript
const devices = await navigator.mediaDevices.enumerateDevices();
const videoDevices = devices.filter(d => d.kind === 'videoinput');
```
- Lista todos los dispositivos de entrada disponibles
- Filtra por tipo: `videoinput`, `audioinput`, `audiooutput`

#### **4. Consulta de Capacidades**
```javascript
const capabilities = videoTrack.getCapabilities();
// Retorna: { width: { min, max }, height: { min, max }, frameRate: { min, max } }
```
- Obtiene las capacidades reales del dispositivo
- Permite solicitar la máxima resolución disponible

#### **5. Restricciones (Constraints)**
```javascript
{
  video: {
    deviceId: { exact: 'device-id' },
    width: { ideal: 1920 },      // Valor preferido
    height: { ideal: 1080 },
    frameRate: { ideal: 60 }
  }
}
```
- **`ideal`**: El navegador intenta cumplirlo, pero no falla si no puede
- **`exact`**: Debe cumplirse exactamente, falla si no es posible
- **`min/max`**: Rangos aceptables

#### **6. Sistema de Fallback Implementado**
```javascript
// Intento 1: Máxima resolución detectada con exact
{ width: { exact: 1920 }, height: { exact: 1080 } }

// Intento 2: Valores ideales (si falla el anterior)
{ width: { ideal: 1920 }, height: { ideal: 1080 } }

// Intento 3: Automático (sin restricciones)
{ video: true }
```

### Diferencias con OBS

| Aspecto | Esta App (WebRTC) | OBS (DirectShow) |
|---------|-------------------|------------------|
| **API** | WebRTC getUserMedia | DirectShow (Windows) |
| **Acceso** | A través del navegador | Directo al driver |
| **Control** | Limitado por el navegador | Total sobre el dispositivo |
| **Configuración** | Resolución, FPS | Resolución, FPS, brillo, contraste, etc. |
| **Plataforma** | Multiplataforma | Específico por OS |
| **Complejidad** | Baja (JavaScript) | Alta (C++/Rust nativo) |

### Por Qué WebRTC Puede Tener Limitaciones

1. **Capa de Abstracción**: El navegador actúa como intermediario
2. **Seguridad**: Restricciones por privacidad del usuario
3. **Estandarización**: Debe funcionar igual en todos los navegadores
4. **Drivers**: Depende de cómo el driver expone las capacidades

## 🔧 Configuración Avanzada

### Cambiar Resolución Predeterminada

Edita `src/hooks/useVideoDevices.js`:

```javascript
// Línea ~79-81
width: maxResolution ? { exact: maxResolution.width } : { ideal: 1920 },
height: maxResolution ? { exact: maxResolution.height } : { ideal: 1080 },
frameRate: maxResolution ? { ideal: maxResolution.frameRate } : { ideal: 60 }
```

### Personalizar Controles

Los componentes están en `src/components/` y son fácilmente modificables.

## 🐛 Troubleshooting

### No aparecen dispositivos
- Verifica que hayas permitido acceso a cámara/micrófono
- Revisa la configuración de privacidad de Windows

### Video borroso
- Abre la consola (F12) y verifica la resolución obtenida
- Tu capturadora puede no soportar alta resolución
- Prueba diferentes modos de ajuste

### Sin audio
- Verifica que el volumen no esté en 0%
- Asegúrate de que no esté en mute
- Algunas capturadoras tienen audio separado

### Error al compilar
- Asegúrate de tener Rust instalado: `rustc --version`
- Actualiza las dependencias: `bun install`
- Limpia y recompila: `bun run tauri build --clean`

## 📝 Licencia

MIT License - Siéntete libre de usar, modificar y distribuir.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 👨‍💻 Autor

Desarrollado con ❤️ usando Tauri + React

---

**Nota**: Esta aplicación usa WebRTC para acceso a dispositivos de video. Para control avanzado similar a OBS (brillo, contraste, etc.), se requeriría implementar plugins nativos con DirectShow (Windows), AVFoundation (macOS) o V4L2 (Linux).


> [!IMPORTANT]
> Es proyecto fue creado usando vibecoding. Tiene mucho potencial de mejora y solo fue creado como herramienta rapida para visualizar un capturadora de video.
