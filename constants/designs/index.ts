import ninePatchJson from '@/constants/designs/nine-patch.json';
import pinwheelJson from '@/constants/designs/pinwheel.json';
import variableStarJson from '@/constants/designs/variable-star.json';
import { type Design, designFileSchema } from '@/types/design';
import { validateDesign } from '@/utils/designValidator';

const RAW_DESIGN_FILES: unknown[] = [ninePatchJson, variableStarJson, pinwheelJson];

/**
 * 起動時に呼び出して全パターンをロードする。
 *
 * - JSON のスキーマを zod で検証
 * - 開発時のみ幾何整合性も検証（隙間・重なり・面積・範囲）
 * - 検証失敗は throw する（呼び出し側でエラー画面を表示する）
 */
export function loadDesigns(): Design[] {
  const designs: Design[] = [];
  for (const raw of RAW_DESIGN_FILES) {
    const file = designFileSchema.parse(raw);
    if (__DEV__) {
      const result = validateDesign(file.design);
      if (!result.ok) {
        const detail = result.errors.map((e) => JSON.stringify(e)).join(', ');
        throw new Error(`Design "${file.design.id}" validation failed: ${detail}`);
      }
    }
    designs.push(file.design);
  }
  return designs;
}

export function findDesignById(designs: readonly Design[], id: string): Design | undefined {
  return designs.find((d) => d.id === id);
}
