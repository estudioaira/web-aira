/** ¿Hay algo que mostrar en la columna "Visítanos"? (evita un título sin contenido) */
export function tieneVisita(c = {}) {
  return Boolean(c.direccion?.linea) || (c.horario?.length ?? 0) > 0;
}

/** ¿Hay algo que mostrar en la columna "Conecta"? Una red sin enlace no cuenta. */
export function tieneConecta(c = {}) {
  return Boolean(c.whatsappVisible) || Boolean(c.correo) || (c.redes ?? []).some((r) => r.href);
}
