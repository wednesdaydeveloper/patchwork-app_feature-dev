import { atom } from 'jotai';

import type { Design } from '@/types/design';
import { WORK_SIZE_MM_DEFAULT, type PieceSetting } from '@/types/work';

/**
 * 現在編集中のパッチワークの ID（保存済み Work の ID。新規作成中は新しい UUID）。
 */
export const editingWorkIdAtom = atom<string | null>(null);
editingWorkIdAtom.debugLabel = 'editingWorkId';

/**
 * 現在編集中のパッチワーク名。
 */
export const editingWorkNameAtom = atom<string>('');
editingWorkNameAtom.debugLabel = 'editingWorkName';

/**
 * 名前が変更されてから未保存である場合に true。
 * 履歴(canUndo)とは独立した「未保存変更」フラグ。
 */
export const editingWorkNameDirtyAtom = atom<boolean>(false);
editingWorkNameDirtyAtom.debugLabel = 'editingWorkNameDirty';

/**
 * 編集中のパッチワーク物理サイズ（mm）。
 */
export const editingWorkSizeMmAtom = atom<number>(WORK_SIZE_MM_DEFAULT);
editingWorkSizeMmAtom.debugLabel = 'editingWorkSizeMm';

/**
 * サイズが変更されてから未保存である場合に true。
 */
export const editingWorkSizeMmDirtyAtom = atom<boolean>(false);
editingWorkSizeMmDirtyAtom.debugLabel = 'editingWorkSizeMmDirty';

/**
 * 編集中のパターン（Design）。
 */
export const selectedDesignAtom = atom<Design | null>(null);
selectedDesignAtom.debugLabel = 'selectedDesign';

/**
 * ユーザーが現在選択しているピースの ID。未選択なら null。
 */
export const selectedPolygonIdAtom = atom<string | null>(null);
selectedPolygonIdAtom.debugLabel = 'selectedPolygonId';

/**
 * 編集中のピース設定一覧。空配列が初期状態。
 */
export const pieceSettingsAtom = atom<PieceSetting[]>([]);
pieceSettingsAtom.debugLabel = 'pieceSettings';

/**
 * 調整モード（拡大表示）か否か。
 */
export const adjustModeAtom = atom<boolean>(false);
adjustModeAtom.debugLabel = 'adjustMode';

/**
 * 派生: 選択中ピースに対応する設定（無ければ null）。
 */
export const selectedPieceSettingAtom = atom((get) => {
  const polygonId = get(selectedPolygonIdAtom);
  if (!polygonId) return null;
  const settings = get(pieceSettingsAtom);
  return settings.find((s) => s.polygonId === polygonId) ?? null;
});
selectedPieceSettingAtom.debugLabel = 'selectedPieceSetting';

/**
 * ピース設定を追加または更新する write-only atom。
 */
export const upsertPieceSettingAtom = atom(null, (get, set, next: PieceSetting) => {
  const settings = get(pieceSettingsAtom);
  const exists = settings.some((s) => s.polygonId === next.polygonId);
  set(
    pieceSettingsAtom,
    exists ? settings.map((s) => (s.polygonId === next.polygonId ? next : s)) : [...settings, next],
  );
});
upsertPieceSettingAtom.debugLabel = 'upsertPieceSetting';

/**
 * ピース設定を解除する write-only atom。
 */
export const removePieceSettingAtom = atom(null, (get, set, polygonId: string) => {
  set(
    pieceSettingsAtom,
    get(pieceSettingsAtom).filter((s) => s.polygonId !== polygonId),
  );
});
removePieceSettingAtom.debugLabel = 'removePieceSetting';

/**
 * エディタ状態をリセットする（パッチワーク切り替え時 / 新規作成時に使用）。
 */
export const resetEditorAtom = atom(null, (_get, set) => {
  set(editingWorkIdAtom, null);
  set(editingWorkNameAtom, '');
  set(editingWorkNameDirtyAtom, false);
  set(editingWorkSizeMmAtom, WORK_SIZE_MM_DEFAULT);
  set(editingWorkSizeMmDirtyAtom, false);
  set(selectedDesignAtom, null);
  set(selectedPolygonIdAtom, null);
  set(pieceSettingsAtom, []);
  set(adjustModeAtom, false);
});
resetEditorAtom.debugLabel = 'resetEditor';
