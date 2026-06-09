// Redimensionne les visuels à leur taille réelle d'affichage pour supprimer les
// lenteurs (décodage de bitmaps géants). À relancer si on régénère des assets.
import sharp from "sharp";
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

async function webp(file, size, quality = 82) {
  const input = await readFile(file);
  const out = await sharp(input).resize(size, size, { fit: "cover" }).webp({ quality }).toBuffer();
  await writeFile(file, out);
  return out.length;
}
async function png(file, size) {
  const input = await readFile(file);
  const out = await sharp(input).resize(size, size, { fit: "inside" }).png({ compressionLevel: 9 }).toBuffer();
  await writeFile(file, out);
  return out.length;
}
async function webpW(file, width, quality = 80) {
  const input = await readFile(file);
  const out = await sharp(input).resize({ width }).webp({ quality }).toBuffer();
  await writeFile(file, out);
  return out.length;
}

const log = (f, n) => console.log(`${path.basename(f).padEnd(22)} ${Math.round(n / 1024)} KB`);

// Avatars : affichés ≤ 64px → 128px couvre le retina
const aDir = path.join(root, "public/artisans");
for (const f of await readdir(aDir)) {
  if (f.endsWith(".webp")) log(f, await webp(path.join(aDir, f), 128));
}

// Logos / icônes
log("logo.png", await png(path.join(root, "public/brand/logo.png"), 256));
log("logo-mark.png", await png(path.join(root, "public/brand/logo-mark.png"), 256));
log("icon.png", await png(path.join(root, "src/app/icon.png"), 256));
log("apple-icon.png", await png(path.join(root, "src/app/apple-icon.png"), 180));

// Hero / poster (affiché ≤ 360px de large) → 720px retina
log("hero-closer.webp", await webpW(path.join(root, "public/brand/hero-closer.webp"), 720));

console.log("✓ assets redimensionnés");
