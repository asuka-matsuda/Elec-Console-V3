import type { CableData } from '~/types/database'

/**
 * 配電方式データ（単相2線、単相3線、三相3線等）
 */
export interface SystemData {
  /** 方式ID ('1p2w', '1p3w', '3p3w', '3p4w' 等) */
  id: string
  /** 日本語表示名 */
  label: string
  /** 特性タグ */
  tags: string[]
  /** 基準公称電圧 (V) */
  voltage: number
  /** 電圧降下算出係数 (単相2線: 35.6, 三相3線: 30.8 等) */
  coefficient: number
  /** 推奨心数 */
  reqCores: string
  /** kW計算用除数 */
  kwDivisor: number
  /** 簡易計算定数 */
  simpleK: number
}

/**
 * 電圧降下計算入力パラメータ
 */
export interface VoltageCalcInputs {
  /** 計算モード: 'size'(許容電圧降下から電線サイズ選定) | 'drop'(電線サイズ指定から電圧降下算出) */
  mode: 'size' | 'drop'
  /** 配電方式 */
  sys: SystemData
  /** 計算負荷電流 (A) */
  I: number | null
  /** 配線長 (m) */
  L: number | null
  /** ケーブル品種 ('CV', 'IV', 'VVF' 等) */
  cableType: string
  /** 選択心数 ('2C', '3C' 等) */
  selectedCores: string | null
  /** 電流減少係数 (束ね低減等) */
  derating: number | null
  /** 入力周囲温度文字列 */
  rawTempVal: string | null
  /** 周囲温度 (°C) */
  ambientTemp: number | null
  /** 並列条数 (1, 2, 3...) */
  parallel: number | null
  /** 許容電圧降下率・目標値 (%) */
  targetDrop: number | null
  /** dropモード時の指定電線サイズインデックス */
  selectedSize: number | null
  /** 選択されたケーブル品名 */
  selectedCableName?: string | null
  /** 負荷入力数値 (A または kW) */
  loadVal: number | null
  /** 負荷単位 ('A' | 'kW') */
  loadUnit: string
  /** 力率 (0.8〜1.0) */
  pf: number | null
  /** 計算可能状態フラグ */
  isReady: boolean
  /** 未入力の必須項目名リスト */
  missingFields: string[]
}

/**
 * 電圧降下計算エンジン算出結果
 */
export interface VoltageCalcResult {
  /** 電圧降下・許容電流を満たす最適選定ケーブルデータ */
  optimal: CableData | null
  /** 許容電流のみを満たす最小ケーブルデータ */
  minAmpacityCable: CableData | null
  /** 最終有効許容電流 (A) */
  finalEffAmp: number
  /** 最終電圧降下 (V) */
  finalDropV: number
  /** 並列条数 */
  parallelCount: number
  /** 負荷入力から換算された計算電流 (A) */
  convertedA: number
  /** 温度補正係数 */
  tempDerating: number
  /** エラー識別子 (容量超過時等) */
  errorId?: string
}

export type { MathStep } from '~/types/tools'
