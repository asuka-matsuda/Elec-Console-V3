/**
 * 規格データベース型定義
 *
 * ケーブル、電線管、ドラム、ラック、トルク規格データのデータ構造を定義します。
 */

import type { cableData } from '~/constants/data/cableData'
import type { conduitData } from '~/constants/data/conduitData'
import type { drumData } from '~/constants/data/drumData'

/**
 * ケーブル規格データ行（外径・導体抵抗・許容電流・重量等）
 */
export type CableData = (typeof cableData)[number] & {
  name?: string
  [key: string]: unknown
}

/**
 * 電線管規格データ行（呼び径・内径・断面積・管種等）
 */
export type ConduitData = (typeof conduitData)[number] & {
  [key: string]: unknown
}

/**
 * ケーブルドラム規格データ行（ドラムサイズ・最大巻取長等）
 */
export type DrumData = (typeof drumData)[number] & {
  [key: string]: unknown
}
