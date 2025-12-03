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

  const { videoDevices, selectedDevice, error, selectDevice } = useVideoDevices(videoRef);
  const { zoom, objectFit, setZoom, setObjectFit, toggleFullscreen, resetZoom } = useVideoControls(videoContainerRef);

  const handleSelectDevice = async (device) => {
    await selectDevice(device);
    setIsMenuOpen(false);
  };

  return (
    <main className="container mx-auto min-h-screen min-w-screen bg-linear-to-br from-gray-900 to-gray-800 relative">
      <MenuButton onClick={() => setIsMenuOpen(!isMenuOpen)} />
      
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
      />

      <VideoControls
        zoom={zoom}
        objectFit={objectFit}
        onZoomChange={setZoom}
        onObjectFitChange={setObjectFit}
        onReset={resetZoom}
        onToggleFullscreen={toggleFullscreen}
        isVisible={!!selectedDevice}
        videoRef={videoRef}
      />
    </main>
  );
}

export default App;
