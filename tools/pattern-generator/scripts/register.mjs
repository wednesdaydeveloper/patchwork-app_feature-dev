#!/usr/bin/env node
/**
 * パターンをリポジトリに登録するCLIスクリプト
 *
 * Usage (単体):
 *   node scripts/register.mjs <design.json> [thumbnail.png] [--commit]
 *   npm run register -- design.json thumbnail.png --commit
 *
 * Usage (バッチ — 複数 JSON):
 *   node scripts/register.mjs a.json b.json c.json [--commit]
 *   ※ 各 JSON と同じディレクトリに同名 .png があれば自動ペアリング
 *
 * Usage (バッチ — ディレクトリ一括):
 *   node scripts/register.mjs --dir ~/Downloads/patterns/ [--commit]
 *   ※ ディレクトリ内の全 *.json を処理。同名 .png を自動ペアリング
 *
 * 処理内容:
 *   1. <id>.json → constants/designs/<id>.json にコピー
 *   2. thumbnail.png → assets/designs/<thumbnail> にコピー（指定時 / バッチ時は同名 .png を自動検出）
 *   3. constants/designs/index.ts に import と配列エントリを追加
 *   4. --commit 指定時: git add + git commit（バッチ時は全件まとめて 1 コミット）
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, join, basename } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '../../..');

const SAFE_NAME_RE = /^[a-z0-9][a-z0-9-_.]*$/;

// ---------- 引数解析 ----------

const args = process.argv.slice(2);
const doCommit = args.includes('--commit');
const dirIdx = args.indexOf('--dir');
const hasDirFlag = dirIdx !== -1;
const dirArg = hasDirFlag ? args[dirIdx + 1] : null;
if (hasDirFlag && (!dirArg || dirArg.startsWith('--'))) {
  console.error('--dir にはディレクトリパスを指定してください');
  process.exit(1);
}
const positional = args.filter((a, i) => !a.startsWith('--') && !(hasDirFlag && i === dirIdx + 1));

/** @type {Array<{jsonSrc: string, pngSrc: string|null}>} */
const entries = [];

if (dirArg) {
  // ディレクトリ一括モード
  const dir = resolve(dirArg);
  if (!existsSync(dir)) {
    console.error(`ディレクトリが見つかりません: ${dir}`);
    process.exit(1);
  }
  let dirStat;
  try {
    dirStat = statSync(dir);
  } catch (e) {
    console.error(`ディレクトリ情報の取得に失敗しました: ${dir} (${e.message})`);
    process.exit(1);
  }
  if (!dirStat.isDirectory()) {
    console.error(`ディレクトリではありません: ${dir}`);
    process.exit(1);
  }
  let jsonFiles;
  try {
    jsonFiles = readdirSync(dir).filter((f) => f.endsWith('.json'));
  } catch (e) {
    console.error(`ディレクトリの読み取りに失敗しました: ${dir} (${e.message})`);
    process.exit(1);
  }
  if (jsonFiles.length === 0) {
    console.error(`JSON ファイルが見つかりません: ${dir}`);
    process.exit(1);
  }
  for (const f of jsonFiles) {
    const jsonSrc = join(dir, f);
    const pngCandidate = join(dir, `${basename(f, '.json')}.png`);
    entries.push({ jsonSrc, pngSrc: existsSync(pngCandidate) ? pngCandidate : null });
  }
} else if (positional.length === 0) {
  console.error(
    '使い方:\n' +
    '  単体: node scripts/register.mjs <design.json> [thumbnail.png] [--commit]\n' +
    '  複数: node scripts/register.mjs a.json b.json ... [--commit]\n' +
    '  一括: node scripts/register.mjs --dir <directory> [--commit]',
  );
  process.exit(1);
} else if (positional.length === 1 || (positional.length === 2 && /\.png$/i.test(positional[1]))) {
  // 単体モード（従来互換）
  const jsonSrc = resolve(positional[0]);
  const pngSrc = positional[1] ? resolve(positional[1]) : null;
  entries.push({ jsonSrc, pngSrc });
} else {
  // 複数 JSON モード（各 JSON と同名 PNG を自動ペアリング）
  for (const arg of positional) {
    const jsonSrc = resolve(arg);
    const pngCandidate = jsonSrc.replace(/\.json$/i, '.png');
    entries.push({ jsonSrc, pngSrc: existsSync(pngCandidate) ? pngCandidate : null });
  }
}

// ---------- index.ts の読み込み ----------

const indexPath = join(REPO_ROOT, 'constants', 'designs', 'index.ts');
let indexContent = readFileSync(indexPath, 'utf-8');

// ---------- 1件登録関数 ----------

/**
 * @param {string} jsonSrc
 * @param {string|null} pngSrc
 * @returns {{ ok: boolean, id: string, name: string, stagedFiles: string[], pngNote?: string, error?: string }}
 */
function registerOne(jsonSrc, pngSrc) {
  if (!existsSync(jsonSrc)) {
    return { ok: false, id: '?', name: '?', stagedFiles: [], error: `ファイルが見つかりません: ${jsonSrc}` };
  }

  let raw;
  try {
    raw = JSON.parse(readFileSync(jsonSrc, 'utf-8'));
  } catch (e) {
    return { ok: false, id: '?', name: '?', stagedFiles: [], error: `JSON パースエラー: ${e.message}` };
  }

  const design = raw?.design;
  if (!design?.id) {
    return { ok: false, id: '?', name: '?', stagedFiles: [], error: '無効な JSON: design.id が見つかりません' };
  }

  const id = design.id;
  const name = design.name ?? id;
  const thumbnailFilename = design.thumbnail || `${id}.png`;

  if (typeof id !== 'string' || !SAFE_NAME_RE.test(id)) {
    return { ok: false, id, name, stagedFiles: [], error: `design.id が不正です: ${id}` };
  }
  if (typeof thumbnailFilename !== 'string' || !SAFE_NAME_RE.test(thumbnailFilename)) {
    return { ok: false, id, name, stagedFiles: [], error: `design.thumbnail が不正です: ${thumbnailFilename}` };
  }

  // kebab-case → camelCase
  const camelId = id.replace(/[-_.]+([a-z0-9])/g, (_, c) => c.toUpperCase());
  const identifier = camelId.replace(/[^a-zA-Z0-9_$]/g, '');
  const varNameBase = identifier.length > 0 ? identifier : 'design';
  const safeVarName = /^[a-zA-Z_$]/.test(varNameBase) ? varNameBase : `design${varNameBase}`;
  const varName = `${safeVarName}Json`;

  const importLine = `import ${varName} from '@/constants/designs/${id}.json';`;
  if (!indexContent.includes(importLine)) {
    const marker = 'import { type Design';
    const insertPos = indexContent.indexOf(marker);
    if (insertPos === -1) {
      return { ok: false, id, name, stagedFiles: [], error: 'index.ts の挿入位置が見つかりません' };
    }
  }

  const arrayMatch = /const RAW_DESIGN_FILES: unknown\[\] = \[([^\]]*)\]/.exec(indexContent);
  if (!arrayMatch) {
    return { ok: false, id, name, stagedFiles: [], error: 'index.ts の RAW_DESIGN_FILES が見つかりません' };
  }

  const stagedFiles = [];

  // JSON コピー
  const destJson = join(REPO_ROOT, 'constants', 'designs', `${id}.json`);
  copyFileSync(jsonSrc, destJson);
  stagedFiles.push(destJson);

  // PNG コピー
  let pngNote = `⚠️  PNG 未指定 — assets/designs/${thumbnailFilename} は手動配置してください`;
  if (pngSrc) {
    if (!existsSync(pngSrc)) {
      pngNote = `⚠️  PNG が見つかりません: ${pngSrc} (スキップ)`;
    } else {
      const destPng = join(REPO_ROOT, 'assets', 'designs', thumbnailFilename);
      copyFileSync(pngSrc, destPng);
      stagedFiles.push(destPng);
      pngNote = `✅ PNG  → assets/designs/${thumbnailFilename}`;
    }
  }

  // index.ts 更新（インメモリ）
  if (!indexContent.includes(importLine)) {
    const marker = 'import { type Design';
    const insertPos = indexContent.indexOf(marker);
    indexContent =
      indexContent.slice(0, insertPos) + importLine + '\n' + indexContent.slice(insertPos);
  }

  // import の存在とは独立して配列への追加を確認する
  const alreadyInArray = arrayMatch[1].includes(varName);
  if (!alreadyInArray) {
    indexContent = indexContent.replace(
      /const RAW_DESIGN_FILES: unknown\[\] = \[([^\]]*)\];/,
      (_, items) => {
        const trimmed = items.trimEnd();
        const separator = trimmed.endsWith(',') ? ' ' : ', ';
        return `const RAW_DESIGN_FILES: unknown[] = [${trimmed}${separator}${varName}];`;
      },
    );
  }

  return { ok: true, id, name, stagedFiles, pngNote };
}

// ---------- 全件処理 ----------

const isBatch = entries.length > 1;
if (isBatch) {
  console.log(`\n📦 バッチ登録: ${entries.length} 件\n`);
} else {
  console.log(`\n📦 登録: ${entries[0]?.jsonSrc ? basename(entries[0].jsonSrc) : '?'}\n`);
}

const results = [];
const allStagedFiles = [];

for (const { jsonSrc, pngSrc } of entries) {
  const result = registerOne(jsonSrc, pngSrc);
  results.push(result);
  if (result.ok) {
    allStagedFiles.push(...result.stagedFiles);
    if (isBatch) {
      console.log(`  ✅ ${result.name} (${result.id})`);
      if (result.pngNote) console.log(`     ${result.pngNote}`);
    } else {
      console.log(`  ✅ JSON → constants/designs/${result.id}.json`);
      console.log(`  ${result.pngNote}`);
    }
  } else {
    console.log(`  ❌ ${basename(jsonSrc)}: ${result.error}`);
  }
}

// index.ts を一度だけ書き込む
const succeeded = results.filter((r) => r.ok);
const failed = results.filter((r) => !r.ok);

if (succeeded.length > 0) {
  writeFileSync(indexPath, indexContent, 'utf-8');
  allStagedFiles.push(indexPath);
  if (isBatch) {
    console.log(`\n  ✅ index.ts を更新（${succeeded.length} 件追加）`);
  } else {
    console.log(`  ✅ index.ts を更新`);
  }
}

// ---------- サマリー（バッチ時） ----------

if (isBatch) {
  console.log('\n' + '─'.repeat(40));
  console.log(`  成功: ${succeeded.length} 件 / 失敗: ${failed.length} 件`);
  if (failed.length > 0) {
    console.log('\n  失敗した項目:');
    for (const r of failed) {
      console.log(`    - ${r.id}: ${r.error}`);
    }
  }
  console.log('─'.repeat(40));
}

if (succeeded.length === 0) {
  console.error('\n❌ 登録できた件数が 0 件でした\n');
  process.exit(1);
}

// ---------- Git コミット ----------

if (doCommit) {
  try {
    const commitMsg =
      succeeded.length === 1
        ? `feat: パターン追加 — ${succeeded[0].name} (${succeeded[0].id})`
        : `feat: パターン追加 ${succeeded.length} 件 — ${succeeded.map((r) => r.id).join(', ')}`;

    execFileSync('git', ['add', ...allStagedFiles], { cwd: REPO_ROOT, stdio: 'inherit' });
    execFileSync('git', ['commit', '-m', commitMsg], { cwd: REPO_ROOT, stdio: 'inherit' });
    console.log(`\n  ✅ コミット完了`);
  } catch (e) {
    console.error(`  ❌ git コマンドでエラーが発生しました: ${e.message}`);
    process.exit(1);
  }
} else {
  console.log(`\n  💡 --commit を付けるとそのままコミットできます`);
}

console.log(`\n🎉 ${succeeded.length} 件の登録が完了しました！\n`);
console.log('次のステップ:');
console.log('  1. npx expo start で表示を確認');
if (!doCommit) {
  console.log('  2. git add / git commit で変更をコミット');
  console.log('  3. git push → PR 作成');
} else {
  console.log('  2. git push → PR 作成');
}
console.log('');
