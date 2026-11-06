import { test } from "node:test";
import assert from "node:assert/strict";
import { enlaceWa } from "../src/lib/wa.js";

test("sin mensaje, solo el número", () => {
  assert.equal(enlaceWa("573000000000"), "https://wa.me/573000000000");
});

test("codifica tildes, ñ, &, # y saltos de línea", () => {
  const url = enlaceWa("573000000000", "Reformer & Mat #1: ¿Cuándo?\nGracias, niño");
  assert.ok(url.startsWith("https://wa.me/573000000000?text="));
  const texto = decodeURIComponent(url.split("?text=")[1]);
  assert.equal(texto, "Reformer & Mat #1: ¿Cuándo?\nGracias, niño");
  assert.ok(!url.includes(" ") && !url.includes("&Mat"));
});

test("limpia símbolos del número", () => {
  assert.equal(enlaceWa("+57 300 000 0000"), "https://wa.me/573000000000");
});
