import { getToolError, type ToolErrorInfo } from '~/constants/toolErrorConstants'
import type { VoltageCalcInputs, VoltageCalcResult } from '~/types/voltage'
import { formatVal } from '~/utils/math'

export interface VoltageResultViewModel {
  isReady: boolean
  mode: 'drop' | 'size'
  dropCableName: string
  dropRateText: string
  mainLabel: string
  mainValue: string
  mainUnit: string
  mainStatusClass: 'is-neutral' | 'is-success' | 'is-warning' | 'is-danger'
  mainBadgeText?: string
  currentI: string
  maxI: string
  ampStatusClass: 'is-neutral' | 'is-success' | 'is-warning' | 'is-danger'
  ampBadgeText?: string
  dropV: string
  dropPercent: string
  dropStatusClass: 'is-neutral' | 'is-success' | 'is-warning' | 'is-danger'
  dropBadgeText?: string
  errorInfo?: ToolErrorInfo
}

/**
 * 電圧降下・ケーブルサイズ選定ツールの計算結果を表示用ViewModelに整形する
 */
export function formatVoltageResult(
  inputs: VoltageCalcInputs | null | undefined,
  result: VoltageCalcResult | null | undefined,
): VoltageResultViewModel {
  const isReady = Boolean(inputs?.isReady && result)
  const mode = inputs?.mode || 'drop'
  const errorInfo = result?.errorId ? getToolError(result.errorId) : undefined

  // ドロップ時のケーブル名（選択された瞬間に表示、未選択はーー）
  const dropCableName
    = inputs?.selectedCableName
      || result?.optimal?.name
      || 'ーー'

  // エラー種別の判定（導体断面積モード）
  const isTargetDropOver = errorInfo?.id === 'VOLTAGE_TARGET_DROP_OVER'
  const isAmpOverError = errorInfo?.id === 'VOLTAGE_AMP_OVER'
  const isNoMatchingError = Boolean(errorInfo) && !isTargetDropOver && !isAmpOverError

  // メイン指標（降下電圧 または 選定サイズ）
  const mainLabel = mode === 'size' ? '選定ケーブルサイズ' : '電圧降下'

  let mainValue = 'ーー'
  let mainUnit = mode === 'size' ? 'sq' : 'V'
  let mainStatusClass: VoltageResultViewModel['mainStatusClass'] = 'is-neutral'
  let mainBadgeText: string | undefined

  if (isReady && result) {
    if (mode === 'size') {
      if (isTargetDropOver) {
        // 電圧降下のみ超過: 最大サイズを通常表示し、warning + 降下率超過
        mainValue = result.optimal?.size ? String(result.optimal.size) : 'ERROR'
        mainUnit = result.optimal?.unit || 'sq'
        mainStatusClass = 'is-warning'
        mainBadgeText = '降下率超過'
      }
      else if (isAmpOverError) {
        // 許容電流不足: ERROR + danger + 許容電流不足
        mainValue = 'ERROR'
        mainUnit = ''
        mainStatusClass = 'is-danger'
        mainBadgeText = '許容電流不足'
      }
      else if (isNoMatchingError) {
        // 該当規格なし等: ERROR + danger + 規格外
        mainValue = 'ERROR'
        mainUnit = ''
        mainStatusClass = 'is-danger'
        mainBadgeText = '規格外'
      }
      else if (result.optimal && result.optimal.size) {
        // 正常選定
        mainValue = String(result.optimal.size)
        mainUnit = result.optimal.unit || 'sq'
        mainStatusClass = 'is-success'
      }
      else {
        mainValue = 'ERROR'
        mainUnit = ''
        mainStatusClass = 'is-danger'
        mainBadgeText = '規格外'
      }
    }
    else {
      mainValue = formatVal(result.finalDropV, 'ーー', 2)
      mainUnit = 'V'
      const isAmpOver = (inputs?.I || 0) > result.finalEffAmp

      mainStatusClass = isAmpOver ? 'is-danger' : 'is-success'
      if (isAmpOver) {
        mainBadgeText = '許容電流不足'
      }
    }
  }

  // 電流チェック (設計 / 許容)
  let currentI = isReady && inputs ? formatVal(inputs.I, 'ーー', 1) : 'ーー'
  let maxI = isReady && result ? formatVal(result.finalEffAmp, 'ーー', 1) : 'ーー'
  let ampStatusClass: VoltageResultViewModel['ampStatusClass'] = 'is-neutral'
  let ampBadgeText: string | undefined

  if (isReady && result) {
    if (mode === 'size') {
      if (isTargetDropOver) {
        ampStatusClass = 'is-warning'
        ampBadgeText = '降下率超過'
      }
      else if (isAmpOverError) {
        ampStatusClass = 'is-danger'
        ampBadgeText = '許容電流不足'
      }
      else if (isNoMatchingError) {
        currentI = 'ERROR'
        maxI = 'ERROR'
        ampStatusClass = 'is-danger'
        ampBadgeText = '規格外'
      }
      else {
        const isAmpCheckOver = (inputs?.I || 0) > result.finalEffAmp

        ampStatusClass = isAmpCheckOver ? 'is-danger' : 'is-success'
        ampBadgeText = isAmpCheckOver ? '許容電流不足' : undefined
      }
    }
    else {
      const isAmpCheckOver = (inputs?.I || 0) > result.finalEffAmp

      ampStatusClass = isAmpCheckOver ? 'is-danger' : 'is-success'
      ampBadgeText = isAmpCheckOver ? '許容電流不足' : undefined
    }
  }

  // 電圧降下 (V / %)
  let dropV = isReady && result ? formatVal(result.finalDropV, 'ーー', 2) : 'ーー'
  let dropPercent = 'ーー'
  let dropRateText = 'ーー'
  let dropStatusClass: VoltageResultViewModel['dropStatusClass'] = 'is-neutral'
  let dropBadgeText: string | undefined

  if (isReady && result && inputs?.sys?.voltage) {
    const currentPercent = (result.finalDropV / inputs.sys.voltage) * 100

    dropPercent = formatVal(currentPercent, 'ーー', 2)

    const is1P3W = inputs.sys.id?.startsWith('1P3W')

    if (is1P3W) {
      const p100 = formatVal((result.finalDropV / 100) * 100, 'ーー', 2)
      const p200 = formatVal((result.finalDropV / 200) * 100, 'ーー', 2)

      dropRateText = `${p100}% (${p200}%)`
    }
    else {
      dropRateText = `${dropPercent}%`
    }

    if (mode === 'size') {
      if (isTargetDropOver) {
        dropStatusClass = 'is-warning'
        dropBadgeText = '降下率超過'
      }
      else if (isAmpOverError) {
        dropV = 'ERROR'
        dropPercent = ''
        dropRateText = 'ERROR'
        dropStatusClass = 'is-danger'
        dropBadgeText = '許容電流不足'
      }
      else if (isNoMatchingError) {
        dropV = 'ERROR'
        dropPercent = ''
        dropRateText = 'ERROR'
        dropStatusClass = 'is-danger'
        dropBadgeText = '規格外'
      }
      else if (inputs.targetDrop) {
        const isDropOver = currentPercent > inputs.targetDrop

        dropStatusClass = isDropOver ? 'is-warning' : 'is-success'
        if (isDropOver) {
          dropBadgeText = '降下率超過'
        }
      }
      else {
        dropStatusClass = 'is-success'
      }
    }
    else {
      dropStatusClass = 'is-success'
    }
  }

  return {
    isReady,
    mode,
    dropCableName,
    dropRateText,
    mainLabel,
    mainValue,
    mainUnit,
    mainStatusClass,
    mainBadgeText,
    currentI,
    maxI,
    ampStatusClass,
    ampBadgeText,
    dropV,
    dropPercent,
    dropStatusClass,
    dropBadgeText,
    errorInfo,
  }
}
