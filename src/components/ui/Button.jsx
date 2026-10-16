import { cn } from "@/utils/cn";

const VARIANTS = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white",
  secondary: "bg-gray-700 hover:bg-gray-600 text-white",
  danger: "bg-red-600 hover:bg-red-700 text-white font-bold border border-red-500 shadow-xl",
  dangerOutline:
    "bg-gray-800 hover:bg-gray-700 border border-red-900/50 text-red-500 hover:text-red-400 font-medium shadow-lg",
};

const SIZES = {
  xs: "px-2 py-1 text-sm",
  sm: "px-3 py-1 text-sm",
  md: "px-4 py-2 text-sm rounded-lg",
};

export default function Button({ variant = "secondary", size = "sm", className, type = "button", ...props }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center gap-2 rounded transition-all active:scale-95",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}
