// デザインJSONからSVGサムネイルを生成するスクリプト
// 使用法: node scripts/generate-design-svgs.js
'use strict';

const fs = require('fs');
const path = require('path');

const SCALE = 400;

const COLORS = [
  '#e8c4b8', '#f5f0e8', '#c4bde8', '#b8d4c4', '#e8dbb8', '#d4b8c4',
  '#b8c4d4', '#d4c4b8', '#c8e0d0', '#e0d4c8', '#c8c4e0', '#d4e0c8',
  '#e0c8d4', '#c4d4e0', '#e8e0c4', '#d0c8e8',
];

/**
 * SVGパスデータ内の座標を scale 倍に変換する。
 * ArcコマンドのフラグおよびX軸回転角は変換しない。
 */
function scalePath(d, scale) {
  const tokens = d.match(/[MLHVCSQTAZmlhvcsqtaz]|[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g);
  if (!tokens) return d;

  const out = [];
  let i = 0;

  const scaleNum = () => {
    out.push(formatNum(parseFloat(tokens[i++]) * scale));
  };
  const keepNum = () => {
    out.push(tokens[i++]);
  };

  while (i < tokens.length) {
    const token = tokens[i];
    if (!/[A-Za-z]/.test(token)) {
      i++;
      continue;
    }
    const cmd = token;
    out.push(cmd);
    i++;
    const upper = cmd.toUpperCase();

    while (i < tokens.length && !/[A-Za-z]/.test(tokens[i])) {
      if (upper === 'Z') {
        break;
      } else if (upper === 'H') {
        scaleNum();
      } else if (upper === 'V') {
        scaleNum();
      } else if (upper === 'A') {
        scaleNum(); // rx
        scaleNum(); // ry
        keepNum();  // x-rotation
        keepNum();  // large-arc-flag
        keepNum();  // sweep-flag
        scaleNum(); // x
        scaleNum(); // y
      } else {
        // M, L, T, C, S, Q
        scaleNum();
      }
    }
  }

  return out.join(' ');
}

function formatNum(n) {
  return parseFloat(n.toFixed(4)).toString();
}

function buildSvg(design) {
  const { name, nameJa, polygons } = design;
  const pathElements = polygons.map((polygon, idx) => {
    const color = COLORS[idx % COLORS.length];
    const scaledD = scalePath(polygon.path, SCALE);
    return `  <path\n    id="${polygon.id}"\n    d="${scaledD}"\n    fill="${color}"\n    stroke="#2c2c2c"\n    stroke-width="0.8"\n    stroke-linejoin="round"\n  />`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 ${SCALE} ${SCALE}"
  width="${SCALE}" height="${SCALE}"
>
  <title>${nameJa} (${name})</title>
  <rect width="${SCALE}" height="${SCALE}" fill="#ffffff"/>
${pathElements.join('\n')}
</svg>`;
}

const designsDir = path.resolve(__dirname, '..', 'constants', 'designs');
const assetsDir = path.resolve(__dirname, '..', 'assets', 'designs');

const jsonFiles = fs.readdirSync(designsDir).filter((f) => f.endsWith('.json'));
let generated = 0;
let skipped = 0;

for (const jsonFile of jsonFiles) {
  const jsonPath = path.join(designsDir, jsonFile);
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (e) {
    console.warn(`⚠  スキップ（JSONパース失敗）: ${jsonFile} — ${e.message}`);
    skipped++;
    continue;
  }

  const design = raw.design;
  if (!design || !Array.isArray(design.polygons)) {
    console.warn(`⚠  スキップ（design.polygons なし）: ${jsonFile}`);
    skipped++;
    continue;
  }

  // ファイル名のゼロ幅スペース等の不可視文字を除去して .svg に変換
  const slug = jsonFile.replace(/[​‌‍﻿]/g, '').replace(/\.json$/, '') + '.svg';
  const svgPath = path.join(assetsDir, slug);

  if (fs.existsSync(svgPath)) {
    console.log(`- スキップ（既存）: ${slug}`);
    skipped++;
    continue;
  }

  const svgContent = buildSvg(design);
  fs.writeFileSync(svgPath, svgContent, 'utf8');
  console.log(`✓ ${slug}`);
  generated++;
}

console.log(`\n完了: ${generated}件生成, ${skipped}件スキップ`);
