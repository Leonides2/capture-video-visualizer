import { useState, useRef } from "react";
import "./App.css";
import MenuButton from "./components/MenuButton";
import DeviceMenu from "./components/DeviceMenu";
import VideoPlayer from "./components/VideoPlayer";
import VideoControls from "./components/VideoControls";
import { useVideoDevices } from "./hooks/useVideoDevices";
import { useVideoControls } from "./hooks/useVideoControls";

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);

  const { videoDevices, selectedDevice, error, hasAudio, isNativeStream, streamKey, cameraFormats, selectedFormat, selectDevice, changeFormat, reconnectDevice } = useVideoDevices(videoRef);
  const { zoom, objectFit, setZoom, setObjectFit, toggleFullscreen, resetZoom } = useVideoControls(videoContainerRef);

  const handleSelectDevice = async (device) => {
    await selectDevice(device);
    setIsMenuOpen(false);
  };

  return (
    <main className="container mx-auto min-h-screen min-w-screen bg-linear-to-br from-gray-900 to-gray-800 relative">
      <MenuButton onClick={() => setIsMenuOpen(!isMenuOpen)} />

      {selectedDevice && (
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <button
            onClick={() => selectDevice(null)}
            className="bg-gray-800 hover:bg-gray-700 border border-red-900/50 text-red-500 hover:text-red-400 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all active:scale-95 text-sm font-medium"
            title="Apagar transmisión"
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor">
              <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480h80q0 66 25 124.5t68.5 102.5q43.5 44 102 69T480-160q66 0 124.5-25t102.5-69q44-43.5 69-102T800-480q0-66-25-124.5t-69-102.5q-44-44-102.5-69T480-800v-80q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-40-360v-400h80v400h-80Z" />
            </svg>
            Apagar
          </button>

          <button
            onClick={reconnectDevice}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-xl border border-red-500 flex items-center gap-2 transition-transform active:scale-95 text-sm"
            title="Forzar reinicio de hardware (útil si la imagen se congela)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor">
              <path d="M480-120q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T120-480h-60l90-90 90 90H120q0 125 87.5 212.5T480-60q125 0 212.5-87.5T780-360h60q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Zm0-240q-100 0-170-70t-70-170q0-100 70-170t170-70q100 0 170 70t70 170q0 100-70 170t-170 70Z" />
            </svg>
            Reconectar
          </button>
        </div>
      )}

      <DeviceMenu
        isOpen={isMenuOpen}
        devices={videoDevices}
        selectedDevice={selectedDevice}
        error={error}
        onSelectDevice={handleSelectDevice}
      />

      <VideoPlayer
        ref={videoRef}
        containerRef={videoContainerRef}
        selectedDevice={selectedDevice}
        zoom={zoom}
        objectFit={objectFit}
        isNativeStream={isNativeStream}
        streamKey={streamKey}
      />

      <VideoControls
        zoom={zoom}
        objectFit={objectFit}
        onZoomChange={setZoom}
        onObjectFitChange={setObjectFit}
        onReset={resetZoom}
        onToggleFullscreen={toggleFullscreen}
        isVisible={selectedDevice !== null}
        videoRef={videoRef}
        onReconnect={reconnectDevice}
        hasAudio={hasAudio}
        cameraFormats={cameraFormats}
        selectedFormat={selectedFormat}
        onFormatChange={changeFormat}
      />
    </main>
  );
}

export default App;
