# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [0.1.0] - 2025-12-02

### ✨ Agregado
- Visualización en tiempo real de capturadoras de video y cámaras
- Menú desplegable para seleccionar dispositivos de video
- Controles de zoom (50% - 200%)
- Tres modos de ajuste de video:
  - **Ajustar**: Mantiene aspect ratio con barras negras
  - **Llenar**: Cubre pantalla sin deformar
  - **Estirar**: Estira al 100% de la pantalla
- Control de audio con:
  - Slider de volumen (0% - 100%)
  - Botón de mute/unmute
  - Iconos visuales dinámicos
- Botón de pantalla completa
- Detección inteligente de capacidades del dispositivo
- Sistema de fallback de 3 niveles para máxima compatibilidad:
  1. Intenta con máxima resolución detectada (exact)
  2. Intenta con valores ideales (ideal)
  3. Usa configuración automática del dispositivo
- Interfaz moderna con TailwindCSS
- Arquitectura modular con componentes y hooks separados

### 🔧 Técnico
- Implementación con Tauri 2.0 + React 19.1
- WebRTC getUserMedia API para captura de video/audio
- Consulta de capacidades del dispositivo con `getCapabilities()`
- Audio sin procesamiento (echoCancellation, noiseSuppression, autoGainControl desactivados)
- Gestión correcta de streams para evitar fugas de memoria
- Logging detallado en consola para debugging

### 📚 Documentación
- README completo con guía de uso
- COMPILACION.md con instrucciones detalladas para Windows
- COMO_FUNCIONA_VIDEO.md explicando conceptos técnicos de WebRTC
- Comentarios en código para facilitar mantenimiento

### 🔒 Seguridad
- Análisis con Snyk: 0 vulnerabilidades detectadas
- Permisos correctamente configurados en Tauri
- Solicitud de permisos de usuario para cámara/micrófono

## [Unreleased]

### 🚀 Planeado para futuras versiones
- Soporte para múltiples monitores
- Configuraciones guardadas por dispositivo
- Temas (claro/oscuro)
- Atajos de teclado
- Overlays personalizables
- Soporte para Linux y macOS

---

## Tipos de Cambios

- **Agregado**: Para nuevas funcionalidades
- **Cambiado**: Para cambios en funcionalidades existentes
- **Deprecado**: Para funcionalidades que serán removidas
- **Removido**: Para funcionalidades removidas
- **Corregido**: Para corrección de bugs
- **Seguridad**: Para vulnerabilidades de seguridad
