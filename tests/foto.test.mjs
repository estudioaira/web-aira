import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { prepararFoto, leerArgumentos, ANCHOS } from "../scripts/preparar-foto.mjs";

async function fotoDePrueba(ancho, alto) {
  const dir = await mkdtemp(join(tmpdir(), "foto-"));
  const ruta = join(dir, "origen con espacios.jpg");
  await sharp({ create: { width: ancho, height: alto, channels: 3, background: "#ccaa88" } }).jpeg().toFile(ruta);
  return { dir, ruta };
}

test("deja la foto en cuatro anchos con la proporción pedida, aunque la ruta tenga espacios", async () => {
  const { dir, ruta } = await fotoDePrueba(3000, 2000);
  await prepararFoto({ foto: ruta, nombre: "prueba-foto", proporcion: "3:4", salida: dir });
  for (const w of ANCHOS) {
    const m = await sharp(join(dir, `prueba-foto-${w}.webp`)).metadata();
    assert.equal(m.width, w);
    assert.ok(Math.abs(m.width / m.height - 0.75) < 0.01);
  }
});

test("admite otra proporción", async () => {
  const { dir, ruta } = await fotoDePrueba(2000, 1250);
  await prepararFoto({ foto: ruta, nombre: "tarjeta", proporcion: "8:5", salida: dir });
  const m = await sharp(join(dir, "tarjeta-800.webp")).metadata();
  assert.ok(Math.abs(m.width / m.height - 1.6) < 0.01);
});

test("rechaza nombres con espacios o tildes y proporciones mal escritas", async () => {
  const { dir, ruta } = await fotoDePrueba(800, 800);
  await assert.rejects(prepararFoto({ foto: ruta, nombre: "Foto Nueva", salida: dir }), /minúsculas/);
  await assert.rejects(prepararFoto({ foto: ruta, nombre: "foto", proporcion: "ancha", salida: dir }), /proporción/);
  await assert.rejects(prepararFoto({ foto: ruta, salida: dir }), /Faltan datos/);
});

test("lee los argumentos de la línea de comandos", () => {
  assert.deepEqual(leerArgumentos(["a.jpg", "sala", "--proporcion", "8:5"]), { foto: "a.jpg", nombre: "sala", proporcion: "8:5", salida: undefined });
});
