#!/usr/bin/env node
// Shrinks photos in public/images in place: max 1600 px wide, JPEG q80 (mozjpeg).
// Keeps file names so no URL changes. Skips files already under 400 KB.
// Usage: npm run images:optimize
import { readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = new URL('../public/images/', import.meta.url).pathname;
const LIMIT = 400_000;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.jpe?g$/i.test(entry.name)) yield full;
  }
}

let saved = 0;
for await (const file of walk(ROOT)) {
  const before = (await stat(file)).size;
  if (before < LIMIT) continue;
  const output = await sharp(file).rotate().resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  if (output.length >= before) continue;
  await writeFile(file, output);
  saved += before - output.length;
  console.log(`${path.relative(ROOT, file)}: ${(before / 1e6).toFixed(2)} MB -> ${(output.length / 1e6).toFixed(2)} MB`);
}
console.log(`Saved ${(saved / 1e6).toFixed(1)} MB`);
