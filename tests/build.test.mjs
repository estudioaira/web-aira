import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = fileURLToPath(new URL("../", import.meta.url));
const dist = join(raiz, "dist");
const sitio = JSON.parse(await readFile(join(raiz, "src/datos/sitio.json"), "utf8"));

async function htmls(dir = dist) {
  const salida = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) salida.push(...(await htmls(p)));
    else if (e.name.endsWith(".html") && !e.name.startsWith("_")) salida.push(p);
  }
  return salida;
}

before(() => {
  execFileSync("npm", ["run", "build"], { cwd: raiz, stdio: "pipe" });
});

test("cada página cumple las reglas de calidad", async () => {
  const archivos = await htmls();
  assert.ok(archivos.length > 0, "no hay HTML en dist");
  for (const f of archivos) {
    const h = await readFile(f, "utf8");
    const nombre = f.replace(dist, "");
    assert.match(h, /<html lang="es"/, `${nombre}: sin lang="es"`);
    assert.equal((h.match(/<h1[\s>]/g) || []).length, 1, `${nombre}: debe haber exactamente un h1`);
    const t = (h.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
    assert.ok(t.length >= 10 && t.length <= 70, `${nombre}: título de ${t.length} caracteres`);
    if (!nombre.includes("404")) {
      const d = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
      assert.ok(d.length >= 120 && d.length <= 160, `${nombre}: descripción de ${d.length}`);
    }
    for (const img of h.match(/<img\b[^>]*>/g) || []) assert.match(img, /\balt(=|\s|\/?>)/, `${nombre}: img sin alt → ${img.slice(0, 80)}`);
    assert.ok(!/href=""/.test(h), `${nombre}: href vacío`);
    assert.ok(!/(googleapis|gstatic|placehold\.co|unpkg|jsdelivr|cdnjs)/.test(h), `${nombre}: recurso externo`);
    assert.ok(!h.includes("{{"), `${nombre}: marcador sin reemplazar`);
    if (sitio.indexar === false) assert.match(h, /<meta name="robots" content="noindex/, `${nombre}: falta noindex`);
  }
});

test("el contenido solo se oculta bajo html.js (sin JS todo se ve)", async () => {
  const css = (await readdir(join(dist, "_astro"))).filter((f) => f.endsWith(".css"));
  assert.ok(css.length > 0);
  let ocultas = 0;
  for (const f of css) {
    const c = await readFile(join(dist, "_astro", f), "utf8");
    for (const [, selectores, cuerpo] of c.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
      if (!/opacity:\s*0(?![.\d])/.test(cuerpo)) continue;
      for (const sel of selectores.split(",").map((x) => x.trim()).filter((x) => /\.rev\b/.test(x))) {
        ocultas++;
        assert.match(sel, /\.js\s/, `${f}: "${sel}" oculta sin el prefijo .js`);
      }
    }
  }
  assert.ok(ocultas > 0, "no se encontró la regla que oculta .rev bajo .js");
  const inicio = await readFile(join(dist, "index.html"), "utf8");
  assert.ok(!/style="[^"]*opacity:\s*0/.test(inicio), "opacity:0 en línea en el HTML");
});

test("hay sitemap y robots", async () => {
  const s = await readFile(join(dist, "sitemap.xml"), "utf8");
  assert.match(s, /<urlset/);
  const r = await readFile(join(dist, "robots.txt"), "utf8");
  const { indexar } = JSON.parse(await readFile(join(raiz, "src/datos/sitio.json"), "utf8"));
  if (indexar) {
    assert.match(r, /Allow: \//);
    assert.match(r, /Sitemap: .+\/sitemap\.xml/);
    assert.doesNotMatch(r, /Disallow: \//);
  } else {
    assert.match(r, /Disallow: \//);
  }
});

const datosDe = async (n) => JSON.parse(await readFile(join(raiz, "src/datos", n + ".json"), "utf8"));
const html = (ruta) => readFile(join(dist, ruta), "utf8");
const enc = (t) => encodeURIComponent(t);

test("inicio: portada, experiencias, estudio, manifiesto sin título, voces y clase de prueba", async () => {
  const d = await datosDe("inicio"), s = await datosDe("sitio");
  const h = await html("index.html");
  for (const linea of d.portada.titulo.split("\n")) assert.ok(h.includes(linea), `falta "${linea}" en el h1`);
  for (const i of d.experiencias.items) assert.ok(h.includes(i.titulo), i.titulo);
  assert.ok(!h.includes("Diseñado para respirar"), "el título del estudio ya no va");
  for (const p of d.estudio.puntos) assert.ok(h.includes(p.titulo), p.titulo);
  assert.ok(h.includes(d.cita.texto), "falta el mensaje del manifiesto");
  assert.ok(!/Manifiesto/i.test(h), "el manifiesto no lleva título");
  assert.ok(!d.testimonios && !/testimonio/i.test(h), "no hay testimonios hasta tener reales");
  assert.ok(h.includes(s.pruebaGratis.titulo) && h.includes(s.pruebaGratis.boton));
  assert.equal((h.match(/fetchpriority="high"/g) || []).length, 1, "solo la foto de portada es prioritaria");
  assert.ok(!h.includes("Una casa, tres formas de entrar"), "los tres bloques de la versión anterior ya no van");
});

test("el estudio: isotipo y galería de espacios sin texto largo", async () => {
  const d = await datosDe("la-casa");
  const h = await html("la-casa/index.html");
  assert.ok(!d.historia && !d.proposito && !d.esencia, "se quitó el texto posterior al isotipo");
  assert.ok(d.espacios.items.length >= 6, "varias fotos del estudio");
  let ultimo = -1;
  for (const e of d.espacios.items) {
    const pos = h.indexOf(`>${e.nombre}<`);
    assert.ok(pos > ultimo, `${e.nombre} fuera de orden o ausente`);
    ultimo = pos;
    assert.ok(h.includes(e.alt), `falta foto: ${e.imagen}`);
  }
  assert.match(h, /aria-current="page"[^>]*>El estudio/);
});

test("experiencias: solo celebraciones con consulta por WhatsApp y reservas", async () => {
  const d = await datosDe("clases"), s = await datosDe("sitio");
  const h = await html("clases/index.html");
  assert.ok(!d.atributos && !d.detalle, "las clases semipersonalizadas ya se explican en el inicio");
  for (const e of d.eventos.items) { assert.ok(h.includes(e.titulo)); assert.ok(h.includes(enc(e.mensaje)), `falta consulta de ${e.titulo}`); }
  assert.ok(h.includes(s.reservas.titulo));
});

test("planes y horarios: franjas de horas, planes reales con precio y gift card", async () => {
  const d = await datosDe("membresia"), s = await datosDe("sitio");
  const h = await html("membresia/index.html");
  for (const dia of d.horarios.dias) { assert.ok(h.includes(dia.dia)); for (const f of dia.franjas) for (const x of f.horas) assert.ok(h.includes(`>${x}<`), x); }
  for (const p of d.planes.items) {
    assert.ok(h.includes(`>${p.nombre}<`));
    assert.ok(h.includes("$" + new Intl.NumberFormat("es-CO").format(p.precio)));
    assert.ok(h.includes(p.vigencia));
  }
  assert.ok(h.includes(d.horarios.cerrado), "domingos y festivos: sin clases");
  assert.ok(h.includes(s.app.precios), "los planes llevan a la compra en la app");
  assert.ok(h.includes(d.gift.titulo) && h.includes(enc(d.gift.mensaje)), "gift card personalizada con consulta por WhatsApp");
  assert.ok(h.includes("gift-card-1200.webp"), "la gift card se muestra");
  assert.ok(d.reglas.items.some((r) => r.includes("6 horas")) && !h.includes("12 horas"), "cancelación con 6 horas");
  for (const r of d.reglas.items) assert.ok(h.includes(r.slice(0, 30)), r);
  assert.ok(!h.includes("mockup-vip") && !/tarjeta de miembro/i.test(h), "la tarjeta VIP ya no va");
});

test("contacto: reservas en la app, formulario, ubicación real, mapa como enlace y preguntas", async () => {
  const s = await datosDe("sitio"), d = await datosDe("contacto");
  const h = await html("contacto/index.html");
  assert.ok(h.includes(s.reservas.titulo) && h.includes(s.reservas.botonApp) && h.includes(s.reservas.botonDudas));
  assert.ok(h.includes(enc(s.reservas.mensajeDudas)));
  for (const campo of ["nombre", "telefono", "correo", "motivo", "mensaje", "consentimiento"]) assert.match(h, new RegExp(`name="${campo}"`), campo);
  for (const m of d.formulario.motivos) assert.ok(h.includes(m), m);
  assert.match(h, /<form[^>]*novalidate/, "el formulario valida con JS propio y mensajes");
  assert.ok(h.includes("/tratamiento-datos"), "el consentimiento enlaza a la política");
  assert.ok(h.includes(s.ubicacion.linea) && h.includes(s.ubicacion.ciudad));
  assert.ok(h.includes(s.ubicacion.mapaEnlace.replace(/&/g, "&amp;")) || h.includes(s.ubicacion.mapaEnlace), "enlace a Google Maps");
  const marcos = h.match(/<iframe[^>]*>/g) ?? [];
  assert.equal(marcos.length, 1, "el mapa del pie siempre se muestra");
  assert.ok(marcos[0].includes("maps.google.com/maps") && /title="/.test(marcos[0]), "único iframe: el mapa, con título");
  assert.ok(h.includes(s.cookies.texto) && h.includes(s.cookies.boton), "aviso de cookies informativo");
  for (const q of d.faq.items) assert.ok(h.includes(q.pregunta));
  assert.ok(h.includes(s.ubicacion.completa), "la respuesta de ubicación lleva la dirección");
  assert.ok(!h.includes("{direccion}"), "token sin reemplazar");
  assert.ok(!h.includes("Calle 00"), "la dirección inventada ya no existe");
});

test("las tres páginas legales existen, avisan que son borrador y se enlazan desde el pie", async () => {
  const l = await datosDe("legales"), s = await datosDe("sitio");
  const inicio = await html("index.html");
  for (const [k, d] of Object.entries(l)) {
    const h = await html(`${k}/index.html`);
    assert.ok(h.includes(d.titulo));
    for (const sec of d.secciones) assert.ok(h.includes(sec.titulo));
    assert.ok(inicio.includes(`/${k}`), `el pie no enlaza ${k}`);
    assert.ok(!/<dialog/.test(h), "las páginas legales no muestran la ventana de promoción");
  }
  assert.equal(s.legales.length, 3);
});

test("en todas las páginas hay botón constante de clase de prueba hacia la app", async () => {
  const s = await datosDe("sitio");
  for (const f of await htmls()) {
    const nombre = f.replace(dist, "");
    if (nombre.includes("404")) continue;
    const h = await readFile(f, "utf8");
    assert.ok(h.includes(s.cta.texto), `${nombre}: falta ${s.cta.texto}`);
    assert.ok(h.includes(s.app.url), `${nombre}: falta el enlace a la app`);
  }
});

test("la ventana de primera clase de prueba está en las páginas principales con su texto", async () => {
  const s = await datosDe("sitio");
  for (const r of ["index.html", "la-casa/index.html", "clases/index.html", "membresia/index.html", "contacto/index.html"]) {
    const h = await html(r);
    assert.match(h, /<dialog[^>]*class="popup"/, r);
    assert.ok(h.includes(s.popup.titulo) && h.includes(s.popup.boton) && h.includes(s.popup.cerrar), r);
    assert.ok(h.includes(`data-segundos="${s.popup.segundos}"`), r);
  }
});

test("404 existe y vuelve al inicio", async () => {
  const h = await html("404.html");
  assert.match(h, /<h1/);
});

test("el menú apunta solo a páginas que existen", async () => {
  for (const i of sitio.menu) {
    const f = i.href === "/" ? "index.html" : join(i.href.slice(1), "index.html");
    await readFile(join(dist, f), "utf8");
  }
});

test("todo enlace y recurso interno respeta la base de publicación", async () => {
  const config = await readFile(join(raiz, "astro.config.mjs"), "utf8");
  const base = ((config.match(/base:\s*"([^"]*)"/) || [])[1] || "").replace(/\/$/, "");
  for (const f of await htmls()) {
    const h = await readFile(f, "utf8");
    const nombre = f.replace(dist, "");
    for (const m of h.matchAll(/\b(?:href|src|srcset)="(\/[^"]*)"/g)) {
      for (const u of m[1].split(",").map((x) => x.trim().split(" ")[0])) {
        assert.ok(u.startsWith(base + "/") || u === base, `${nombre}: "${u}" no empieza con ${base}/`);
      }
    }
  }
  const s = await readFile(join(dist, "sitemap.xml"), "utf8");
  for (const [, loc] of s.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    assert.ok(new URL(loc).pathname.startsWith(base + "/"), `sitemap: ${loc} sin la base ${base}`);
  }
  for (const f of (await readdir(join(dist, "_astro"))).filter((x) => x.endsWith(".css"))) {
    const c = await readFile(join(dist, "_astro", f), "utf8");
    for (const [, u] of c.matchAll(/url\(["']?(\/[^"')]+)/g)) assert.ok(u.startsWith(base + "/"), `${f}: url(${u}) sin base`);
  }
});

test("SEO y GEO: datos estructurados válidos en cada página, FAQ en contacto y llms.txt", async () => {
  const paginas = ["index.html", "la-casa/index.html", "clases/index.html", "membresia/index.html", "contacto/index.html", "politica-privacidad/index.html"];
  for (const p of paginas) {
    const h = await html(p);
    const bloques = [...h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
    assert.equal(bloques.length, 1, `${p}: un bloque JSON-LD`);
    const tipos = JSON.parse(bloques[0][1])["@graph"].map((n) => n["@type"]);
    assert.ok(tipos.some((t) => [].concat(t).includes("LocalBusiness")), `${p}: LocalBusiness`);
    assert.ok(tipos.includes("WebSite"), `${p}: WebSite`);
    assert.match(h, /<link rel="canonical"/, `${p}: canonical`);
    assert.match(h, /property="og:url"/, `${p}: og:url`);
  }
  const grafo = JSON.parse((await html("contacto/index.html")).match(/ld\+json">(.*?)<\/script>/s)[1])["@graph"];
  const faq = grafo.find((n) => n["@type"] === "FAQPage");
  assert.ok(faq && faq.mainEntity.length >= 4, "contacto: FAQPage con sus preguntas");
  assert.ok(!JSON.stringify(faq).includes("{direccion}"), "FAQ sin marcador sin reemplazar");
  const negocio = grafo.find((n) => [].concat(n["@type"]).includes("LocalBusiness"));
  assert.equal(negocio.address.addressLocality, "Envigado");
  assert.match(negocio.telephone, /^\+57\d{10}$/);
  const llms = await readFile(join(dist, "llms.txt"), "utf8");
  assert.match(llms, /^# Aira, The Pilates House/);
  assert.match(llms, /Envigado/);
  assert.ok(!llms.includes("undefined"), "llms.txt sin undefined");
});
