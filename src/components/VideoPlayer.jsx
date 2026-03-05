import { forwardRef } from "react";

const VideoPlayer = forwardRef(({
  selectedDevice,
  zoom,
  objectFit,
  isNativeStream,
  streamKey,
  containerRef
}, videoRef) => {
  return (
    <div
      ref={containerRef}
      className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black z-10 overflow-hidden"
    >
      {selectedDevice ? (
        <>
          {/* Rust Native MJPEG Stream */}
          {isNativeStream && (
            <img
              key={streamKey}
              className="transition-all duration-200"
              src={`http://127.0.0.1:18342/stream?t=${streamKey}`}
              alt="Capture stream"
              style={{
                objectFit: objectFit,
                transform: `scale(${zoom / 100})`,
                width: objectFit === 'fill' ? '100%' : 'auto',
                height: objectFit === 'fill' ? '100%' : 'auto',
                maxWidth: objectFit !== 'fill' ? '100%' : 'none',
                maxHeight: objectFit !== 'fill' ? '100%' : 'none',
                imageRendering: 'crisp-edges',
                position: 'absolute',
                zIndex: 2,
              }}
            />
          )}

          {/* WebRTC Stream (Fallback de Video puro o Audio en segundo plano) */}
          <video
            ref={videoRef}
            className="transition-all duration-200"
            style={{
              objectFit: objectFit,
              transform: `scale(${zoom / 100})`,
              width: objectFit === 'fill' ? '100%' : 'auto',
              height: objectFit === 'fill' ? '100%' : 'auto',
              maxWidth: objectFit !== 'fill' ? '100%' : 'none',
              maxHeight: objectFit !== 'fill' ? '100%' : 'none',
              imageRendering: 'crisp-edges',
              position: 'absolute',
              zIndex: 1,
              opacity: isNativeStream ? 0 : 1, // Ocultar visualmente pero mantener en el DOM para el audio
              pointerEvents: isNativeStream ? 'none' : 'auto',
            }}
            autoPlay
            playsInline
            muted={false}
          />
        </>
      ) : (
        <div className="text-center">
          <p className="text-gray-400 text-lg">Selecciona un dispositivo de video</p>
          <p className="text-gray-500 text-sm mt-2">Haz clic en el menú para elegir una cámara</p>
        </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
