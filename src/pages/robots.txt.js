import sitio from "../datos/sitio.json";
import { ruta } from "../lib/ruta.js";

// Mientras `indexar` sea false en sitio.json, el sitio pide a los buscadores que no lo listen.
export const GET = ({ site }) => {
  const mapa = new URL(ruta("/sitemap.xml"), site).href;
  const cuerpo = sitio.indexar === false
    ? "User-agent: *\nDisallow: /\n"
    : `User-agent: *\nAllow: /\n\nSitemap: ${mapa}\n`;
  return new Response(cuerpo, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
