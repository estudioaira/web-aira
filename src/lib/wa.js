/** Enlace de WhatsApp con mensaje prellenado. El número se limpia a solo dígitos. */
export function enlaceWa(numero, mensaje = "") {
  const limpio = String(numero).replace(/\D/g, "");
  const base = `https://wa.me/${limpio}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}
