#!/usr/bin/env node
// Uso: node scripts/preparar-assets.mjs "<carpeta insumos web>"
import sharp from "sharp";
import { join, resolve } from "node:path";
import { FOTOS, ANCHOS, LOGOS, COLORES, MOCKUP_VIP } from "./assets-config.mjs";

const origen = process.argv[2];
if (!origen) {
  console.error('Uso: node scripts/preparar-assets.mjs "<carpeta insumos web>"');
  process.exit(1);
}
const raiz = resolve(import.meta.dirname, "..");
const img = join(raiz, "public/img");
const marca = join(raiz, "public/brand");

/** Logo negro sobre transparente → mismo trazo en otro color, recortado al contenido. */
async function logoColor(archivo, [r, g, b], ancho) {
  const src = sharp(join(origen, "ENTREGABLES AIRA/LOGOS", archivo)).ensureAlpha();
  const { width, height } = await src.metadata();
  const alfa = await src.clone().extractChannel(3).raw().toBuffer();
  const buf = await sharp({ create: { width, height, channels: 3, background: { r, g, b } } })
    .joinChannel(alfa, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer();
  const { data, info } = await sharp(buf).trim({ threshold: 1 }).resize({ width: ancho })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  // El remuestreo altera un poco el RGB de los bordes: se fija el color exacto y solo el alfa varía.
  for (let i = 0; i < data.length; i += 4) { data[i] = r; data[i + 1] = g; data[i + 2] = b; }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ compressionLevel: 9 }).toBuffer();
}

for (const [nombre, archivo] of Object.entries(FOTOS)) {
  for (const w of ANCHOS) {
    await sharp(join(origen, archivo)).rotate().resize({ width: w }).webp({ quality: 78, effort: 5 })
      .toFile(join(img, `${nombre}-${w}.webp`));
  }
  console.log("foto", nombre);
}

for (const w of MOCKUP_VIP.anchos) {
  await sharp(join(origen, MOCKUP_VIP.archivo)).resize({ width: w }).webp({ quality: 80, effort: 5 })
    .toFile(join(img, `mockup-vip-${w}.webp`));
}
console.log("mockup vip");

const buffers = {};
for (const [clave, { archivo, ancho }] of Object.entries(LOGOS)) {
  for (const [color, rgb] of Object.entries(COLORES)) {
    const buf = await logoColor(archivo, rgb, ancho);
    buffers[`${clave}-${color}`] = buf;
    await sharp(buf).toFile(join(marca, `${clave}-${color}.png`));
  }
  console.log("logo", clave);
}

// Favicon: isotipo espresso sobre marfil.
const iso = await sharp(buffers["isotipo-espresso"]).resize({ width: 96 }).toBuffer();
await sharp({ create: { width: 128, height: 128, channels: 3, background: { r: 246, g: 245, b: 227 } } })
  .composite([{ input: iso, gravity: "center" }]).png().toFile(join(marca, "favicon.png"));

// Imagen para redes: logo con "The Pilates House" centrado sobre marfil.
const logoOg = await sharp(buffers["logo-casa-espresso"]).resize({ width: 520 }).toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: { r: 246, g: 245, b: 227 } } })
  .composite([{ input: logoOg, gravity: "center" }]).png().toFile(join(raiz, "public/og.png"));
console.log("favicon y og");
