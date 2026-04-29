import { atom } from 'jotai';

import type { Work } from '@/types/work';
import { deleteWork, listWorks, saveWork } from '@/utils/db';

/**
 * 保存済みパッチワーク一覧。`updatedAt` 降順で保持する。
 */
export const worksAtom = atom<Work[]>([]);
worksAtom.debugLabel = 'works';

/**
 * 初期ロード完了フラグ。
 */
export const worksLoadedAtom = atom<boolean>(false);
worksLoadedAtom.debugLabel = 'worksLoaded';

/**
 * DB から Work 一覧を読み込む write-only atom。
 */
export const loadWorksAtom = atom(null, async (_get, set) => {
  const works = await listWorks();
  set(worksAtom, works);
  set(worksLoadedAtom, true);
});
loadWorksAtom.debugLabel = 'loadWorks';

/**
 * Work を保存（upsert）する write-only atom。
 *
 * 成功時に worksAtom を更新（差し替え or 追加）。
 * 失敗時は呼び出し側でエラーハンドリング（CLAUDE.md「エラーハンドリング方針」参照）。
 */
export const saveWorkAtom = atom(null, async (get, set, work: Work) => {
  await saveWork(work);
  const others = get(worksAtom).filter((w) => w.id !== work.id);
  // updatedAt 降順で再ソート
  const merged = [work, ...others].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  set(worksAtom, merged);
});
saveWorkAtom.debugLabel = 'saveWork';

/**
 * Work を削除する write-only atom。
 * `ON DELETE CASCADE` により piece_settings も連動削除される。
 */
export const removeWorkAtom = atom(null, async (get, set, id: string) => {
  await deleteWork(id);
  set(
    worksAtom,
    get(worksAtom).filter((w) => w.id !== id),
  );
});
removeWorkAtom.debugLabel = 'removeWork';
