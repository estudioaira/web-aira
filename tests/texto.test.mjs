import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const src = fileURLToPath(new URL("../src/", import.meta.url));

async function astros(dir) {
  const salida = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) salida.push(...(await astros(p)));
    else if (e.name.endsWith(".astro")) salida.push(p);
  }
  return salida;
}

test("ningún .astro lleva alt, aria-label o title escritos a mano (todo texto viene de src/datos)", async () => {
  const fallos = [];
  for (const f of await astros(src)) {
    const t = await readFile(f, "utf8");
    // atributos con texto literal (no vacíos y no expresiones {…})
    for (const m of t.matchAll(/\b(alt|aria-label|title)="([^"{][^"]*)"/g)) {
      fallos.push(`${f.replace(src, "src/")}: ${m[1]}="${m[2]}"`);
    }
  }
  assert.deepEqual(fallos, []);
});
