import sitio from "../datos/sitio.json";
import { ruta } from "../lib/ruta.js";

export const GET = ({ site }) => {
  const urls = [...sitio.menu, ...sitio.legales].map((i) => new URL(ruta(i.href), site).href);
  const cuerpo = urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${cuerpo}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml" } },
  );
};
