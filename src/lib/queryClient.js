import { QueryClient } from "@tanstack/react-query";

// Los comandos de Tauri abren hardware (cámaras), así que no se reintentan
// ni se refrescan automáticamente al enfocar la ventana.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
