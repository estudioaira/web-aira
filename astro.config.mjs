import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// `base` y `site` salen de variables de entorno: pasar de la demo al dominio propio es
// cambiar dos valores del flujo de publicación, no reescribir rutas. Los enlaces y recursos
// pasan por src/lib/ruta.js.
//   producción: PUBLIC_BASE=/ PUBLIC_SITE=https://<dominio-del-cliente>
//   prueba:     PUBLIC_BASE=/<repositorio> PUBLIC_SITE=https://<cuenta>.github.io
export default defineConfig({
  site: process.env.PUBLIC_SITE || "http://localhost:4321",
  base: process.env.PUBLIC_BASE || "/",
  devToolbar: { enabled: false },
  vite: { plugins: [tailwindcss()] },
});
