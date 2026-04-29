import { atom } from 'jotai';

import type { FabricImage } from '@/types/fabric';
import { deleteFabric, insertFabric, isFabricReferenced, listFabrics } from '@/utils/db';
import { deleteFabricImage } from '@/utils/fileSystem';

/**
 * 布地一覧。DB から読み込んだ最新状態を保持。
 */
export const fabricsAtom = atom<FabricImage[]>([]);
fabricsAtom.debugLabel = 'fabrics';

/**
 * 初期ロード完了フラグ。
 */
export const fabricsLoadedAtom = atom<boolean>(false);
fabricsLoadedAtom.debugLabel = 'fabricsLoaded';

/**
 * カテゴリ別グルーピング（派生 atom）。空文字カテゴリは "" キーで括る。
 */
export const fabricsByCategoryAtom = atom((get) => {
  const fabrics = get(fabricsAtom);
  const groups = new Map<string, FabricImage[]>();
  for (const fabric of fabrics) {
    const key = fabric.category;
    const list = groups.get(key) ?? [];
    list.push(fabric);
    groups.set(key, list);
  }
  return groups;
});
fabricsByCategoryAtom.debugLabel = 'fabricsByCategory';

/**
 * DB から布地一覧を読み込む write-only atom。
 */
export const loadFabricsAtom = atom(null, async (_get, set) => {
  const fabrics = await listFabrics();
  set(fabricsAtom, fabrics);
  set(fabricsLoadedAtom, true);
});
loadFabricsAtom.debugLabel = 'loadFabrics';

/**
 * 布地を追加する write-only atom（DB 登録 + 状態反映）。
 */
export const addFabricAtom = atom(null, async (get, set, fabric: FabricImage) => {
  await insertFabric(fabric);
  set(fabricsAtom, [fabric, ...get(fabricsAtom)]);
});
addFabricAtom.debugLabel = 'addFabric';

/**
 * 布地を削除する write-only atom。
 *
 * `force=false` で参照中なら例外、`force=true` で参照中の `PieceSetting` も削除して進める。
 * 物理ファイル削除は DB トランザクション成功後に行う。
 */
export const removeFabricAtom = atom(
  null,
  async (
    get,
    set,
    args: { id: string; force?: boolean },
  ): Promise<{ removed: boolean; referenced: boolean }> => {
    const { id, force = false } = args;
    const fabric = get(fabricsAtom).find((f) => f.id === id);
    if (!fabric) {
      return { removed: false, referenced: false };
    }
    const referenced = await isFabricReferenced(id);
    if (referenced && !force) {
      return { removed: false, referenced: true };
    }
    await deleteFabric(id);
    deleteFabricImage(fabric.imagePath);
    set(
      fabricsAtom,
      get(fabricsAtom).filter((f) => f.id !== id),
    );
    return { removed: true, referenced };
  },
);
removeFabricAtom.debugLabel = 'removeFabric';
