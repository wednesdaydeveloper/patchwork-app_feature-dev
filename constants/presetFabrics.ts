/**
 * アプリにバンドルするプリセット布地の定義。
 *
 * 画像ファイルは `assets/fabrics/` 配下に配置する。
 * 名前・カテゴリ・pxPerMm はここで自由に変更できる。
 * pxPerMm を null にするとキャリブレーション未設定扱いになる。
 *
 * **更新手順**: 定義や画像を変更したら `PRESET_FABRICS_VERSION` を上げる。
 * 次回アプリ起動時に全プリセットが自動的に再適用される。
 */

/**
 * プリセット布地定義のバージョン。
 * 名前・カテゴリ・pxPerMm・画像を変更したら値を上げること。
 */
export const PRESET_FABRICS_VERSION = 'v3';
export interface PresetFabricDef {
  /** DB / ファイルシステムで使う固定 ID。変更すると再シードされない。 */
  id: string;
  name: string;
  category: string;
  /** キャリブレーション値（画像 1mm あたりの px 数）。未設定は null。 */
  pxPerMm: number | null;
  /** require() で解決した静的アセット */
  asset: ReturnType<typeof require>;
}

export const PRESET_FABRICS: PresetFabricDef[] = [
  {
    id: 'preset_fabric_1',
    name: 'プリセット布地 1',
    category: '',
    pxPerMm: 22.10,
    asset: require('@/assets/fabrics/preset-1.png'),
  },
  {
    id: 'preset_fabric_2',
    name: 'プリセット布地 2',
    category: '',
    pxPerMm: 24.42,
    asset: require('@/assets/fabrics/preset-2.png'),
  },
  {
    id: 'preset_fabric_3',
    name: 'プリセット布地 3',
    category: '',
    pxPerMm: 18.46,
    asset: require('@/assets/fabrics/preset-3.png'),
  },
];
