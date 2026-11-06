import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { listarDemo } from "../scripts/revisar-demo.mjs";

async function fixture(obj, nombre = "a.json") {
  const dir = await mkdtemp(join(tmpdir(), "demo-"));
  await writeFile(join(dir, nombre), JSON.stringify(obj));
  return dir;
}

test("encuentra bloques _demo anidados", async () => {
  const dir = await fixture({ x: 1, contacto: { _demo: true, tel: "1" }, lista: [{ ok: 1 }, { _demo: true }] });
  const r = await listarDemo(dir);
  assert.deepEqual(r, ["a.json › contacto", "a.json › lista[1]"]);
});

test("sin demo devuelve lista vacía", async () => {
  const dir = await fixture({ a: { b: 1 } });
  assert.deepEqual(await listarDemo(dir), []);
});

test("un _demo en la raíz se reporta como (archivo completo)", async () => {
  const dir = await fixture({ _demo: true, a: 1 });
  assert.deepEqual(await listarDemo(dir), ["a.json › (archivo completo)"]);
});

test("--produccion sale con 1 si hay demo, 0 si no", async () => {
  const con = await fixture({ _demo: true });
  const sin = await fixture({ a: 1 });
  const script = fileURLToPath(new URL("../scripts/revisar-demo.mjs", import.meta.url));
  assert.throws(() => execFileSync("node", [script, "--produccion", con], { stdio: "pipe" }));
  execFileSync("node", [script, "--produccion", sin], { stdio: "pipe" });
});
