const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Valida el formulario de contacto. Correo y mensaje son opcionales. */
export function validarContacto(d = {}) {
  const errores = {};
  if (!String(d.nombre ?? "").trim()) errores.nombre = true;
  const digitos = String(d.telefono ?? "").replace(/[\s+()-]/g, "");
  if (!/^\d{7,15}$/.test(digitos)) errores.telefono = true;
  if (!String(d.motivo ?? "").trim()) errores.motivo = true;
  const correo = String(d.correo ?? "").trim();
  if (correo && !CORREO.test(correo)) errores.correo = true;
  if (d.consentimiento !== true) errores.consentimiento = true;
  return { ok: Object.keys(errores).length === 0, errores };
}

/**
 * Arma el mensaje de WhatsApp desde la plantilla del JSON. Una sola pasada: un dato que
 * contenga "{algo}" no se vuelve a interpretar. Se omite la línea cuyo dato esté vacío.
 */
export function mensajeContacto(plantilla, d = {}) {
  return String(plantilla)
    .split("\n")
    .map((linea) => {
      let vacio = false;
      const texto = linea.replace(/\{(\w+)\}/g, (_, k) => {
        const v = String(d[k] ?? "").trim();
        if (!v) vacio = true;
        return v;
      });
      return vacio ? null : texto;
    })
    .filter((l) => l !== null)
    .join("\n")
    .trim();
}
