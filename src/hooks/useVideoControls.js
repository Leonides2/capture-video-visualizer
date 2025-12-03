import { useState } from 'react';

export function useVideoControls(videoContainerRef) {
  const [zoom, setZoom] = useState(100);
  const [objectFit, setObjectFit] = useState('contain');

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await videoContainerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Error al cambiar pantalla completa:", err);
    }
  };

  const resetZoom = () => {
    setZoom(100);
    setObjectFit('contain');
  };

  return {
    zoom,
    objectFit,
    setZoom,
    setObjectFit,
    toggleFullscreen,
    resetZoom
  };
}
