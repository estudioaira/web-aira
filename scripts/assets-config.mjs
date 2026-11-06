// Configuración compartida por preparar-assets.mjs y sus pruebas.

/** nombre de salida → archivo original en la carpeta de insumos.
 *  "Marzo-7 (4)" es idéntico byte a byte a "Marzo-7 (3)": no se usa. */
export const FOTOS = {
  "estudio-recepcion": "Espacios Aira - Marzo-1 (6).jpg.jpeg",
  "estudio-pelotas": "Espacios Aira - Marzo-10 (4).jpg.jpeg",
  "estudio-sala": "Espacios Aira - Marzo-12 (1).jpg.jpeg",
  "estudio-nichos": "Espacios Aira - Marzo-2 (2).jpg.jpeg",
  "estudio-toallas": "Espacios Aira - Marzo-3 (3).jpg.jpeg",
  "estudio-cortinas": "Espacios Aira - Marzo-7 (3).jpg.jpeg",
};
export const ANCHOS = [480, 800, 1200, 1800];

/** clave → { archivo de ENTREGABLES AIRA/LOGOS (negro sobre transparente), ancho de salida } */
export const LOGOS = {
  logo: { archivo: "logos_AIRA-18.png", ancho: 560 },
  "logo-casa": { archivo: "logos_AIRA-12.png", ancho: 700 },
  "logo-eslogan": { archivo: "logos_AIRA-06.png", ancho: 700 },
  isotipo: { archivo: "logos_AIRA-48.png", ancho: 240 },
};
export const COLORES = { espresso: [96, 85, 74], marfil: [246, 245, 227] };
export const MOCKUP_VIP = { archivo: "ENTREGABLES AIRA/MOCKUPS/aira vip card.png", anchos: [800, 1400] };

/** Fotos del Drive del cliente (Despedidas, Día de la mujer, Inauguración), para Experiencias y El estudio.
 *  nombre de salida → { archivo en la carpeta de descarga, posición del recorte 3:4 }. */
export const FOTOS_DRIVE = {
  "celebra-despedida": { archivo: "whatsapp-07.jpg", pos: "centre" },
  "momento-veil": { archivo: "whatsapp-02.jpg", pos: "centre" },
  "momento-grupo": { archivo: "whatsapp-03.jpg", pos: "centre" },
  "momento-clase": { archivo: "whatsapp-06.jpg", pos: "centre" },
  "momento-brindis": { archivo: "whatsapp-08.jpg", pos: "centre" },
  "momento-sala": { archivo: "whatsapp-10.jpg", pos: "centre" },
  "momento-flores": { archivo: "whatsapp-13.jpg", pos: "centre" },
  "celebra-globos": { archivo: "soltera-09.jpg", pos: "centre" },
  "celebra-empresarial": { archivo: "inaug-29.jpg", pos: "centre" },
  "momento-flor": { archivo: "mujer-03.jpg", pos: "centre" },
  "momento-regalo": { archivo: "mujer-05.jpg", pos: "centre" },
  "estudio-zonas-verdes": { archivo: "inaug-36.jpg", pos: "centre" },
  "estudio-lockers": { archivo: "inaug-23.jpg", pos: "centre" },
  "estudio-reformers-logo": { archivo: "inaug-19.jpg", pos: "centre" },
};

/** Gift card enviada por la clienta (2000 × 1250, proporción 8:5). Se prepara con preparar-fotos-drive.mjs. */
export const GIFT_CARD = { nombre: "gift-card", archivo: "gift-card.jpg", anchos: [800, 1200, 1800] };
