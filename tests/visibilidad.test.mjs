import { test } from "node:test";
import assert from "node:assert/strict";
import { tieneVisita, tieneConecta } from "../src/lib/visibilidad.js";

test("visita: hay dirección u horario", () => {
  assert.equal(tieneVisita({ direccion: { linea: "Calle 1" } }), true);
  assert.equal(tieneVisita({ horario: [{ dias: "L", horas: "8" }] }), true);
});

test("visita: sin dirección ni horario no hay columna (sin título huérfano)", () => {
  assert.equal(tieneVisita({}), false);
  assert.equal(tieneVisita({ direccion: { linea: "" }, horario: [] }), false);
});

test("conecta: WhatsApp, correo o una red con enlace", () => {
  assert.equal(tieneConecta({ whatsappVisible: "+57 1" }), true);
  assert.equal(tieneConecta({ correo: "a@b.co" }), true);
  assert.equal(tieneConecta({ redes: [{ nombre: "IG", href: "https://x" }] }), true);
});

test("conecta: sin datos, o con redes sin enlace, no hay columna", () => {
  assert.equal(tieneConecta({}), false);
  assert.equal(tieneConecta({ redes: [{ nombre: "IG", href: "" }], correo: "", whatsappVisible: "" }), false);
});
