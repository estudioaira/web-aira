import sitio from "../datos/sitio.json";
import { llms } from "../lib/estructurados.js";

// Cada página del menú aporta su `meta.descripcion` desde src/datos/<id>.json.
const datos = import.meta.glob("../datos/*.json", { eager: true, import: "default" });

export const GET = ({ site }) => {
  const paginas = sitio.menu
    .map((i) => ({ texto: i.texto, href: i.href, descripcion: datos[`../datos/${i.id}.json`]?.meta?.descripcion }))
    .filter((p) => p.descripcion);
  return new Response(llms(sitio, paginas, site), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
