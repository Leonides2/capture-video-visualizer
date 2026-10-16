import { useCallback, useRef } from "react";

/** Devuelve un ref para el elemento a maximizar y una función para alternar pantalla completa. */
export function useFullscreen() {
  const ref = useRef(null);

  const toggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await ref.current?.requestFullscreen();
      }
    } catch (err) {
      console.error("Error al cambiar pantalla completa:", err);
    }
  }, []);

  return { ref, toggle };
}
