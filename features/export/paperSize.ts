export type PaperSize = 'A4' | 'A3' | 'Letter';

export interface PaperDimensions {
  /** 幅（PostScript point = 1/72 inch） */
  widthPt: number;
  /** 高さ（PostScript point = 1/72 inch） */
  heightPt: number;
}

export const PAPER_SIZES: Record<PaperSize, PaperDimensions> = {
  A4: { widthPt: 595, heightPt: 842 },
  A3: { widthPt: 842, heightPt: 1191 },
  Letter: { widthPt: 612, heightPt: 792 },
};

/** 用紙余白（mm）。実寸印刷時の周囲確保。 */
export const PAPER_MARGIN_MM = 10;

/** PostScript point から mm への換算（1 pt = 1/72 inch、1 inch = 25.4 mm） */
export const PT_TO_MM = 25.4 / 72;

/**
 * 用紙に収まる正方形の最大一辺（mm）を返す。両方向の余白を考慮。
 */
export function getPaperPrintableSquareMm(paperSize: PaperSize): number {
  const paper = PAPER_SIZES[paperSize];
  const wMm = paper.widthPt * PT_TO_MM;
  const hMm = paper.heightPt * PT_TO_MM;
  return Math.min(wMm, hMm) - PAPER_MARGIN_MM * 2;
}
