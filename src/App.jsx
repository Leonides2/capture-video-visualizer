import { useState } from "react";
import "./App.css";
import ControlBar from "@/components/controls/ControlBar";
import DeviceMenu from "@/components/devices/DeviceMenu";
import MenuButton from "@/components/devices/MenuButton";
import AudioOutput from "@/components/player/AudioOutput";
import CaptureStatsOverlay from "@/components/player/CaptureStatsOverlay";
import VideoStage from "@/components/player/VideoStage";
import CaptureErrorBanner from "@/components/session/CaptureErrorBanner";
import SessionActions from "@/components/session/SessionActions";
import { useAutoConnect } from "@/hooks/useAutoConnect";
import { useCaptureEvents } from "@/hooks/useCaptureEvents";
import { useDeviceAudio } from "@/hooks/useDeviceAudio";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useSessionStore } from "@/stores/sessionStore";

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fullscreen = useFullscreen();

  const deviceName = useSessionStore((s) => s.device?.name);
  const connectionId = useSessionStore((s) => s.connectionId);
  const audio = useDeviceAudio(deviceName, connectionId);

  useAutoConnect();
  useCaptureEvents();

  return (
    <main className="container mx-auto min-h-screen min-w-screen bg-linear-to-br from-gray-900 to-gray-800 relative">
      <MenuButton isOpen={isMenuOpen} onClick={() => setIsMenuOpen((open) => !open)} />
      {isMenuOpen && <DeviceMenu onClose={() => setIsMenuOpen(false)} />}
      <SessionActions />
      <CaptureErrorBanner />
      <CaptureStatsOverlay />

      <VideoStage ref={fullscreen.ref} />
      <AudioOutput stream={audio.stream} />

      <ControlBar hasAudio={audio.hasAudio} onToggleFullscreen={fullscreen.toggle} />
    </main>
  );
}

export default App;
