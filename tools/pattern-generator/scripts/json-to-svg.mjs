/**
 * json-to-svg.mjs
 *
 * パッチワークデザイン JSON から SVG プレビューを生成する。
 *
 * 使い方:
 *   node scripts/json-to-svg.mjs <design.json> [output.svg] [--size=400] [--colors=c1,c2,...]
 *
 * 出力先省略時: assets/designs/<id>.svg
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../../..');

// ── デフォルトパレット（布地らしい色合い） ─────────────────────────────────
const DEFAULT_COLORS = [
  '#e8c4b8', // warm rose
  '#f5f0e8', // cream
  '#c4bde8', // lavender
  '#b8d4c4', // sage green
  '#e8dbb8', // golden
  '#d4b8c4', // dusty pink
  '#b8c4d4', // slate blue
  '#d4c4b8', // sand
  '#c8e0d0', // mint
  '#e0c8d8', // mauve
];

// ── 引数パース ────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { jsonPath: null, outputPath: null, size: 400, colors: null };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--size=')) {
      args.size = parseInt(arg.slice(7), 10);
    } else if (arg.startsWith('--colors=')) {
      args.colors = arg.slice(9).split(',').map((c) => c.trim());
    } else if (!args.jsonPath) {
      args.jsonPath = resolve(arg);
    } else if (!args.outputPath) {
      args.outputPath = resolve(arg);
    }
  }
  return args;
}

// ── SVG パスのスケーリング（pathBuilder.ts の scalePath と同ロジック） ───────
// A コマンドの 7 パラメータ: rx ry x-rotation large-arc sweep-flag x y
// インデックス 2,3,4（x-rotation, large-arc-flag, sweep-flag）はスケールしない
function scalePath(d, factor) {
  const ARC_SKIP = new Set([2, 3, 4]);
  const tokens =
    d.match(/[MmLlHhVvCcSsQqTtAaZz]|[+-]?(?:\d*\.)?\d+(?:[eE][+-]?\d+)?/g) ?? [];

  let cmd = '';
  let paramIdx = 0;

  return tokens
    .map((token) => {
      if (/^[MmLlHhVvCcSsQqTtAaZz]$/.test(token)) {
        cmd = token;
        paramIdx = 0;
        return token;
      }
      const isArc = cmd === 'A' || cmd === 'a';
      const skip = isArc && ARC_SKIP.has(paramIdx % 7);
      paramIdx++;
      return skip ? token : String(Math.round(parseFloat(token) * factor * 1e6) / 1e6);
    })
    .join(' ');
}

// ── SVG 生成 ─────────────────────────────────────────────────────────────
function generateSvg(design, size, palette) {
  const stroke = Math.max(0.5, size * 0.002);

  const pathElements = design.polygons
    .map((polygon, i) => {
      const scaledPath = scalePath(polygon.path, size);
      const fill = palette[i % palette.length];
      return [
        `  <path`,
        `    id="${polygon.id}"`,
        `    d="${scaledPath}"`,
        `    fill="${fill}"`,
        `    stroke="#2c2c2c"`,
        `    stroke-width="${stroke}"`,
        `    stroke-linejoin="round"`,
        `  >`,
        `    <title>${polygon.label}</title>`,
        `  </path>`,
      ].join('\n');
    })
    .join('\n');

  const title = design.nameJa ? `${design.nameJa} (${design.name})` : design.name;

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg"`,
    `  viewBox="0 0 ${size} ${size}"`,
    `  width="${size}" height="${size}"`,
    `>`,
    `  <title>${title}</title>`,
    `  <rect width="${size}" height="${size}" fill="#ffffff"/>`,
    pathElements,
    `</svg>`,
  ].join('\n');
}

// ── メイン ───────────────────────────────────────────────────────────────
const args = parseArgs(process.argv);

if (!args.jsonPath) {
  console.error(
    'Usage: node json-to-svg.mjs <design.json> [output.svg] [--size=400] [--colors=c1,c2,...]',
  );
  process.exit(1);
}

let designFile;
try {
  designFile = JSON.parse(readFileSync(args.jsonPath, 'utf-8'));
} catch (e) {
  console.error(`Error reading ${args.jsonPath}: ${e.message}`);
  process.exit(1);
}

const design = designFile.design;
if (!design?.polygons?.length) {
  console.error('Invalid design file: missing design.polygons');
  process.exit(1);
}

const palette = args.colors ?? DEFAULT_COLORS;
const svg = generateSvg(design, args.size, palette);

// 出力先の決定
let outputPath = args.outputPath;
if (!outputPath) {
  const assetsDir = join(PROJECT_ROOT, 'assets', 'designs');
  mkdirSync(assetsDir, { recursive: true });
  outputPath = join(assetsDir, `${design.id}.svg`);
}

writeFileSync(outputPath, svg, 'utf-8');

console.log(`✓ SVG 生成完了: ${outputPath}`);
console.log(`  パターン: ${design.nameJa ?? design.name} (${design.polygons.length} ピース)`);
console.log(`  サイズ: ${args.size}×${args.size}px`);
