import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const src = fileURLToPath(new URL("../src/", import.meta.url));
async function archivos(dir) {
  const s = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) s.push(...(await archivos(p)));
    else if (/\.(astro|css)$/.test(e.name)) s.push(p);
  }
  return s;
}

test("las fotos no llevan marco: sin arcos ni esquinas redondeadas (pedido del cliente)", async () => {
  const fallos = [];
  for (const f of await archivos(src)) {
    const t = await readFile(f, "utf8");
    if (/\.arco\b|class="arco|<Arco|999px 999px/.test(t)) fallos.push(f.replace(src, "src/") + ": arco");
    // img o contenedor de foto con border-radius
    for (const m of t.matchAll(/(img|\.recuadro|\.foto)[^{}]*\{[^}]*border-radius\s*:\s*(?=\S)(?!0(?:px)?\s*[;}])[^;}]+/g)) fallos.push(f.replace(src, "src/") + ": " + m[0].slice(0, 60));
  }
  assert.deepEqual(fallos, []);
});

test("las fotos de una misma cuadrícula comparten tamaño: el recuadro cuadrado es el estándar", async () => {
  const t = await readFile(join(src, "components/Recuadro.astro"), "utf8");
  assert.match(t, /aspect-ratio/);
  assert.match(t, /object-fit:\s*cover/);
  assert.ok(!/border-radius/.test(t.replace(/border-radius:\s*0\b/g, "")), "Recuadro no redondea");
});

test("los titulares pueden partir palabras largas (móvil de 320 px: «semipersonalizadas»)", async () => {
  const css = await readFile(join(src, "styles/global.css"), "utf8");
  const regla = css.match(/\.titulo-xl,\s*\.titulo-lg\s*\{[^}]*\}/)?.[0] ?? "";
  assert.match(regla, /overflow-wrap:\s*anywhere/);
  assert.match(regla, /hyphens:\s*auto/);
});

test("el botón flotante de WhatsApp es verde WhatsApp con contraste ≥ 3:1 para el icono blanco", async () => {
  const l = await readFile(join(src, "layouts/Layout.astro"), "utf8");
  const regla = l.match(/\.flota\s*\{[^}]*\}/)?.[0] ?? "";
  const hex = (regla.match(/background:\s*(#[0-9a-fA-F]{6})/) || [])[1];
  assert.ok(hex, "el botón flotante necesita un color de fondo");
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  assert.ok(g > r * 2 && g > b * 1.5, `${hex} no es un verde de WhatsApp`);
  const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  assert.ok(1.05 / (L + 0.05) >= 3, `contraste del icono blanco sobre ${hex}`);
});

test("la cabecera de escritorio mantiene el logo centrado: columnas iguales que pueden encogerse", async () => {
  const c = await readFile(join(src, "components/Cabecera.astro"), "utf8");
  assert.match(c, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto\s+minmax\(0,\s*1fr\)/);
  assert.match(c, /column-gap:\s*clamp\(/);
});

test("los enlaces sueltos del pie, de Contacto y de la clase de prueba miden al menos 44 px de alto (tacto)", async () => {
  for (const [f, regex] of [["components/Pie.astro", /\.pie__col a\s*\{[^}]*min-height:\s*44px/], ["components/PruebaGratis.astro", /\.prueba__dudas\s*\{[^}]*min-height:\s*44px/], ["pages/contacto.astro", /dd a\s*\{[^}]*min-height:\s*44px/]]) {
    assert.match(await readFile(join(src, f), "utf8"), regex, f);
  }
});

test("el botón de enviar del formulario tiene estilo propio de botón (los estilos de Boton son locales) y 44 px de alto", async () => {
  const t = await readFile(join(src, "components/Formulario.astro"), "utf8");
  const regla = t.match(/\.form__enviar\s*\{[^}]*\}/)?.[0] ?? "";
  assert.match(regla, /min-height:\s*(4[4-9]|[5-9]\d)px/);
  assert.match(regla, /background:\s*var\(--espresso\)/);
  assert.match(regla, /border-radius:\s*999px/);
});

test("las preguntas frecuentes se pueden tocar cómodamente (summary de 44 px)", async () => {
  const t = await readFile(join(src, "pages/contacto.astro"), "utf8");
  assert.match(t.match(/\bsummary\s*\{[^}]*\}/)?.[0] ?? "", /min-height:\s*44px/);
});

test("la cabecera fija es opaca: el texto no se transparenta al desplazarse", async () => {
  const c = await readFile(join(src, "components/Cabecera.astro"), "utf8");
  const regla = c.match(/\.cab\s*\{[^}]*\}/)?.[0] ?? "";
  assert.match(regla, /background:\s*var\(--marfil\)\s*;/);
});
