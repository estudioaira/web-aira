import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { stat, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { FOTOS, FOTOS_DRIVE, GIFT_CARD, ANCHOS, LOGOS, COLORES } from "../scripts/assets-config.mjs";

const pub = fileURLToPath(new URL("../public/", import.meta.url));

for (const nombre of Object.keys(FOTOS)) {
  test(`foto ${nombre}: cuatro anchos, proporción 3:4`, async () => {
    for (const w of ANCHOS) {
      const m = await sharp(`${pub}img/${nombre}-${w}.webp`).metadata();
      assert.equal(m.width, w);
      assert.ok(Math.abs(m.width / m.height - 0.75) < 0.01, `${nombre}-${w} no es 3:4`);
    }
  });
}

for (const nombre of Object.keys(FOTOS_DRIVE)) {
  test(`foto del Drive ${nombre}: cuatro anchos, proporción 3:4`, async () => {
    for (const w of ANCHOS) {
      const m = await sharp(`${pub}img/${nombre}-${w}.webp`).metadata();
      assert.equal(m.width, w);
      assert.ok(Math.abs(m.width / m.height - 0.75) < 0.01, `${nombre}-${w} no es 3:4`);
    }
  });
}

test("gift card en tres anchos, proporción 8:5", async () => {
  for (const w of GIFT_CARD.anchos) {
    const m = await sharp(`${pub}img/${GIFT_CARD.nombre}-${w}.webp`).metadata();
    assert.equal(m.width, w);
    assert.ok(Math.abs(m.width / m.height - 1.6) < 0.01);
  }
});

test("mockup VIP en 800 y 1400, proporción 4:3", async () => {
  for (const w of [800, 1400]) {
    const m = await sharp(`${pub}img/mockup-vip-${w}.webp`).metadata();
    assert.equal(m.width, w);
    assert.ok(Math.abs(m.width / m.height - 4 / 3) < 0.01);
  }
});

for (const clave of Object.keys(LOGOS)) {
  for (const color of ["espresso", "marfil"]) {
    test(`${clave}-${color}.png es transparente y del color de marca`, async () => {
      const { data, info } = await sharp(`${pub}brand/${clave}-${color}.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      assert.equal(info.channels, 4);
      let opaco = null, transparente = false;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] === 255 && !opaco) opaco = [data[i], data[i + 1], data[i + 2]];
        if (data[i + 3] === 0) transparente = true;
      }
      assert.ok(transparente, "no tiene transparencia");
      assert.deepEqual(opaco, COLORES[color]);
    });
  }
}

test("favicon 128x128 y og 1200x630", async () => {
  const f = await sharp(pub + "brand/favicon.png").metadata();
  assert.deepEqual([f.width, f.height], [128, 128]);
  const o = await sharp(pub + "og.png").metadata();
  assert.deepEqual([o.width, o.height], [1200, 630]);
});

test("el peso de public/img queda bajo 12 MB", async () => {
  let total = 0;
  for (const f of await readdir(pub + "img")) total += (await stat(pub + "img/" + f)).size;
  assert.ok(total < 12 * 1024 * 1024, `public/img pesa ${(total / 1048576).toFixed(1)} MB`);
});
