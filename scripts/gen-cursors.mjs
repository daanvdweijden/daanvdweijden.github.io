// Generates the PNG cursor dots as base64 data URIs, emitted as a CSS file.
// PNG (not SVG) because Safari doesn't support SVG data-URI cursors.
import zlib from 'node:zlib';
import fs from 'node:fs';

const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** Anti-aliased filled circle, RGBA, size x size, radius = size/4 (a 10px dot at 1x). */
function dotPng(size, hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const c = size / 2;
  const radius = size / 4;
  const SS = 4; // supersample factor for the edge
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      let hits = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const dx = x + (sx + 0.5) / SS - c;
          const dy = y + (sy + 0.5) / SS - c;
          if (dx * dx + dy * dy <= radius * radius) hits++;
        }
      }
      const a = Math.round((hits / (SS * SS)) * 255);
      raw[p++] = r; raw[p++] = g; raw[p++] = b; raw[p++] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const uri = (size, hex) => `url("data:image/png;base64,${dotPng(size, hex).toString('base64')}")`;
// Two declarations: the plain 1x url for browsers that don't take image-set() in
// `cursor`, then the retina-aware one. `auto` tail so a failed decode degrades to
// the native arrow instead of no cursor at all. !important because Astro scopes
// page styles with [data-astro-cid-…], which outranks anything we can write here.
const decls = (prop, hex) =>
  `${prop}: ${uri(20, hex)} 10 10, auto !important;\n` +
  `    ${prop}: image-set(${uri(20, hex)} 1x, ${uri(40, hex)} 2x) 10 10, auto !important;`;
const cursor = (hex) => decls('cursor', hex);

// Accent tokens, resolved per theme (data URIs can't read CSS custom properties).
const PALETTE = {
  light: { ink: '#1f1f1f', red: '#9f2f2d', blue: '#1f6c9f', green: '#346538' },
  dark:  { ink: '#e9e9e6', red: '#f0a8a4', blue: '#8ec9ec', green: '#8fca94' },
};

const lines = [];
lines.push(`/* GENERATED FILE — see scripts/gen-cursors.mjs, do not hand-edit.

   The custom cursor is a native \`cursor: url()\` image rather than a JS-driven
   overlay: the OS draws it, so it can never lag behind the real pointer and
   never flickers back to a native shape over links or buttons.

   PNG rather than SVG because Safari ignores SVG data-URI cursors. Each dot is
   baked per accent AND per theme, since a data URI can't reference a custom
   property. Fine pointers only — touch devices get nothing here anyway. */
@media (pointer: fine) {`);

for (const [theme, colors] of Object.entries(PALETTE)) {
  const scope = theme === 'dark' ? `html[data-theme='dark']` : `html:not([data-theme='dark'])`;
  lines.push(`\n  /* ---- ${theme} ---- */`);
  lines.push(`  ${scope}, ${scope} * {\n    ${cursor(colors.ink)}\n  }`);
  for (const key of ['red', 'blue', 'green']) {
    lines.push(
      `  ${scope}[data-page-accent='${key}'], ${scope}[data-page-accent='${key}'] *,\n` +
      `  ${scope} [data-cursor='${key}'], ${scope} [data-cursor='${key}'] * {\n    ${cursor(colors[key])}\n  }`
    );
  }
}
lines.push('}\n');

fs.writeFileSync(process.argv[2], lines.join('\n'));
console.error(`wrote ${process.argv[2]} (${(fs.statSync(process.argv[2]).size / 1024).toFixed(1)} KB)`);
