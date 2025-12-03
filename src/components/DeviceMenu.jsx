export default function DeviceMenu({ 
  isOpen, 
  devices, 
  selectedDevice, 
  error, 
  onSelectDevice 
}) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-16 left-4 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 min-w-64">
      <div className="p-4">
        <h3 className="text-white font-semibold mb-3 text-sm">Dispositivos de Video</h3>
        
        {error && (
          <div className="bg-red-900 text-red-200 p-2 rounded mb-3 text-xs">
            {error}
          </div>
        )}

        {devices.length === 0 ? (
          <p className="text-gray-400 text-sm">No hay dispositivos disponibles</p>
        ) : (
          <ul className="space-y-2">
            {devices.map((device) => (
              <li key={device.deviceId}>
                <button
                  onClick={() => onSelectDevice(device)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    selectedDevice?.deviceId === device.deviceId
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                  }`}
                >
                  <div className="font-medium">
                    {device.label || `Cámara ${device.deviceId.slice(0, 8)}`}
                  </div>
                  <div className="text-xs opacity-75">
                    {device.deviceId.slice(0, 12)}...
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
