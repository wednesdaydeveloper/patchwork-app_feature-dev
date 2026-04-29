import { z } from 'zod';

/**
 * ピース（パターンを構成する閉じた図形）
 *
 * - `path`: SVG path data。正規化座標 0.0〜1.0、`Z` で閉じたパス。
 *   直線・円弧・ベジェ曲線などをサポート（M / L / C / Q / A / Z 等のコマンド）。
 * - `label`: 翻訳キー（例: `topLeft`, `center`）。表示時は `t('piece.<label>')` で解決。
 */
export const polygonSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  path: z.string().min(1),
});

export type Polygon = z.infer<typeof polygonSchema>;

/**
 * パターン（1×1 の正方形を 1 つ以上のピースで隙間なく充填したテンプレート）
 *
 * - `category`: 翻訳キー（例: `threeGrid`, `fourGrid`）。表示時は `t('category.<category>')` で解決。
 * - `gridSize`: グリッド系は分割数、自由形状は `null`。
 */
export const designSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  nameJa: z.string().min(1),
  category: z.string().min(1),
  gridSize: z.number().int().positive().nullable(),
  thumbnail: z.string().min(1),
  polygons: z.array(polygonSchema).min(1),
});

export type Design = z.infer<typeof designSchema>;

/**
 * 1 ファイル 1 デザインのラッパー型
 */
export const designFileSchema = z.object({
  version: z.string().min(1),
  design: designSchema,
});

export type DesignFile = z.infer<typeof designFileSchema>;
