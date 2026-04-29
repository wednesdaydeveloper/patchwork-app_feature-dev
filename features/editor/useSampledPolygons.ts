import { useMemo } from 'react';

import type { Design } from '@/types/design';
import { type Bbox, type Point, computeBbox, samplePath } from '@/utils/path';

export interface SampledPolygon {
  id: string;
  points: Point[];
  bbox: Bbox;
}

/**
 * Design の各ピースを path サンプリングして bbox とともにキャッシュするフック。
 * タップヒットテストや bbox ベースの描画計算で再利用する。
 */
export function useSampledPolygons(design: Design | null, samples = 64): SampledPolygon[] {
  return useMemo(() => {
    if (!design) {
      return [];
    }
    return design.polygons.map((polygon) => {
      const points = samplePath(polygon.path, samples);
      return { id: polygon.id, points, bbox: computeBbox(points) };
    });
  }, [design, samples]);
}
