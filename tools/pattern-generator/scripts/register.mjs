#!/usr/bin/env node
/**
 * パターンをリポジトリに登録するCLIスクリプト
 *
 * Usage:
 *   node scripts/register.mjs <design.json> [thumbnail.png] [--commit]
 *   npm run register -- design.json thumbnail.png --commit
 *
 * 処理内容:
 *   1. <id>.json → constants/designs/<id>.json にコピー
 *   2. thumbnail.png → assets/designs/<thumbnail> にコピー（指定時）
 *   3. constants/designs/index.ts に import と配列エントリを追加
 *   4. --commit 指定時: git add + git commit
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');

// ---------- 引数解析 ----------

const args = process.argv.slice(2);
const doCommit = args.includes('--commit');
const positional = args.filter((a) => !a.startsWith('--'));

if (positional.length === 0) {
  console.error('使い方: node scripts/register.mjs <design.json> [thumbnail.png] [--commit]');
  process.exit(1);
}

const jsonSrc = resolve(positional[0]);
const pngSrc = positional[1] ? resolve(positional[1]) : null;

if (!existsSync(jsonSrc)) {
  console.error(`ファイルが見つかりません: ${jsonSrc}`);
  process.exit(1);
}

// ---------- JSON 読み込み ----------

let raw;
try {
  raw = JSON.parse(readFileSync(jsonSrc, 'utf-8'));
} catch (e) {
  console.error(`JSON パースエラー: ${e.message}`);
  process.exit(1);
}

const design = raw?.design;
if (!design?.id) {
  console.error('無効なデザイン JSON: design.id が見つかりません');
  process.exit(1);
}

const id = design.id;
const thumbnailFilename = design.thumbnail || `${id}.png`;

// kebab-case → camelCase 変換（変数名用）
const camelId = id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const varName = `${camelId}Json`;

console.log(`\n📦 登録: ${design.name} (${id})\n`);

// ---------- JSON コピー ----------

const destJson = join(REPO_ROOT, 'constants', 'designs', `${id}.json`);
copyFileSync(jsonSrc, destJson);
console.log(`  ✅ JSON → constants/designs/${id}.json`);

// ---------- PNG コピー ----------

const stagedFiles = [destJson];

if (pngSrc) {
  if (!existsSync(pngSrc)) {
    console.error(`  ⚠️  PNG ファイルが見つかりません: ${pngSrc} (スキップ)`);
  } else {
    const destPng = join(REPO_ROOT, 'assets', 'designs', thumbnailFilename);
    copyFileSync(pngSrc, destPng);
    stagedFiles.push(destPng);
    console.log(`  ✅ PNG  → assets/designs/${thumbnailFilename}`);
  }
} else {
  console.log(`  ⚠️  PNG 未指定: assets/designs/${thumbnailFilename} は手動配置してください`);
}

// ---------- index.ts 更新 ----------

const indexPath = join(REPO_ROOT, 'constants', 'designs', 'index.ts');
let indexContent = readFileSync(indexPath, 'utf-8');
let indexModified = false;

// import 行追加（重複スキップ）
const importLine = `import ${varName} from '@/constants/designs/${id}.json';`;
if (!indexContent.includes(importLine)) {
  // `import { type Design` の直前に挿入
  const marker = "import { type Design";
  const insertPos = indexContent.indexOf(marker);
  if (insertPos === -1) {
    console.error('  ❌ index.ts の挿入位置が見つかりません');
    process.exit(1);
  }
  indexContent =
    indexContent.slice(0, insertPos) + importLine + '\n' + indexContent.slice(insertPos);
  indexModified = true;
}

// RAW_DESIGN_FILES 配列に追加（重複スキップ）
if (!indexContent.includes(varName)) {
  // 配列の ] の直前に挿入
  indexContent = indexContent.replace(
    /const RAW_DESIGN_FILES: unknown\[\] = \[([^\]]*)\];/,
    (_, items) => {
      const trimmed = items.trimEnd();
      const separator = trimmed.endsWith(',') ? ' ' : ', ';
      return `const RAW_DESIGN_FILES: unknown[] = [${trimmed}${separator}${varName}];`;
    },
  );
  indexModified = true;
}

if (indexModified) {
  writeFileSync(indexPath, indexContent, 'utf-8');
  stagedFiles.push(indexPath);
  console.log(`  ✅ index.ts に ${varName} を追加`);
} else {
  console.log(`  ℹ️  index.ts はすでに ${varName} を含んでいます（スキップ）`);
}

// ---------- Git コミット ----------

if (doCommit) {
  try {
    const addArgs = stagedFiles.map((f) => `"${f}"`).join(' ');
    execSync(`git -C "${REPO_ROOT}" add ${addArgs}`, { stdio: 'inherit' });
    execSync(
      `git -C "${REPO_ROOT}" commit -m "feat: パターン追加 — ${design.name} (${id})"`,
      { stdio: 'inherit' },
    );
    console.log(`\n  ✅ コミット完了`);
  } catch (e) {
    console.error(`  ❌ git コマンドでエラーが発生しました: ${e.message}`);
    process.exit(1);
  }
} else {
  console.log(`\n  💡 --commit を付けるとそのままコミットできます`);
}

console.log(`\n🎉 ${design.name} の登録が完了しました！\n`);
console.log('次のステップ:');
console.log('  1. npx expo start で表示を確認');
if (!doCommit) {
  console.log('  2. git add / git commit で変更をコミット');
  console.log('  3. git push → PR 作成');
} else {
  console.log('  2. git push → PR 作成');
}
console.log('');
