#!/usr/bin/env node
/**
 * Lumina brand icon generator.
 *
 * Draws every app-icon asset (Android legacy launcher mipmaps, Android
 * adaptive-icon foreground, iOS App Store icon) programmatically with
 * `pngjs` — no external image libraries, no fonts, no text.
 *
 * Artwork: a 3-stop diagonal (top-left -> bottom-right) linear gradient
 *   #FF6B6B (coral) -> #C44FE8 (magenta) -> #6B5BFF (violet)
 * with a subtle centered radial white glow blended on top (alpha falloff
 * from the center, ~28% max alpha at the center fading to 0), evoking
 * "lumina" light. Purely abstract geometry — no letters/logos.
 *
 * Usage: node scripts/generate-icons.js
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const ROOT = path.resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Brand palette
// ---------------------------------------------------------------------------

/** @type {{ t: number, rgb: [number, number, number] }[]} */
const GRADIENT_STOPS = [
  { t: 0, rgb: [0xff, 0x6b, 0x6b] }, // #FF6B6B coral
  { t: 0.5, rgb: [0xc4, 0x4f, 0xe8] }, // #C44FE8 magenta
  { t: 1, rgb: [0x6b, 0x5b, 0xff] }, // #6B5BFF violet
];

const GLOW_MAX_ALPHA = 0.28; // full-icon overlay: ~28% at center
const FOREGROUND_GLOW_MAX_ALPHA = 0.92; // standalone glow mark: near-opaque core

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;

/** Smoothstep-style falloff: 1 at d=0, 0 at d>=1. */
function falloff(d) {
  const t = clamp(1 - d, 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * 3-stop piecewise-linear interpolation along the gradient.
 * @param {number} t normalized position 0..1 along the diagonal axis
 * @returns {[number, number, number]}
 */
function gradientColorAt(t) {
  const clamped = clamp(t, 0, 1);
  for (let i = 0; i < GRADIENT_STOPS.length - 1; i += 1) {
    const a = GRADIENT_STOPS[i];
    const b = GRADIENT_STOPS[i + 1];
    if (clamped >= a.t && clamped <= b.t) {
      const localT = (clamped - a.t) / (b.t - a.t);
      return [
        Math.round(lerp(a.rgb[0], b.rgb[0], localT)),
        Math.round(lerp(a.rgb[1], b.rgb[1], localT)),
        Math.round(lerp(a.rgb[2], b.rgb[2], localT)),
      ];
    }
  }
  return GRADIENT_STOPS[GRADIENT_STOPS.length - 1].rgb;
}

/**
 * Renders the full brand artwork (gradient + centered white glow overlay)
 * as an opaque RGBA buffer. Used for every "flat" icon: Android legacy
 * launcher mipmaps and the iOS App Store icon.
 * @param {number} w
 * @param {number} h
 * @returns {Buffer}
 */
function renderFlatIcon(w, h) {
  const buffer = Buffer.alloc(w * h * 4);
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const cornerDist = Math.sqrt(cx * cx + cy * cy);

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      // Diagonal gradient axis: project (x, y) onto the top-left -> bottom-right
      // diagonal, normalized to 0..1 across the full extent of the image.
      const t = (x / Math.max(w - 1, 1) + y / Math.max(h - 1, 1)) / 2;
      const [gr, gg, gb] = gradientColorAt(t);

      // Radial white glow: distance from center, normalized by distance to
      // the corner, falling off smoothly to 0.
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) / cornerDist;
      const glowAlpha = GLOW_MAX_ALPHA * falloff(dist);

      const r = Math.round(lerp(gr, 255, glowAlpha));
      const g = Math.round(lerp(gg, 255, glowAlpha));
      const b = Math.round(lerp(gb, 255, glowAlpha));

      const idx = (y * w + x) * 4;
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = 255; // fully opaque
    }
  }

  return buffer;
}

/**
 * Renders the Android adaptive-icon foreground: a transparent-background
 * radial white glow "mark", kept within the adaptive-icon safe zone
 * (roughly the centered 66% of the canvas) so it isn't clipped by the
 * circle/squircle/rounded-square masks applied by different launchers.
 * @param {number} size
 * @returns {Buffer}
 */
function renderForeground(size) {
  const buffer = Buffer.alloc(size * size * 4);
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const halfSize = size / 2;
  // Keep the glow's falloff radius comfortably inside the ~66%-diameter
  // adaptive-icon safe zone (33% radius) so it survives circular/rounded
  // masking on any launcher.
  const maxRadius = halfSize * 0.6;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) / maxRadius;
      const alpha = FOREGROUND_GLOW_MAX_ALPHA * falloff(dist);

      const idx = (y * size + x) * 4;
      buffer[idx] = 255;
      buffer[idx + 1] = 255;
      buffer[idx + 2] = 255;
      buffer[idx + 3] = Math.round(clamp(alpha, 0, 1) * 255);
    }
  }

  return buffer;
}

// ---------------------------------------------------------------------------
// PNG I/O
// ---------------------------------------------------------------------------

/**
 * @param {string} filePath
 * @param {number} width
 * @param {number} height
 * @param {Buffer} rgbaData
 * @param {{ opaque?: boolean }} [options] opaque=true drops the alpha
 *   channel entirely (colorType 2, truecolor without alpha) — required
 *   for iOS App Store icons.
 */
function writePng(filePath, width, height, rgbaData, options = {}) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const packOptions = options.opaque
    ? { width, height, colorType: 2, inputColorType: 6, inputHasAlpha: true }
    : { width, height };
  const buffer = PNG.sync.write({ width, height, data: rgbaData }, packOptions);
  fs.writeFileSync(filePath, buffer);
}

/**
 * Reads back a PNG's IHDR chunk directly (signature[8] + length[4] +
 * "IHDR"[4] + width[4] + height[4] + bitDepth[1] + colorType[1] + ...),
 * independent of pngjs's decoder, as an independent self-check.
 * @param {string} filePath
 * @returns {{ width: number, height: number, colorType: number } | null}
 */
function readIHDR(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const buf = fs.readFileSync(filePath);
  const PNG_SIGNATURE = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  if (buf.length < 33 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return null;
  }
  const chunkType = buf.toString("ascii", 12, 16);
  if (chunkType !== "IHDR") return null;
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    colorType: buf.readUInt8(25),
  };
}

// ---------------------------------------------------------------------------
// Android
// ---------------------------------------------------------------------------

const ANDROID_RES = path.join(ROOT, "android/app/src/main/res");

const ANDROID_DENSITIES = [
  { name: "mdpi", size: 48 },
  { name: "hdpi", size: 72 },
  { name: "xhdpi", size: 96 },
  { name: "xxhdpi", size: 144 },
  { name: "xxxhdpi", size: 192 },
];

const FOREGROUND_SIZE = 432;

const ADAPTIVE_ICON_XML = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;

// android:angle on a <gradient> shape must be a multiple of 45; 315 runs
// the gradient from the top-left corner to the bottom-right corner.
const BACKGROUND_DRAWABLE_XML = `<?xml version="1.0" encoding="utf-8"?>
<!-- Approximates the brand diagonal gradient (top-left -> bottom-right).
     Shape gradients only support a straight linear ramp, so the radial
     glow highlight lives in the foreground layer instead. -->
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <gradient
        android:type="linear"
        android:angle="315"
        android:startColor="#FF6B6B"
        android:centerColor="#C44FE8"
        android:endColor="#6B5BFF" />
</shape>
`;

function generateAndroid() {
  /** @type {{ file: string, width: number, height: number }[]} */
  const generated = [];

  for (const density of ANDROID_DENSITIES) {
    const dir = path.join(ANDROID_RES, `mipmap-${density.name}`);
    const data = renderFlatIcon(density.size, density.size);
    for (const name of ["ic_launcher.png", "ic_launcher_round.png"]) {
      const filePath = path.join(dir, name);
      writePng(filePath, density.size, density.size, data);
      generated.push({ file: filePath, width: density.size, height: density.size });
    }
  }

  // Adaptive icon foreground (transparent glow mark).
  const foregroundPath = path.join(
    ANDROID_RES,
    "mipmap-xxxhdpi/ic_launcher_foreground.png"
  );
  const foregroundData = renderForeground(FOREGROUND_SIZE);
  writePng(foregroundPath, FOREGROUND_SIZE, FOREGROUND_SIZE, foregroundData);
  generated.push({
    file: foregroundPath,
    width: FOREGROUND_SIZE,
    height: FOREGROUND_SIZE,
  });

  // Adaptive icon XML (no mipmap-anydpi-v26 existed in this template yet —
  // this project only shipped legacy launcher mipmaps, so we add adaptive
  // icon support fresh rather than replacing anything).
  const anydpiDir = path.join(ANDROID_RES, "mipmap-anydpi-v26");
  fs.mkdirSync(anydpiDir, { recursive: true });
  const ic_launcher_xml = path.join(anydpiDir, "ic_launcher.xml");
  const ic_launcher_round_xml = path.join(anydpiDir, "ic_launcher_round.xml");
  fs.writeFileSync(ic_launcher_xml, ADAPTIVE_ICON_XML);
  fs.writeFileSync(ic_launcher_round_xml, ADAPTIVE_ICON_XML);
  generated.push({ file: ic_launcher_xml, width: null, height: null });
  generated.push({ file: ic_launcher_round_xml, width: null, height: null });

  // Background gradient drawable referenced by the adaptive icon XML above.
  const backgroundDrawablePath = path.join(
    ANDROID_RES,
    "drawable/ic_launcher_background.xml"
  );
  fs.mkdirSync(path.dirname(backgroundDrawablePath), { recursive: true });
  fs.writeFileSync(backgroundDrawablePath, BACKGROUND_DRAWABLE_XML);
  generated.push({ file: backgroundDrawablePath, width: null, height: null });

  // Reconcile values/colors.xml: this template had none, and no prior
  // `ic_launcher_background` color resource to remove/rename, so there is
  // nothing dangling to clean up. (Verified by inspection before writing
  // this script — see script header / task report.)

  return generated;
}

// ---------------------------------------------------------------------------
// iOS
// ---------------------------------------------------------------------------

const IOS_APPICONSET = path.join(
  ROOT,
  "ios/Lumina/Images.xcassets/AppIcon.appiconset"
);
const IOS_ICON_SIZE = 1024;
const IOS_ICON_FILENAME = "icon.png";

function generateIOS() {
  const iconPath = path.join(IOS_APPICONSET, IOS_ICON_FILENAME);
  const data = renderFlatIcon(IOS_ICON_SIZE, IOS_ICON_SIZE);
  writePng(iconPath, IOS_ICON_SIZE, IOS_ICON_SIZE, data, { opaque: true });

  const contentsPath = path.join(IOS_APPICONSET, "Contents.json");
  const contents = JSON.parse(fs.readFileSync(contentsPath, "utf8"));
  let updated = false;
  for (const image of contents.images) {
    if (image.idiom === "ios-marketing" && image.size === "1024x1024") {
      if (image.filename !== IOS_ICON_FILENAME) {
        image.filename = IOS_ICON_FILENAME;
        updated = true;
      }
    }
  }
  if (updated || !contents.images.some((img) => img.filename)) {
    fs.writeFileSync(contentsPath, `${JSON.stringify(contents, null, 2)}\n`);
  }

  return [
    { file: iconPath, width: IOS_ICON_SIZE, height: IOS_ICON_SIZE },
    { file: contentsPath, width: null, height: null },
  ];
}

// ---------------------------------------------------------------------------
// Main / self-verification
// ---------------------------------------------------------------------------

function main() {
  const androidFiles = generateAndroid();
  const iosFiles = generateIOS();
  const allFiles = [...androidFiles, ...iosFiles];

  console.log("\nLumina icon generation — verification\n");
  const rows = [];
  let ok = true;

  for (const expected of allFiles) {
    const relPath = path.relative(ROOT, expected.file);
    const exists = fs.existsSync(expected.file);

    if (expected.width == null) {
      // Non-PNG resource (XML / JSON) — existence check only.
      rows.push([relPath, "-", exists ? "OK" : "MISSING"]);
      if (!exists) ok = false;
      continue;
    }

    const ihdr = readIHDR(expected.file);
    const matches =
      ihdr !== null &&
      ihdr.width === expected.width &&
      ihdr.height === expected.height;
    rows.push([
      relPath,
      `${expected.width}x${expected.height}`,
      matches
        ? `OK${ihdr.colorType === 2 ? " (opaque)" : ""}`
        : ihdr
        ? `MISMATCH (found ${ihdr.width}x${ihdr.height})`
        : "MISSING",
    ]);
    if (!matches) ok = false;
  }

  const col1 = Math.max(...rows.map((r) => r[0].length)) + 2;
  const col2 = Math.max(...rows.map((r) => r[1].length)) + 2;
  for (const [file, size, status] of rows) {
    console.log(`${file.padEnd(col1)}${size.padEnd(col2)}${status}`);
  }

  console.log(
    ok
      ? "\nAll icon assets generated and verified successfully.\n"
      : "\nERROR: one or more icon assets are missing or the wrong size.\n"
  );

  if (!ok) process.exit(1);
}

main();
