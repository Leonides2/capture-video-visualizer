import { MenuIcon } from "@/components/ui/icons";

export default function MenuButton({ onClick, isOpen }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Dispositivos de video"
      aria-expanded={isOpen}
      className="absolute top-3 left-3 bg-black opacity-60 p-2 z-40 rounded shadow-white shadow cursor-pointer hover:opacity-80 transition-opacity text-[#e3e3e3]"
    >
      <MenuIcon size={24} />
    </button>
  );
}
