import type { EditablePiece } from '../types';

const THUMBNAIL_SIZE = 256;
const PIECE_COLORS = [
  '#c8d8e8', '#e8c8d8', '#d8e8c8', '#e8e0c8', '#d8c8e8',
  '#c8e8e0', '#e8d8c8', '#c8c8e8', '#e8e8c8', '#c8e8c8',
];

/**
 * ピース一覧から PNG サムネイルの data URL を生成する。
 * 各ピースを異なる色で塗りつぶし、境界線を描く。
 */
export function generateThumbnail(pieces: EditablePiece[]): string {
  const canvas = document.createElement('canvas');
  canvas.width = THUMBNAIL_SIZE;
  canvas.height = THUMBNAIL_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const size = THUMBNAIL_SIZE;

  pieces.forEach((piece, index) => {
    const path2d = svgPathToPath2D(piece.path, size);
    ctx.fillStyle = PIECE_COLORS[index % PIECE_COLORS.length];
    ctx.fill(path2d);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1.5;
    ctx.stroke(path2d);
  });

  return canvas.toDataURL('image/png');
}

/**
 * 正規化座標 (0〜1) の SVG path data を canvas の Path2D に変換する。
 */
function svgPathToPath2D(svgPath: string, scale: number): Path2D {
  // Vite/ブラウザ環境では Path2D が SVG path 文字列を直接受け取れる
  // ただし座標を scale 倍する必要があるため正規表現で変換する
  const scaledPath = svgPath.replace(
    /(-?\d+(?:\.\d+)?)/g,
    (_, n) => String(parseFloat(n) * scale),
  );
  return new Path2D(scaledPath);
}
