/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Variables de entorno inyectadas en tiempo de ejecución
interface Window {
  ENV: {
    VITE_API_URL: string;
    VITE_BACKEND_URL: string;
    VITE_APP_NAME: string;
  };
} 