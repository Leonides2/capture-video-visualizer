import { useState } from "react";

export default function VideoControls({
  zoom,
  objectFit,
  onZoomChange,
  onObjectFitChange,
  onReset,
  onToggleFullscreen,
  isVisible,
  videoRef,
  onReconnect
}) {
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  if (!isVisible) return null;

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (videoRef?.current) {
      videoRef.current.volume = newVolume / 100;
      if (newVolume === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef?.current) {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      videoRef.current.muted = newMutedState;
    }
  };

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      await onReconnect();
    } finally {
      setIsReconnecting(false);
    }
  };

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg max-w-[95vw]">
      <div className="flex items-center gap-4 flex-wrap justify-center">
        {/* Control de Zoom */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onZoomChange(Math.max(50, zoom - 10))}
            className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-sm transition-colors"
            aria-label="Reducir zoom"
          >
            −
          </button>
          <input
            type="range"
            min="50"
            max="200"
            value={zoom}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            aria-label="Control de zoom"
          />
          <button
            onClick={() => onZoomChange(Math.min(200, zoom + 10))}
            className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-sm transition-colors"
            aria-label="Aumentar zoom"
          >
            +
          </button>
          <span className="text-white text-sm min-w-12">{zoom}%</span>
        </div>

        {/* Separador */}
        <div className="h-6 w-px bg-gray-600"></div>

        {/* Modo de Ajuste */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onObjectFitChange('contain')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              objectFit === 'contain'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            Ajustar
          </button>
          <button
            onClick={() => onObjectFitChange('cover')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              objectFit === 'cover'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            Llenar
          </button>
          <button
            onClick={() => onObjectFitChange('fill')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              objectFit === 'fill'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            Estirar
          </button>
        </div>

        {/* Separador */}
        <div className="h-6 w-px bg-gray-600"></div>

        {/* Botones de Acción */}
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
            title="Reiniciar zoom y modo de ajuste"
          >
            Reiniciar
          </button>
          <button
            onClick={handleReconnect}
            disabled={isReconnecting}
            className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${
              isReconnecting
                ? 'bg-yellow-600 text-white cursor-wait'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
            title="Reiniciar conexión con el dispositivo seleccionado"
          >
            {isReconnecting ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Reconectando...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="currentColor">
                  <path d="M480-120q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T120-480h-60l90-90 90 90H120q0 125 87.5 212.5T480-60q125 0 212.5-87.5T780-360h60q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Zm0-240q-100 0-170-70t-70-170q0-100 70-170t170-70q100 0 170 70t70 170q0 100-70 170t-170 70Z"/>
                </svg>
                Reconectar
              </>
            )}
          </button>
          <button
            onClick={onToggleFullscreen}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Pantalla Completa
          </button>
        </div>

        {/* Separador */}
        <div className="h-6 w-px bg-gray-600"></div>

        {/* Control de Audio */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-sm transition-colors"
            aria-label={isMuted ? "Activar audio" : "Silenciar"}
          >
            {isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor">
                <path d="M792-56 671-177q-25 16-53 27.5T560-131v-82q14-5 27.5-10t25.5-12L480-368v208L280-360H120v-240h128L56-792l56-56 736 736-56 56Zm-8-232-58-58q17-31 25.5-65t8.5-70q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 53-14.5 102T784-288ZM650-422l-90-90v-130q47 22 73.5 66t26.5 96q0 15-2.5 29.5T650-422ZM480-592 376-696l104-104v208Zm-80 238v-94l-72-72H200v80h114l86 86Zm-36-130Z"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor">
                <path d="M560-131v-82q90-26 145-100t55-168q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 127-78 224.5T560-131ZM120-360v-240h160l200-200v640L280-360H120Zm440 40v-322q47 22 73.5 66t26.5 96q0 51-26.5 94.5T560-320ZM400-606l-86 86H200v80h114l86 86v-252ZM300-480Z"/>
              </svg>
            )}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            aria-label="Control de volumen"
          />
          <span className="text-white text-sm min-w-10">{isMuted ? 0 : volume}%</span>
        </div>
      </div>
    </div>
  );
}
