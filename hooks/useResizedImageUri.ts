import { useEffect, useState } from 'react';
import { Image } from 'react-native';

import { resizeForExport } from '@/utils/imageResize';

export interface ResizedImage {
  uri: string;
  width: number;
  height: number;
  /** リサイズ比率（元サイズ比）。リサイズしなかった場合は 1.0 */
  ratio: number;
}

const MAX_TEXTURE_PX = 2048;

// プロセス内キャッシュ: uri+maxPx → 結果
const cache = new Map<string, ResizedImage>();

/**
 * 画像 URI を受け取り、長辺が maxPx を超える場合はリサイズした結果を返す。
 * キャッシュにより同一 URI の重複リサイズを防ぐ。
 * 処理中は null を返す。
 */
export function useResizedImageUri(
  uri: string | null,
  maxPx: number = MAX_TEXTURE_PX,
): ResizedImage | null {
  const [result, setResult] = useState<ResizedImage | null>(() => {
    if (!uri) return null;
    return cache.get(`${uri}:${maxPx}`) ?? null;
  });

  useEffect(() => {
    if (!uri) {
      setResult(null);
      return;
    }
    const key = `${uri}:${maxPx}`;
    const cached = cache.get(key);
    if (cached) {
      setResult(cached);
      return;
    }
    let cancelled = false;
    Image.getSize(
      uri,
      (origWidth, origHeight) => {
        if (cancelled) return;
        void resizeForExport(uri, origWidth, origHeight, maxPx).then((resized) => {
          if (cancelled) return;
          const ratio = resized.width / origWidth;
          const entry: ResizedImage = { ...resized, ratio };
          cache.set(key, entry);
          setResult(entry);
        });
      },
      () => {
        if (!cancelled) setResult(null);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [uri, maxPx]);

  return result;
}
