import { useCaptureSession } from "@/hooks/useCaptureSession";
import { formatLabel } from "@/models/captureFormat";
import { useSessionStore } from "@/stores/sessionStore";

export default function FormatSelector({ formats }) {
  const selected = useSessionStore((s) => s.format);
  const { changeFormat, isStarting } = useCaptureSession();

  const handleChange = (e) => {
    const next = formats.find((f) => f.id === e.target.value);
    if (next) changeFormat(next);
  };

  return (
    <select
      className="bg-gray-700 text-white text-sm rounded px-2 py-1 outline-none border border-gray-600 focus:border-blue-500 cursor-pointer disabled:opacity-50"
      value={selected?.id ?? ""}
      onChange={handleChange}
      disabled={isStarting}
      aria-label="Resolución y frecuencia"
    >
      {formats.map((format) => (
        <option key={format.id} value={format.id}>
          {formatLabel(format)}
        </option>
      ))}
    </select>
  );
}
