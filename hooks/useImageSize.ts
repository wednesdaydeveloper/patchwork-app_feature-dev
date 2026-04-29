import { useEffect, useState } from 'react';
import { Image } from 'react-native';

export interface ImageSize {
  width: number;
  height: number;
}

/**
 * 画像 URI から自然サイズ（ピクセル）を取得するフック。
 * 取得中は `null` を返す。
 */
export function useImageSize(uri: string | null): ImageSize | null {
  const [size, setSize] = useState<ImageSize | null>(null);

  useEffect(() => {
    if (!uri) {
      setSize(null);
      return;
    }
    let cancelled = false;
    Image.getSize(
      uri,
      (width, height) => {
        if (!cancelled) {
          setSize({ width, height });
        }
      },
      () => {
        if (!cancelled) {
          setSize(null);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [uri]);

  return size;
}
