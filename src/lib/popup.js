export const CLAVE_POPUP = "aira-popup-visto";

/**
 * Programa la ventana "primera clase gratis". No hace nada si ya se cerró en esta visita.
 * Devuelve una función para cancelar el temporizador (o null si no se programó).
 */
export function programarPopup({ segundos, descartado, mostrar, setTimeoutFn = setTimeout, clearTimeoutFn = clearTimeout }) {
  if (descartado) return null;
  const s = Number(segundos);
  const ms = (Number.isFinite(s) && s > 0 ? s : 30) * 1000;
  const id = setTimeoutFn(mostrar, ms);
  return () => clearTimeoutFn(id);
}
