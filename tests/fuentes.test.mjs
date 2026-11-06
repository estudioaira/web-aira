import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { brotliDecompressSync } from "node:zlib";
import { fileURLToPath } from "node:url";

// Sin Python: esta prueba también corre en el equipo de la clienta (Windows) y en GitHub, donde
// `python3` no existe. Se lee la tabla `cmap` del woff2 directamente; esa tabla no se transforma al
// comprimir, así que basta descomprimir el flujo brotli y leerla.
const raiz = fileURLToPath(new URL("../public/fonts/", import.meta.url));
const fuentes = ["almarose-thin", "almarose-semibold", "technonue-thin", "technonue-regular"];
const ETIQUETAS = ["cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post", "cvt ", "fpgm", "glyf", "loca", "prep", "CFF ", "VORG", "EBDT", "EBLC", "gasp", "hdmx", "kern", "LTSH", "PCLT", "VDMX", "vhea", "vmtx", "BASE", "GDEF", "GPOS", "GSUB", "EBSC", "JSTF", "MATH", "CBDT", "CBLC", "COLR", "CPAL", "SVG ", "sbix", "acnt", "avar", "bdat", "bloc", "bsln", "cvar", "fdsc", "feat", "fmtx", "fvar", "gvar", "hsty", "just", "lcar", "mort", "morx", "opbd", "prop", "trak", "Zapf", "Silf", "Glat", "Gloc", "Feat", "Sill"];

function uintBase128(buf, pos) {
  let valor = 0;
  for (let i = 0; i < 5; i++) {
    const b = buf[pos.i++];
    valor = (valor << 7) | (b & 0x7f);
    if (!(b & 0x80)) return valor >>> 0;
  }
  throw new Error("UIntBase128 inválido");
}

export function codigosDeWoff2(buf) {
  const numTablas = buf.readUInt16BE(12);
  const comprimido = buf.readUInt32BE(20);
  const pos = { i: 48 };
  const tablas = [];
  for (let n = 0; n < numTablas; n++) {
    const flags = buf[pos.i++];
    const indice = flags & 0x3f;
    const version = flags >> 6;
    const etiqueta = indice === 63 ? buf.toString("latin1", pos.i, (pos.i += 4)) : ETIQUETAS[indice];
    const original = uintBase128(buf, pos);
    const transformada = etiqueta === "glyf" || etiqueta === "loca" ? version === 0 : version !== 0;
    const longitud = transformada ? uintBase128(buf, pos) : original;
    tablas.push({ etiqueta, longitud });
  }
  const datos = brotliDecompressSync(buf.subarray(pos.i, pos.i + comprimido));
  let desde = 0;
  let cmap = null;
  for (const t of tablas) {
    if (t.etiqueta === "cmap") cmap = datos.subarray(desde, desde + t.longitud);
    desde += t.longitud;
  }
  assert.ok(cmap, "la fuente no trae tabla cmap");
  const codigos = new Set();
  const numSub = cmap.readUInt16BE(2);
  for (let i = 0; i < numSub; i++) {
    const sub = cmap.readUInt32BE(4 + i * 8 + 4);
    const formato = cmap.readUInt16BE(sub);
    if (formato === 4) {
      const segX2 = cmap.readUInt16BE(sub + 6);
      const finales = sub + 14;
      const iniciales = finales + segX2 + 2;
      for (let s = 0; s < segX2 / 2; s++) {
        const fin = cmap.readUInt16BE(finales + s * 2);
        const ini = cmap.readUInt16BE(iniciales + s * 2);
        if (ini === 0xffff) continue;
        for (let c = ini; c <= fin; c++) codigos.add(c);
      }
    } else if (formato === 12) {
      const grupos = cmap.readUInt32BE(sub + 12);
      for (let g = 0; g < grupos; g++) {
        const base = sub + 16 + g * 12;
        const ini = cmap.readUInt32BE(base);
        const fin = cmap.readUInt32BE(base + 4);
        for (let c = ini; c <= fin; c++) codigos.add(c);
      }
    }
  }
  return codigos;
}

for (const f of fuentes) {
  test(`${f}.woff2 es un woff2 válido y cubre el español`, async () => {
    const buf = await readFile(raiz + f + ".woff2");
    assert.equal(buf.subarray(0, 4).toString(), "wOF2");
    assert.ok(buf.length > 2000, "archivo sospechosamente pequeño");
    const codigos = codigosDeWoff2(buf);
    const faltan = [..."áéíóúüñÁÉÍÓÚÜÑ¿¡«»–—“”"].filter((c) => !codigos.has(c.codePointAt(0)));
    assert.deepEqual(faltan, [], `faltan glifos: ${faltan.join(",")}`);
  });
}

test("el lector de cmap distingue una fuente que sí cubre un carácter de uno que no", async () => {
  const codigos = codigosDeWoff2(await readFile(raiz + "almarose-semibold.woff2"));
  assert.ok(codigos.has("ñ".codePointAt(0)));
  assert.ok(!codigos.has("字".codePointAt(0)), "no debería cubrir caracteres CJK");
});
