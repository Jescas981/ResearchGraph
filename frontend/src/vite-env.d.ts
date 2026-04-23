/// <reference types="vite/client" />

interface Window {
  /** Rellena `public/runtime-config.js` en el build Docker (ver Dockerfile). */
  __RG_API_URL__?: string;
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
