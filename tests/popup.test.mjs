import { test } from "node:test";
import assert from "node:assert/strict";
import { programarPopup } from "../src/lib/popup.js";

function reloj() {
  const t = { id: 0, pendiente: null, limpiado: [] };
  t.set = (fn, ms) => { t.pendiente = { fn, ms }; return ++t.id; };
  t.clear = (id) => t.limpiado.push(id);
  return t;
}

test("programa la ventana a los segundos indicados", () => {
  const r = reloj(); let vista = 0;
  programarPopup({ segundos: 30, descartado: false, mostrar: () => vista++, setTimeoutFn: r.set, clearTimeoutFn: r.clear });
  assert.equal(r.pendiente.ms, 30000);
  r.pendiente.fn();
  assert.equal(vista, 1);
});

test("si ya se cerró en esta visita, no programa nada", () => {
  const r = reloj();
  const cancelar = programarPopup({ segundos: 30, descartado: true, mostrar: () => {}, setTimeoutFn: r.set, clearTimeoutFn: r.clear });
  assert.equal(r.pendiente, null);
  assert.equal(cancelar, null);
});

test("devuelve una función que cancela el temporizador", () => {
  const r = reloj();
  const cancelar = programarPopup({ segundos: 5, descartado: false, mostrar: () => {}, setTimeoutFn: r.set, clearTimeoutFn: r.clear });
  cancelar();
  assert.deepEqual(r.limpiado, [1]);
});

test("segundos inválidos usan 30 por defecto", () => {
  for (const s of [undefined, 0, -3, "x", NaN]) {
    const r = reloj();
    programarPopup({ segundos: s, descartado: false, mostrar: () => {}, setTimeoutFn: r.set, clearTimeoutFn: r.clear });
    assert.equal(r.pendiente.ms, 30000, String(s));
  }
});
