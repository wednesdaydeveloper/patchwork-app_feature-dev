import aliceJson from '@/constants/designs/alice.json';
import arabamaBautyJson from '@/constants/designs/arabama_bauty.json';
import arabianPlaidJson from '@/constants/designs/arabian-plaid.json';
import bascketJson from '@/constants/designs/bascket.json';
import dogJson from '@/constants/designs/dog.json';
import doubleXJson from '@/constants/designs/double-x.json';
import dresdenPlateJson from '@/constants/designs/dresden-plate.json';
import eightPetalJson from '@/constants/designs/eight_petal.json';
import eightPointStarJson from '@/constants/designs/eight_point_star.json';
import englishIvyJson from '@/constants/designs/english-ivy.json';
import eveningStarJson from '@/constants/designs/evening_star.json';
import gooseInTheLakeJson from '@/constants/designs/goose-in-the-lake.json';
import iceCreamCornJson from '@/constants/designs/ice_cream_corn.json';
import innerCityJson from '@/constants/designs/inner_city.json';
import irisJson from '@/constants/designs/iris.json';
import lPatchJson from '@/constants/designs/l_patch.json';
import lemonStarJson from '@/constants/designs/lemon-star.json';
import mixedTJson from '@/constants/designs/mixed-t.json';
import morningGloryJson from '@/constants/designs/morning-glory.json';
import ninePatchJson from '@/constants/designs/nine-patch.json';
import ohioStarJson from '@/constants/designs/ohio-star.json';
import pinwheelJson from '@/constants/designs/pinwheel.json';
import seaStormJson from '@/constants/designs/sea_storm.json';
import spoolOfThreadJson from '@/constants/designs/spool_of_thread.json';
import sprintBautyJson from '@/constants/designs/sprint-bauty.json';
import strawberryBasketJson from '@/constants/designs/strawberry_basket.json';
import variableStarJson from '@/constants/designs/variable-star.json';
import walkingTriangleJson from '@/constants/designs/walking-triangle.json';
import windFanJson from '@/constants/designs/wind_fan.json';
import winterDahliaJson from '@/constants/designs/winter-dahlia.json';
import { type Design, designFileSchema } from '@/types/design';
import { validateDesign } from '@/utils/designValidator';
import { logger } from '@/utils/logger';

const RAW_DESIGN_FILES: unknown[] = [
  ninePatchJson,
  variableStarJson,
  pinwheelJson,
  morningGloryJson,
  bascketJson,
  doubleXJson,
  dresdenPlateJson,
  gooseInTheLakeJson,
  irisJson,
  lemonStarJson,
  mixedTJson,
  ohioStarJson,
  sprintBautyJson,
  winterDahliaJson,
  aliceJson,
  arabamaBautyJson,
  arabianPlaidJson,
  dogJson,
  eightPetalJson,
  eightPointStarJson,
  englishIvyJson,
  eveningStarJson,
  iceCreamCornJson,
  innerCityJson,
  lPatchJson,
  seaStormJson,
  spoolOfThreadJson,
  strawberryBasketJson,
  walkingTriangleJson,
  windFanJson,
];

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
        logger.warn('designs', `geometry warning for "${file.design.id}": ${detail}`);
      }
    }
    designs.push(file.design);
  }
  return designs;
}

export function findDesignById(designs: readonly Design[], id: string): Design | undefined {
  return designs.find((d) => d.id === id);
}
