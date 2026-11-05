#!/usr/bin/env node
// Shrink photos before they're committed.
// -----------------------------------------
// Downscales JPEG/PNG/WebP images so the long side is at most MAX_SIDE px,
// re-encodes them (JPEG via mozjpeg), applies the EXIF rotation and strips all
// metadata (camera info, GPS location). A file is only rewritten when the
// result is meaningfully smaller, so running it again is a no-op.
//
// Usage:
//   npm run images                      # every image under the folders below
//   node scripts/compress_images.mjs a.jpg b.png   # just these files
//
// The pre-commit hook in .githooks/ runs it on staged images automatically
// (enable once per clone: git config core.hooksPath .githooks).

import sharp from 'sharp';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';

const MAX_SIDE = 2000;
const JPEG_QUALITY = 80;
const MIN_SAVING = 0.1; // rewrite only if at least 10% smaller
const DIRS = ['public/news', 'public/papers/figures', 'public/papers/thumbs', 'public'];
const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
// Icons are tiny and hand-made; leave them alone.
const SKIP = /(^|\/)(favicon|apple-touch-icon)[^/]*$/;

async function listImages() {
  const out = new Set();
  for (const dir of DIRS) {
    let entries = [];
    try { entries = await readdir(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      if (e.isFile() && EXTS.has(extname(e.name).toLowerCase())) out.add(join(dir, e.name));
    }
  }
  return [...out];
}

async function compress(file) {
  const ext = extname(file).toLowerCase();
  if (!EXTS.has(ext) || SKIP.test(file)) return;
  const input = await readFile(file);
  let img = sharp(input).rotate() // bake in EXIF orientation, then drop metadata
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true });
  if (ext === '.png') img = img.png({ compressionLevel: 9, palette: true, quality: 90 });
  else if (ext === '.webp') img = img.webp({ quality: JPEG_QUALITY });
  else img = img.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
  const output = await img.toBuffer();
  const kb = (n) => `${Math.round(n / 1024)} KB`;
  if (output.length < input.length * (1 - MIN_SAVING)) {
    await writeFile(file, output);
    console.log(`compressed ${relative('.', file)}: ${kb(input.length)} -> ${kb(output.length)}`);
  }
}

const files = process.argv.length > 2 ? process.argv.slice(2) : await listImages();
for (const f of files) await compress(f);
