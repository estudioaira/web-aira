// Datos estructurados (schema.org) y resumen para asistentes de IA. Todo sale de src/datos/:
// nada se escribe aquí. Si un dato no existe en el JSON, el campo se omite (no se inventa).
import { ruta } from "./ruta.js";

const limpio = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)));

export function negocio(sitio, site) {
  const u = sitio.ubicacion ?? {};
  const c = sitio.contacto ?? {};
  const [localidad, region] = (u.ciudad ?? "").split(",").map((t) => t.trim());
  const url = new URL(ruta("/"), site).href;
  return limpio({
    "@type": ["ExerciseGym", "LocalBusiness"],
    "@id": `${url}#negocio`,
    name: `${sitio.nombre}, ${sitio.marca}`,
    description: sitio.descripcion,
    url,
    image: new URL(ruta("/og.png"), site).href,
    telephone: c.whatsapp ? `+${c.whatsapp}` : undefined,
    email: c.correo,
    address: u.linea ? limpio({
      "@type": "PostalAddress",
      streetAddress: [u.linea, u.nombre, u.detalle].filter(Boolean).join(", "),
      addressLocality: localidad,
      addressRegion: region,
      addressCountry: "CO",
    }) : undefined,
    hasMap: u.mapaEnlace,
    sameAs: (c.redes ?? []).map((r) => r.href).filter(Boolean),
  });
}

export function sitioWeb(sitio, site) {
  const url = new URL(ruta("/"), site).href;
  return { "@type": "WebSite", "@id": `${url}#sitio`, url, name: `${sitio.nombre}, ${sitio.marca}`, inLanguage: "es-CO", publisher: { "@id": `${url}#negocio` } };
}

export function preguntas(items) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((q) => ({ "@type": "Question", name: q.pregunta, acceptedAnswer: { "@type": "Answer", text: q.respuesta } })),
  };
}

export const grafo = (nodos) => JSON.stringify({ "@context": "https://schema.org", "@graph": nodos });

// llms.txt: resumen en Markdown para asistentes de IA (formato de llmstxt.org).
export function llms(sitio, paginas, site) {
  const u = sitio.ubicacion ?? {};
  const c = sitio.contacto ?? {};
  const abs = (h) => new URL(ruta(h), site).href;
  const lineas = [
    `# ${sitio.nombre}, ${sitio.marca}`,
    "",
    `> ${sitio.descripcion}`,
    "",
    "## Datos del estudio",
    "",
    u.completa && `- Dirección: ${u.completa}`,
    c.whatsappVisible && `- WhatsApp: ${c.whatsappVisible}`,
    c.correo && `- Correo: ${c.correo}`,
    ...(c.horario ?? []).map((h) => `- ${h.dias}: ${h.horas}`),
    sitio.app?.url && `- Reservas y compra de planes: ${sitio.app.url}`,
    "",
    "## Páginas",
    "",
    ...paginas.map((p) => `- [${p.texto}](${abs(p.href)}): ${p.descripcion}`),
  ];
  return lineas.filter((l) => l !== undefined && l !== false && l !== null).join("\n") + "\n";
}
