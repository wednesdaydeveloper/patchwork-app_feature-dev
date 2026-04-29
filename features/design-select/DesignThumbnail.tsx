import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { Design } from '@/types/design';

export interface DesignThumbnailProps {
  design: Design;
  size?: number;
}

const PALETTE = ['#fde68a', '#bfdbfe', '#fecaca', '#bbf7d0', '#ddd6fe', '#fed7aa', '#a7f3d0', '#fbcfe8'];

/**
 * パターンの SVG path をサムネイル描画する。
 * 静的画像のサムネイルが用意されていないため、パスデータから直接プレビューを生成する。
 */
export const DesignThumbnail = ({ design, size = 96 }: DesignThumbnailProps) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 1 1">
        {design.polygons.map((polygon, index) => (
          <Path
            key={polygon.id}
            d={polygon.path}
            fill={PALETTE[index % PALETTE.length]}
            stroke="#374151"
            strokeWidth={0.01}
          />
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
});
