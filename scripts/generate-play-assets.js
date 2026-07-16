/**
 * Generates Google Play developer-profile assets:
 *  - play-assets/developer-icon-512.png  (512x512, opaque PNG)
 *  - play-assets/header-4096x2304.jpg    (JPEG, < 1MB)
 * Brand gradient: #FF6B6B -> #C44FE8 -> #6B5BFF diagonal + soft radial glow.
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const jpeg = require('jpeg-js');

const STOPS = [
  [0xff, 0x6b, 0x6b],
  [0xc4, 0x4f, 0xe8],
  [0x6b, 0x5b, 0xff],
];

function gradientAt(t) {
  const clamped = Math.min(1, Math.max(0, t));
  const seg = clamped < 0.5 ? 0 : 1;
  const local = (clamped - seg * 0.5) / 0.5;
  const [a, b] = [STOPS[seg], STOPS[seg + 1]];
  return [
    Math.round(a[0] + (b[0] - a[0]) * local),
    Math.round(a[1] + (b[1] - a[1]) * local),
    Math.round(a[2] + (b[2] - a[2]) * local),
  ];
}

/** Renders the brand look into an RGBA buffer. */
function renderBrand(width, height, glow) {
  const data = Buffer.alloc(width * height * 4);
  const diag = width + height;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = (x + y) / diag;
      let [r, g, b] = gradientAt(t);

      if (glow) {
        const dx = (x - width * glow.cx) / (width * glow.radius);
        const dy = (y - height * glow.cy) / (height * glow.radius);
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 1) {
          const strength = Math.pow(1 - d, 2) * glow.alpha;
          r = Math.round(r + (255 - r) * strength);
          g = Math.round(g + (255 - g) * strength);
          b = Math.round(b + (255 - b) * strength);
        }
      }

      const idx = (y * width + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
  return data;
}

const outDir = path.join(__dirname, '..', 'play-assets');
fs.mkdirSync(outDir, { recursive: true });

// 1. Developer icon 512x512 PNG (opaque, centered glow like the app icon)
{
  const size = 512;
  const png = new PNG({ width: size, height: size });
  renderBrand(size, size, { cx: 0.5, cy: 0.42, radius: 0.75, alpha: 0.30 }).copy(png.data);
  fs.writeFileSync(path.join(outDir, 'developer-icon-512.png'), PNG.sync.write(png));
}

// 2. Header 4096x2304 JPEG (glow offset toward upper-left for depth)
{
  const width = 4096;
  const height = 2304;
  const rgba = renderBrand(width, height, { cx: 0.32, cy: 0.38, radius: 0.9, alpha: 0.26 });
  const encoded = jpeg.encode({ data: rgba, width, height }, 88);
  fs.writeFileSync(path.join(outDir, 'header-4096x2304.jpg'), encoded.data);
}

for (const f of fs.readdirSync(outDir)) {
  const stat = fs.statSync(path.join(outDir, f));
  console.log(`${f}  ${(stat.size / 1024).toFixed(0)} KB`);
}
