#!/usr/bin/env node
// Uso: node scripts/preparar-fotos-drive.mjs "<carpeta con los JPG descargados del Drive>"
// Recorta a 3:4 y deja cuatro anchos en WebP, igual que las fotos del estudio.
import sharp from "sharp";
import { join, resolve } from "node:path";
import { FOTOS_DRIVE, GIFT_CARD, ANCHOS } from "./assets-config.mjs";

const origen = process.argv[2];
if (!origen) {
  console.error('Uso: node scripts/preparar-fotos-drive.mjs "<carpeta con los JPG>"');
  process.exit(1);
}
const img = join(resolve(import.meta.dirname, ".."), "public/img");

for (const [nombre, { archivo, pos }] of Object.entries(FOTOS_DRIVE)) {
  for (const w of ANCHOS) {
    await sharp(join(origen, archivo)).rotate()
      .resize({ width: w, height: Math.round((w * 4) / 3), fit: "cover", position: pos })
      .webp({ quality: 78, effort: 5 })
      .toFile(join(img, `${nombre}-${w}.webp`));
  }
  console.log("foto", nombre);
}

// Gift card: sin recorte, proporción original.
for (const w of GIFT_CARD.anchos) {
  await sharp(join(origen, GIFT_CARD.archivo)).resize({ width: w }).webp({ quality: 82, effort: 5 })
    .toFile(join(img, `${GIFT_CARD.nombre}-${w}.webp`));
}
console.log("gift card");
