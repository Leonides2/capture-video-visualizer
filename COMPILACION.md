# 📦 Guía de Compilación para Windows

Esta guía te ayudará a compilar la aplicación Capture Video Visualizer para Windows y preparar los archivos para distribución en GitHub.

## 🔧 Prerrequisitos

### 1. Instalar Rust

```bash
# Descargar e instalar desde: https://rustup.rs/
# O ejecutar en PowerShell:
winget install Rustlang.Rustup
```

Verifica la instalación:
```bash
rustc --version
cargo --version
```

### 2. Instalar Node.js

```bash
# Descargar desde: https://nodejs.org/
# O con winget:
winget install OpenJS.NodeJS
```

### 3. Instalar Bun (Opcional, pero recomendado)

```bash
# En PowerShell:
powershell -c "irm bun.sh/install.ps1|iex"
```

O usa npm si prefieres.

### 4. Instalar Dependencias de Tauri

```bash
# WebView2 (generalmente ya viene con Windows 11)
# Si no lo tienes:
winget install Microsoft.EdgeWebView2Runtime
```

## 🚀 Proceso de Compilación

### Paso 1: Clonar e Instalar Dependencias

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/capture-video-visualizer.git
cd capture-video-visualizer

# Instalar dependencias
bun install
# o con npm
npm install
```

### Paso 2: Compilar la Aplicación

```bash
# Compilación de producción
bun run tauri build

# O con npm
npm run tauri build
```

**Tiempo estimado**: 5-10 minutos en la primera compilación (Rust compila muchas dependencias).

### Paso 3: Ubicar los Archivos Compilados

Después de la compilación exitosa, encontrarás:

#### **Ejecutable Portable**
```
src-tauri\target\release\capture-video-visualizer.exe
```
- Tamaño: ~8-12 MB
- No requiere instalación
- Ideal para distribución rápida

#### **Instalador NSIS** (Recomendado)
```
src-tauri\target\release\bundle\nsis\capture-video-visualizer_0.1.0_x64-setup.exe
```
- Instalador completo con desinstalador
- Crea accesos directos
- Mejor experiencia de usuario

#### **Instalador MSI**
```
src-tauri\target\release\bundle\msi\capture-video-visualizer_0.1.0_x64_en-US.msi
```
- Para entornos empresariales
- Compatible con Group Policy
- Instalación silenciosa

## 📤 Preparar para GitHub Release

### Paso 1: Crear un Release en GitHub

1. Ve a tu repositorio en GitHub
2. Click en "Releases" → "Create a new release"
3. Crea un tag (ej: `v0.1.0`)
4. Título: "Capture Video Visualizer v0.1.0"

### Paso 2: Subir los Archivos

Sube estos archivos al release:

```
✅ capture-video-visualizer_0.1.0_x64-setup.exe  (Instalador NSIS)
✅ capture-video-visualizer_0.1.0_x64_en-US.msi  (Instalador MSI)
✅ capture-video-visualizer.exe                   (Ejecutable portable)
```

### Paso 3: Descripción del Release

```markdown
## 🎥 Capture Video Visualizer v0.1.0

Visualizador ligero de capturadoras de video y cámaras.

### ✨ Características
- Visualización en tiempo real
- Controles de zoom (50%-200%)
- Modos de ajuste: Ajustar, Llenar, Estirar
- Control de audio con volumen y mute
- Pantalla completa
- Detección inteligente de resolución

### 📥 Descargas

**Para usuarios normales:**
- `capture-video-visualizer_0.1.0_x64-setup.exe` - Instalador recomendado

**Para uso portable:**
- `capture-video-visualizer.exe` - No requiere instalación

**Para empresas:**
- `capture-video-visualizer_0.1.0_x64_en-US.msi` - Instalador MSI

### 📋 Requisitos
- Windows 10/11 (64-bit)
- WebView2 Runtime (incluido en Windows 11)

### 🐛 Problemas Conocidos
Ninguno por el momento.
```

## 🔄 Compilación Incremental

Para compilaciones posteriores (mucho más rápidas):

```bash
# Limpiar compilación anterior (opcional)
bun run tauri build --clean

# Compilación normal
bun run tauri build
```

## 🐛 Solución de Problemas

### Error: "Rust not found"
```bash
# Reinicia tu terminal después de instalar Rust
# O agrega Rust al PATH manualmente
```

### Error: "WebView2 not found"
```bash
# Instala WebView2 Runtime
winget install Microsoft.EdgeWebView2Runtime
```

### Error: "NSIS not found"
```bash
# Tauri descargará NSIS automáticamente
# Si falla, instala manualmente desde: https://nsis.sourceforge.io/
```

### Error de compilación de Rust
```bash
# Actualiza Rust
rustup update

# Limpia y recompila
cd src-tauri
cargo clean
cd ..
bun run tauri build
```

### Compilación muy lenta
```bash
# Primera compilación es lenta (5-10 min)
# Compilaciones posteriores son mucho más rápidas (1-2 min)

# Para acelerar, usa compilación en paralelo:
# Edita src-tauri/.cargo/config.toml y agrega:
[build]
jobs = 4  # Número de núcleos de CPU
```

## 📊 Tamaños de Archivo

| Archivo | Tamaño Aproximado |
|---------|-------------------|
| Ejecutable (.exe) | 8-12 MB |
| Instalador NSIS | 10-15 MB |
| Instalador MSI | 12-18 MB |

## 🔐 Firma de Código (Opcional)

Para distribución profesional, considera firmar tus ejecutables:

```bash
# Requiere un certificado de firma de código
# Información: https://tauri.app/v1/guides/distribution/sign-windows
```

## 📝 Checklist Pre-Release

- [ ] Compilación exitosa sin errores
- [ ] Probado en Windows 10 y 11
- [ ] Verificado que el instalador funciona
- [ ] Verificado que el ejecutable portable funciona
- [ ] Actualizado el número de versión en `src-tauri/tauri.conf.json`
- [ ] Actualizado el CHANGELOG (si existe)
- [ ] Creado el tag de Git
- [ ] Subidos todos los archivos al release
- [ ] Descripción del release completa

## 🎯 Automatización con GitHub Actions (Futuro)

Para automatizar la compilación, puedes crear `.github/workflows/build.yml`:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - uses: dtolnay/rust-toolchain@stable
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run tauri build
      
      - name: Upload Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            src-tauri/target/release/bundle/nsis/*.exe
            src-tauri/target/release/bundle/msi/*.msi
```

## 💡 Tips

1. **Primera compilación**: Toma tiempo, sé paciente
2. **Compilaciones posteriores**: Mucho más rápidas
3. **Limpia solo si es necesario**: `cargo clean` borra todo
4. **Prueba antes de distribuir**: Siempre prueba en una máquina limpia
5. **Versiona correctamente**: Usa semantic versioning (x.y.z)

---

¿Problemas? Abre un issue en GitHub o consulta la [documentación de Tauri](https://tauri.app/).
