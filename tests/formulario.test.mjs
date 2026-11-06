import { test } from "node:test";
import assert from "node:assert/strict";
import { validarContacto, mensajeContacto } from "../src/lib/formulario.js";

const base = { nombre: "Camila Ríos", telefono: "300 123 4567", correo: "", motivo: "Clase de prueba", mensaje: "", consentimiento: true };
const plantilla = "Hola Aira, soy {nombre}.\nMotivo: {motivo}\nTeléfono: {telefono}\nCorreo: {correo}\n{mensaje}";

test("un contacto completo es válido", () => {
  assert.deepEqual(validarContacto(base), { ok: true, errores: {} });
});

test("exige nombre, teléfono, motivo y consentimiento", () => {
  const r = validarContacto({ nombre: " ", telefono: "", motivo: "", consentimiento: false });
  assert.equal(r.ok, false);
  assert.deepEqual(Object.keys(r.errores).sort(), ["consentimiento", "motivo", "nombre", "telefono"]);
});

test("el teléfono acepta espacios y +, y rechaza letras o largos absurdos", () => {
  assert.equal(validarContacto({ ...base, telefono: "+57 300 123 4567" }).ok, true);
  assert.equal(validarContacto({ ...base, telefono: "abc" }).errores.telefono !== undefined, true);
  assert.equal(validarContacto({ ...base, telefono: "123" }).errores.telefono !== undefined, true);
});

test("el correo es opcional, pero si se escribe debe ser un correo", () => {
  assert.equal(validarContacto({ ...base, correo: "" }).ok, true);
  assert.equal(validarContacto({ ...base, correo: "no-es-correo" }).errores.correo !== undefined, true);
  assert.equal(validarContacto({ ...base, correo: "ana@correo.co" }).ok, true);
});

test("el mensaje omite las líneas cuyo dato está vacío", () => {
  const m = mensajeContacto(plantilla, base);
  assert.equal(m, "Hola Aira, soy Camila Ríos.\nMotivo: Clase de prueba\nTeléfono: 300 123 4567");
});

test("el mensaje conserva tildes, ñ, & y # sin alterarlos", () => {
  const m = mensajeContacto(plantilla, { ...base, nombre: "Íñigo & Co #1", correo: "a@b.co", mensaje: "¿Cuándo abren?" });
  assert.match(m, /Íñigo & Co #1/);
  assert.match(m, /Correo: a@b\.co/);
  assert.match(m, /¿Cuándo abren\?$/);
});

test("un dato con llaves no se interpreta como otro campo", () => {
  const m = mensajeContacto(plantilla, { ...base, nombre: "{motivo}" });
  assert.match(m, /soy \{motivo\}\./);
});
