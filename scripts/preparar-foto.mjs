#!/usr/bin/env node
// Prepara UNA foto para el sitio: la recorta y la deja en WebP en cuatro anchos.
//
// Uso:
//   node scripts/preparar-foto.mjs "<foto>" <nombre> [--proporcion 3:4|8:5|1:1] [--salida <carpeta>]
//
// Ejemplo (reemplazar la foto de la portada, que en inicio.json es "estudio-recepcion"):
//   node scripts/preparar-foto.mjs "C:\Users\Yesica\Desktop\portada.jpg" estudio-recepcion
//
// Deja <nombre>-480.webp, -800.webp, -1200.webp y -1800.webp en public/img/. El nombre es el que
// va en el campo "imagen" del archivo de textos, sin el ancho ni la extensión.
import sharp from "sharp";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const ANCHOS = [480, 800, 1200, 1800];

export function leerArgumentos(argv) {
  const pos = [];
  const opc = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) { opc[argv[i].slice(2)] = argv[++i]; } else { pos.push(argv[i]); }
  }
  return { foto: pos[0], nombre: pos[1], proporcion: opc.proporcion ?? "3:4", salida: opc.salida };
}

export async function prepararFoto({ foto, nombre, proporcion = "3:4", salida }) {
  if (!foto || !nombre) throw new Error('Faltan datos. Uso: preparar-foto.mjs "<foto>" <nombre> [--proporcion 3:4|8:5|1:1]');
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(nombre)) throw new Error("El nombre va en minúsculas, sin espacios ni tildes, con guiones (p. ej. estudio-sala).");
  const m = /^(\d+):(\d+)$/.exec(proporcion);
  if (!m) throw new Error("La proporción se escribe así: 3:4, 8:5 o 1:1.");
  const [rw, rh] = [Number(m[1]), Number(m[2])];
  const destino = resolve(salida ?? join(import.meta.dirname, "../public/img"));
  const hechos = [];
  for (const w of ANCHOS) {
    const archivo = join(destino, `${nombre}-${w}.webp`);
    await sharp(resolve(foto)).rotate()
      .resize({ width: w, height: Math.round((w * rh) / rw), fit: "cover", position: "centre" })
      .webp({ quality: 78, effort: 5 })
      .toFile(archivo);
    hechos.push(archivo);
  }
  return hechos;
}

const esCli = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (esCli) {
  try {
    const hechos = await prepararFoto(leerArgumentos(process.argv.slice(2)));
    hechos.forEach((h) => console.log("listo", h));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
