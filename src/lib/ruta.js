/** Antepone la base del sitio (útil si se publica en una subcarpeta). */
export function ruta(p) {
  const base = (import.meta.env?.BASE_URL ?? "/").replace(/\/$/, "");
  return `${base}/${String(p).replace(/^\//, "")}`.replace(/\/{2,}/g, "/");
}
