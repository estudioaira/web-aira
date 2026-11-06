#!/usr/bin/env node
// Lista los bloques con "_demo": true de src/datos/ y, con --produccion, falla si hay alguno.
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

function recorrer(valor, ruta, salida) {
  if (Array.isArray(valor)) {
    valor.forEach((v, i) => recorrer(v, `${ruta}[${i}]`, salida));
  } else if (valor && typeof valor === "object") {
    if (valor._demo === true) salida.push(ruta || "(archivo completo)");
    for (const [k, v] of Object.entries(valor)) {
      if (k === "_demo") continue;
      recorrer(v, ruta ? `${ruta}.${k}` : k, salida);
    }
  }
}

export async function listarDemo(dir) {
  const archivos = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
  const todo = [];
  for (const f of archivos) {
    const datos = JSON.parse(await readFile(join(dir, f), "utf8"));
    const hallados = [];
    recorrer(datos, "", hallados);
    hallados.forEach((h) => todo.push(`${f} › ${h}`));
  }
  return todo;
}

const esCli = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (esCli) {
  const args = process.argv.slice(2);
  const produccion = args.includes("--produccion");
  const dir = resolve(args.find((a) => !a.startsWith("--")) ?? join(import.meta.dirname, "../src/datos"));
  const lista = await listarDemo(dir);
  if (lista.length === 0) {
    console.log("Sin datos de demostración. Listo para publicar.");
  } else {
    console.log(`Datos de demostración (${lista.length}):`);
    lista.forEach((l) => console.log("  - " + l));
    if (produccion) {
      console.error("\nNo se puede publicar: reemplaza estos datos por los reales del cliente.");
      process.exit(1);
    }
  }
}
