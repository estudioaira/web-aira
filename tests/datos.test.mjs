import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("../src/datos/", import.meta.url));
const pub = fileURLToPath(new URL("../public/", import.meta.url));
const raiz = fileURLToPath(new URL("../", import.meta.url));
const cargar = async (n) => JSON.parse(await readFile(dir + n, "utf8"));
const paginas = ["inicio", "la-casa", "clases", "membresia", "contacto"];

function recoger(valor, clave, salida) {
  if (Array.isArray(valor)) valor.forEach((v) => recoger(v, clave, salida));
  else if (valor && typeof valor === "object")
    for (const [k, v] of Object.entries(valor)) {
      if (k === clave && typeof v === "string") salida.push(v);
      else recoger(v, clave, salida);
    }
}
function objetosConImagen(v, salida = []) {
  if (Array.isArray(v)) v.forEach((x) => objetosConImagen(x, salida));
  else if (v && typeof v === "object") {
    if (typeof v.imagen === "string") salida.push(v);
    Object.values(v).forEach((x) => objetosConImagen(x, salida));
  }
  return salida;
}

test("todos los JSON parsean", async () => {
  for (const f of (await readdir(dir)).filter((x) => x.endsWith(".json"))) await cargar(f);
});

test("sitio.json trae lo que los componentes necesitan", async () => {
  const s = await cargar("sitio.json");
  for (const k of ["nombre", "marca", "eslogan", "descripcion", "menu", "ui", "pie", "contacto", "ubicacion", "app", "cta", "reservas", "pruebaGratis", "popup", "legales"]) assert.ok(s[k], `falta ${k}`);
  assert.equal(s.menu.length, 5);
  assert.match(s.contacto.whatsapp, /^\d{10,15}$/);
  assert.match(s.app.url, /^https:\/\//);
  assert.ok(s.cta.texto && s.cta.corto && s.reservas.botonApp && s.reservas.botonDudas && s.pruebaGratis.boton);
  assert.ok(s.popup.segundos >= 5 && s.popup.titulo && s.popup.boton && s.popup.cerrar);
  for (const k of ["irAlContenido", "abrirMenu", "cerrarMenu", "menuPrincipal", "irInicio", "reservar", "reservarWa", "volverArriba", "menuMovil", "consultarPlan", "cotizar", "comoLlegar"]) assert.ok(s.ui[k], `ui.${k}`);
  assert.equal(typeof s.indexar, "boolean", "indexar debe ser true o false");
});

test("la ubicación es la real del cliente (Envigado) , enlace de mapa y mapa incrustado de Google", async () => {
  const s = await cargar("sitio.json");
  assert.match(s.ubicacion.completa, /Av\. Las Palmas #Km 15 990/);
  assert.match(s.ubicacion.completa, /Mall Le Mont, Sótano 2, oficina 9855/);
  assert.match(s.ubicacion.completa, /Vda\. El Peñasco/);
  assert.match(s.ubicacion.completa, /Envigado, Antioquia/);
  assert.match(s.ubicacion.mapaEmbed, /^https:\/\/maps\.google\.com\/maps\?.*output=embed/);
  assert.match(s.ubicacion.mapaEnlace, /^https:\/\/(www\.google\.com\/maps\/|maps\.app\.goo\.gl\/)/);
  assert.equal(s.ubicacion._demo, undefined, "la dirección es real: no debe marcarse _demo");
  assert.equal(s.contacto.direccion, undefined, "la dirección ya no vive en contacto");
});

for (const p of paginas) {
  test(`${p}.json: meta con título y descripción de 120 a 160 caracteres`, async () => {
    const d = await cargar(p + ".json");
    assert.ok(d.meta.titulo.length >= 10 && d.meta.titulo.length <= 70, `título ${d.meta.titulo.length}`);
    const n = d.meta.descripcion.length;
    assert.ok(n >= 120 && n <= 160, `descripción de ${p}: ${n} caracteres`);
  });
}

test("legales.json: tres documentos con meta válida y secciones completas", async () => {
  const l = await cargar("legales.json");
  assert.deepEqual(Object.keys(l).sort(), ["politica-cookies", "politica-privacidad", "tratamiento-datos"]);
  for (const [k, d] of Object.entries(l)) {
    assert.equal(d._demo, undefined, `${k} ya es el texto publicado`);
    assert.ok(d.titulo && d.secciones.length >= 4, k);
    assert.ok(!JSON.stringify(d).includes("por confirmar"), `${k}: quedan datos por confirmar`);
    assert.ok(d.meta.descripcion.length >= 120 && d.meta.descripcion.length <= 160, `${k}: descripción ${d.meta.descripcion.length}`);
    assert.ok(d.meta.titulo.length >= 10 && d.meta.titulo.length <= 70, `${k}: título ${d.meta.titulo.length}`);
  }
  const s = await cargar("sitio.json");
  assert.deepEqual(s.legales.map((x) => x.href).sort(), ["/politica-cookies", "/politica-privacidad", "/tratamiento-datos"]);
});

test("toda foto referenciada existe y tiene alt", async () => {
  for (const p of ["sitio", ...paginas]) {
    const imgs = [];
    recoger(await cargar(p + ".json"), "imagen", imgs);
    for (const base of imgs) await access(`${pub}img/${base}-800.webp`);
  }
  const todo = await Promise.all(paginas.map((p) => cargar(p + ".json")));
  for (const o of objetosConImagen(todo)) assert.ok(o.alt && o.alt.length > 8, `sin alt: ${o.imagen}`);
});

test("Experiencias solo trae las celebraciones del cliente", async () => {
  const c = await cargar("clases.json");
  assert.deepEqual(c.eventos.items.map((e) => e.titulo), ["Cumpleaños", "Despedidas de soltera", "Grados", "Eventos empresariales"]);
  for (const e of c.eventos.items) assert.ok(e.texto && e.imagen && e.alt && e.mensaje);
});

test("El estudio muestra al menos los espacios originales en orden", async () => {
  const c = await cargar("la-casa.json");
  assert.deepEqual(c.espacios.items.slice(0, 4).map((e) => e.nombre), ["Recepción", "Salas con lockers", "Reformers", "Zonas verdes"]);
});

test("planes reales en COP con vigencia, y horarios por franja", async () => {
  const m = await cargar("membresia.json");
  for (const plan of m.planes.items) assert.ok(Number.isInteger(plan.precio) && plan.precio > 0 && plan.vigencia, plan.nombre);
  assert.equal(m.planes.moneda, "COP");
  assert.ok(m.horarios.dias.length >= 3);
  assert.ok(m.horarios.dias.slice(0, 2).every((d) => d.franjas.some((f) => f.horas.length > 0)));
  const dom = m.horarios.dias.find((d) => /Domingos/.test(d.dia));
  assert.ok(dom && dom.franjas.length === 0, "domingos y festivos no hay clases");
});

test("las preguntas frecuentes son las cuatro acordadas con el cliente", async () => {
  const f = (await cargar("contacto.json")).faq.items;
  assert.deepEqual(f.map((q) => q.pregunta), ["¿Cómo agendo mi clase?", "¿Qué debo llevar?", "¿Cuántas personas hay por clase?", "¿Dónde están ubicados?"]);
  assert.match(f[0].respuesta, /app/);
  assert.match(f[1].respuesta, /termo con agua/i);
  assert.match(f[2].respuesta, /6 personas/);
  assert.equal(f[3].respuesta, "{direccion}");
});

test("el formulario trae plantilla de WhatsApp y motivos", async () => {
  const f = (await cargar("contacto.json")).formulario;
  assert.ok(f.motivos.length >= 3 && f.plantilla.includes("{nombre}") && f.plantilla.includes("{telefono}"));
  assert.ok(f.consentimiento && f.boton && f.campos.nombre);
});

test("los datos inventados o provisionales están marcados _demo", async () => {
  const c = await cargar("clases.json");
  assert.equal(c._demo, undefined, "Experiencias es contenido real del cliente");
  for (const [archivo, ruta] of [["sitio.json", ["empresa"]], ["sitio.json", ["contacto"]], ["sitio.json", ["app"]], ["membresia.json", []]]) {
    let n = await cargar(archivo);
    for (const k of ruta) n = n[k];
    assert.equal(n._demo, undefined, `${archivo} › ${ruta.join(".") || "(raíz)"} ya es real`);
  }
});

test("contacto.mapa trae el alt de la foto y sitio.pie el rótulo legal", async () => {
  assert.ok((await cargar("contacto.json")).mapa.alt.length > 8);
  assert.ok((await cargar("sitio.json")).pie.legal);
});

test("el estudio queda en Envigado: ni en datos ni en la documentación aparece otra ciudad", async () => {
  const s = await cargar("sitio.json");
  assert.match(s.ubicacion.ciudad, /Envigado/);
  assert.match(s.descripcion, /Envigado/);
  const revisar = [dir + "inicio.json", dir + "contacto.json", dir + "sitio.json", raiz + "PENDIENTES.md", raiz + "PRODUCT.md", raiz + "AGENTS.md", raiz + "TUTORIAL.md", raiz + "README.md"];
  // La documentación del asistente solo vive en el computador de la dueña (no se sube a git):
  // se revisa si está, y se omite en la revisión de GitHub.
  const hay = (r) => access(r).then(() => true, () => false);
  if (await hay(raiz + "conocimiento_generado")) {
    for (const d of await readdir(raiz + "conocimiento_generado")) revisar.push(raiz + "conocimiento_generado/" + d);
  }
  for (const f of revisar) {
    if (!(await hay(f))) continue;
    assert.ok(!/Bogot/i.test(await readFile(f, "utf8")), `${f} menciona Bogotá`);
  }
  if (await hay(raiz + "conocimiento_generado/SITIO.md")) {
    assert.match(await readFile(raiz + "conocimiento_generado/SITIO.md", "utf8"), /Envigado/);
  }
});
