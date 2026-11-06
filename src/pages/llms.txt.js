import sitio from "../datos/sitio.json";
import inicio from "../datos/inicio.json";
import laCasa from "../datos/la-casa.json";
import clases from "../datos/clases.json";
import membresia from "../datos/membresia.json";
import contacto from "../datos/contacto.json";
import { llms } from "../lib/estructurados.js";

const metaDe = { inicio, "la-casa": laCasa, clases, membresia, contacto };

export const GET = ({ site }) => {
  const paginas = sitio.menu.map((i) => ({ texto: i.texto, href: i.href, descripcion: metaDe[i.id].meta.descripcion }));
  return new Response(llms(sitio, paginas, site), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
