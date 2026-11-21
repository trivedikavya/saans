/**
 * WCAG AA contrast checker for every AQI color pair (lib/constants.ts).
 *
 * Run with `npm run check:contrast`. Exits non-zero (and prints a table)
 * if any AQI band's background/foreground pair falls below the WCAG AA
 * threshold for normal text (4.5:1). This is the automated proof for the
 * "Measure WCAG AA contrast for EVERY AQI color pair" requirement -- it is
 * not a visual/manual check, it's exact math run in CI on every push.
 */
import { fileURLToPath } from "node:url";
import { AQI_BANDS } from "../lib/constants";

const AA_NORMAL_TEXT_THRESHOLD = 4.5;

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const value = parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** sRGB -> linear-light conversion per the WCAG 2.x relative luminance formula. */
function srgbChannelToLinear(channel255: number): number {
  const channel = channel255 / 255;
  return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rl, gl, bl] = [r, g, b].map(srgbChannelToLinear);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/** WCAG contrast ratio between two hex colors, in the range [1, 21]. */
export function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexToRgb(hexA)) + 0.05;
  const lumB = relativeLuminance(hexToRgb(hexB)) + 0.05;
  return lumA > lumB ? lumA / lumB : lumB / lumA;
}

function main() {
  let allPass = true;
  const rows: { band: string; bg: string; fg: string; ratio: string; pass: string }[] = [];

  for (const band of AQI_BANDS) {
    const ratio = contrastRatio(band.bg, band.fg);
    const pass = ratio >= AA_NORMAL_TEXT_THRESHOLD;
    if (!pass) allPass = false;
    rows.push({ band: band.label, bg: band.bg, fg: band.fg, ratio: ratio.toFixed(2), pass: pass ? "PASS" : "FAIL" });
  }

  console.table(rows);

  if (!allPass) {
    console.error(`\nOne or more AQI color pairs fall below the WCAG AA threshold of ${AA_NORMAL_TEXT_THRESHOLD}:1 for normal text.`);
    process.exit(1);
  }

  console.log(`\nAll ${rows.length} AQI color pairs meet WCAG AA (>= ${AA_NORMAL_TEXT_THRESHOLD}:1).`);
}

// Only run as a CLI script (`npm run check:contrast`) -- not when imported
// by tests, so `contrastRatio` can be unit-tested without triggering
// `process.exit()` as a side effect of importing this module.
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  main();
}
