import { cn } from "@/utils/cn";

export default function Slider({ className, ...props }) {
  return (
    <input
      type="range"
      className={cn(
        "h-2 rounded-lg appearance-none bg-gray-700 cursor-pointer",
        "disabled:bg-gray-800 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  );
}
