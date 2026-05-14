// アプリアイコン・スプラッシュ画像を生成するスクリプト
// 使用法: node scripts/generate-icons.js
'use strict';

const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

// ── アプリアイコン（1024×1024, Lemon Star パッチワーク・フルブリード） ──
const APP_ICON_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <g transform="scale(2.56)">
    <path d="M 0 0 L 0 117.157288 L 117.157288 117.157288 L 117.157288 0" fill="#e8c4b8" stroke="#1F2A30" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M 117.157288 0 L 282.842712 0 L 200 82.842712" fill="#D49AA8" stroke="#1F2A30" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M 117.157288 0 L 200 82.842712 L 200 200 L 117.157288 117.157288" fill="#c4bde8" stroke="#1F2A30" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M 0 117.157288 L 117.157288 117.157288 L 200 200 L 82.842712 200" fill="#b8d4c4" stroke="#1F2A30" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M 400 0 L 282.842712 0 L 282.842712 117.157288 L 400 117.157288" fill="#e8dbb8" stroke="#1F2A30" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M 400 117.157288 L 400 282.842712 L 317.157288 200" fill="#d4b8c4" stroke="#1F2A30" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M 400 117.157288 L 317.157288 200 L 200 200 L 282.842712 117.157288" fill="#b8c4d4" stroke="#1F2A30" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M 282.842712 0 L 282.842712 117.157288 L 200 200 L 200 82.842712" fill="#d4c4b8" stroke="#1F2A30" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M 400 400 L 400 282.842712 L 282.842712 282.842712 L 282.842712 400" fill="#c8e0d0" stroke="#1F2A30" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M 282.842712 400 L 117.157288 400 L 200 317.157288" fill="#e0c8d8" stroke="#1F2A30" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M 282.842712 400 L 200 317.157288 L 200 200 L 282.842712 282.842712" fill="#e8c4b8" stroke="#1F2A30" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M 400 282.842712 L 282.842712 282.842712 L 200 200 L 317.157288 200" fill="#D49AA8" stroke="#1F2A30" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M 0 400 L 117.157288 400 L 117.157288 282.842712 L 0 282.842712" fill="#c4bde8" stroke="#1F2A30" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M 0 282.842712 L 0 117.157288 L 82.842712 200" fill="#b8d4c4" stroke="#1F2A30" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M 0 282.842712 L 82.842712 200 L 200 200 L 117.157288 282.842712" fill="#e8dbb8" stroke="#1F2A30" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M 117.157288 400 L 117.157288 282.842712 L 200 200 L 200 317.157288" fill="#d4b8c4" stroke="#1F2A30" stroke-width="1.3" stroke-linejoin="round"/>
  </g>
</svg>`;

// ── スプラッシュ画像（1242×2688, 温かみのあるオフホワイト背景） ──
const SPLASH_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1242 2688" width="1242" height="2688">
  <rect width="1242" height="2688" fill="#F5EFE6"/>
  <g stroke="#1F2A30" stroke-width="3" stroke-dasharray="14 10" opacity="0.35" fill="none">
    <line x1="120" y1="200" x2="1122" y2="200"/>
    <line x1="120" y1="2488" x2="1122" y2="2488"/>
  </g>
  <g transform="translate(261 940)">
    <rect x="0" y="0" width="720" height="720" fill="#1F2A30"/>
    <g transform="translate(72 72) scale(1.44)">
      <path d="M 0 0 L 0 117.157288 L 117.157288 117.157288 L 117.157288 0" fill="#e8c4b8" stroke="#1F2A30" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M 117.157288 0 L 282.842712 0 L 200 82.842712" fill="#D49AA8" stroke="#1F2A30" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M 117.157288 0 L 200 82.842712 L 200 200 L 117.157288 117.157288" fill="#c4bde8" stroke="#1F2A30" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M 0 117.157288 L 117.157288 117.157288 L 200 200 L 82.842712 200" fill="#b8d4c4" stroke="#1F2A30" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M 400 0 L 282.842712 0 L 282.842712 117.157288 L 400 117.157288" fill="#e8dbb8" stroke="#1F2A30" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M 400 117.157288 L 400 282.842712 L 317.157288 200" fill="#d4b8c4" stroke="#1F2A30" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M 400 117.157288 L 317.157288 200 L 200 200 L 282.842712 117.157288" fill="#b8c4d4" stroke="#1F2A30" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M 282.842712 0 L 282.842712 117.157288 L 200 200 L 200 82.842712" fill="#d4c4b8" stroke="#1F2A30" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M 400 400 L 400 282.842712 L 282.842712 282.842712 L 282.842712 400" fill="#c8e0d0" stroke="#1F2A30" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M 282.842712 400 L 117.157288 400 L 200 317.157288" fill="#e0c8d8" stroke="#1F2A30" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M 282.842712 400 L 200 317.157288 L 200 200 L 282.842712 282.842712" fill="#e8c4b8" stroke="#1F2A30" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M 400 282.842712 L 282.842712 282.842712 L 200 200 L 317.157288 200" fill="#D49AA8" stroke="#1F2A30" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M 0 400 L 117.157288 400 L 117.157288 282.842712 L 0 282.842712" fill="#c4bde8" stroke="#1F2A30" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M 0 282.842712 L 0 117.157288 L 82.842712 200" fill="#b8d4c4" stroke="#1F2A30" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M 0 282.842712 L 82.842712 200 L 200 200 L 117.157288 282.842712" fill="#e8dbb8" stroke="#1F2A30" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M 117.157288 400 L 117.157288 282.842712 L 200 200 L 200 317.157288" fill="#d4b8c4" stroke="#1F2A30" stroke-width="1.5" stroke-linejoin="round"/>
    </g>
    <rect x="72" y="72" width="576" height="576" fill="none" stroke="#1F2A30" stroke-width="9"/>
  </g>
</svg>`;

function render(svgString, outputPath) {
  const resvg = new Resvg(svgString, { font: { loadSystemFonts: false } });
  const pngBuffer = resvg.render().asPng();
  fs.writeFileSync(outputPath, pngBuffer);
  console.log(`✓ ${path.relative(process.cwd(), outputPath)}`);
}

const assetsDir = path.resolve(__dirname, '..', 'assets');

render(APP_ICON_SVG, path.join(assetsDir, 'icon.png'));
render(APP_ICON_SVG, path.join(assetsDir, 'adaptive-icon.png'));
render(SPLASH_SVG,   path.join(assetsDir, 'splash-icon.png'));
render(APP_ICON_SVG, path.join(assetsDir, 'favicon.png'));

console.log('\nアイコン生成完了！');
