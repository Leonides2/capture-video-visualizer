import { useQuery } from "@tanstack/react-query";
import { MESSAGES } from "@/config/constants";
import { useCaptureSession } from "@/hooks/useCaptureSession";
import { cameraQueries } from "@/queries/cameraQueries";
import { useSessionStore } from "@/stores/sessionStore";
import { cn } from "@/utils/cn";

function DeviceItem({ device, isActive, disabled, onSelect }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(device)}
        disabled={disabled}
        className={cn(
          "w-full text-left px-3 py-2 rounded text-sm transition-colors disabled:opacity-50",
          isActive ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200 hover:bg-gray-600",
        )}
      >
        <div className="font-medium">{device.name || `Cámara ${device.id}`}</div>
        <div className="text-xs opacity-75">Dispositivo #{device.id}</div>
      </button>
    </li>
  );
}

export default function DeviceMenu({ onClose }) {
  const { data: devices = [], isPending, isFetching, error: devicesError, refetch } = useQuery(cameraQueries.devices());
  const activeDevice = useSessionStore((s) => s.device);
  const sessionError = useSessionStore((s) => s.error);
  const { selectDevice, isStarting } = useCaptureSession();

  const error = devicesError ? MESSAGES.devicesUnavailable : sessionError;

  const handleSelect = async (device) => {
    const started = await selectDevice(device);
    if (started) onClose();
  };

  return (
    <div className="absolute top-16 left-4 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 min-w-64">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3 gap-4">
          <h3 className="text-white font-semibold text-sm">Dispositivos de Video</h3>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
          >
            {isFetching ? "Buscando..." : "Actualizar"}
          </button>
        </div>

        {error && <div className="bg-red-900 text-red-200 p-2 rounded mb-3 text-xs">{error}</div>}

        {isPending ? (
          <p className="text-gray-400 text-sm">Buscando dispositivos...</p>
        ) : devices.length === 0 ? (
          <p className="text-gray-400 text-sm">No hay dispositivos disponibles</p>
        ) : (
          <ul className="space-y-2">
            {devices.map((device) => (
              <DeviceItem
                key={device.id}
                device={device}
                isActive={activeDevice?.id === device.id}
                disabled={isStarting}
                onSelect={handleSelect}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
