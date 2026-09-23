/**
 * 電圧降下計算結果プレゼンター
 *
 * 電圧降下・許容電流判定結果をステータスバッジ、比較パネル、および数式表示用ViewModelへ整形します。
 */

import { getToolError, type ToolErrorInfo } from '~/constants/toolErrorConstants'
import type { ResultDetailItem, ResultPanelStatus } from '~/types/components'
import type { VoltageCalcInputs, VoltageCalcResult } from '~/types/voltage'
import { formatVal } from '~/utils/math'

export interface VoltageResultViewModel {
  isReady: boolean
  mode: 'drop' | 'size'
  mainLabel: string
  mainValue: string
  mainUnit: string
  mainStatus: ResultPanelStatus
  mainBadgeText?: string
  currentI: string
  maxI: string
  isAmpError: boolean
  ampStatus: ResultPanelStatus
  ampBadgeText?: string
  dropV: string
  dropPercent: string
  dropPercentText?: string
  isDropError: boolean
  dropStatus: ResultPanelStatus
  dropBadgeText?: string
  details?: ResultDetailItem[]
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

  // ケーブル名と降下率テキスト（電圧降下モード時の詳細用）
  const dropCableName
    = inputs?.selectedCableName
      || result?.optimal?.name
      || 'ーー'

  // エラー種別の判定（導体断面積モード）
  const isTargetDropOver = errorInfo?.id === 'VOLTAGE_TARGET_DROP_OVER'
  const isAmpOverError = errorInfo?.id === 'VOLTAGE_AMP_OVER'
  const isNoMatchingError = Boolean(errorInfo) && !isTargetDropOver && !isAmpOverError

  // 1. メイン指標（降下電圧 または 選定サイズ）
  const mainLabel = mode === 'size' ? '選定ケーブルサイズ' : '電圧降下'
  let mainValue = 'ーー'
  let mainUnit = mode === 'size' ? 'sq' : 'V'
  let mainStatus: ResultPanelStatus = 'neutral'
  let mainBadgeText: string | undefined

  // 2. 電流チェック (設計 / 許容)
  let currentI = isReady && inputs ? formatVal(inputs.I, 'ーー', 1) : 'ーー'
  let maxI = isReady && result ? formatVal(result.finalEffAmp, 'ーー', 1) : 'ーー'
  let ampStatus: ResultPanelStatus = 'neutral'
  let ampBadgeText: string | undefined

  // 3. 電圧降下 (V / %)
  let dropV = isReady && result ? formatVal(result.finalDropV, 'ーー', 2) : 'ーー'
  let dropPercent = 'ーー'
  let dropPercentText: string | undefined
  let dropRateText = 'ーー'
  let dropStatus: ResultPanelStatus = 'neutral'
  let dropBadgeText: string | undefined

  if (isReady && result) {
    const isAmpCheckOver = (inputs?.I || 0) > result.finalEffAmp

    // 電圧降下率の計算
    if (inputs?.sys?.voltage) {
      const currentPercent = (result.finalDropV / inputs.sys.voltage) * 100

      dropPercent = formatVal(currentPercent, 'ーー', 2)
      dropPercentText = `(${dropPercent}%)`

      const is1P3W = inputs.sys.id?.startsWith('1P3W')

      if (is1P3W) {
        const p100 = formatVal((result.finalDropV / 100) * 100, 'ーー', 2)
        const p200 = formatVal((result.finalDropV / 200) * 100, 'ーー', 2)

        dropRateText = `${p100}% (${p200}%)`
      }
      else {
        dropRateText = `${dropPercent}%`
      }
    }

    if (mode === 'size') {
      if (isTargetDropOver) {
        // 電圧降下のみ超過: 最大サイズ表示 + 全パネル警告
        mainValue = result.optimal?.size ? String(result.optimal.size) : 'ERROR'
        mainUnit = result.optimal?.unit || 'sq'
        mainStatus = 'warning'
        mainBadgeText = '降下率超過'

        ampStatus = 'warning'
        ampBadgeText = '降下率超過'

        dropStatus = 'warning'
        dropBadgeText = '降下率超過'
      }
      else if (isAmpOverError) {
        // 許容電流不足: 全パネル danger + 許容電流不足
        mainValue = 'ERROR'
        mainUnit = ''
        mainStatus = 'danger'
        mainBadgeText = '許容電流不足'

        ampStatus = 'danger'
        ampBadgeText = '許容電流不足'

        dropV = 'ERROR'
        dropPercent = ''
        dropPercentText = undefined
        dropStatus = 'danger'
        dropBadgeText = '許容電流不足'
      }
      else if (isNoMatchingError) {
        // 規格外（該当規格なし等）: 全パネル danger + 規格外
        mainValue = 'ERROR'
        mainUnit = ''
        mainStatus = 'danger'
        mainBadgeText = '規格外'

        currentI = 'ERROR'
        maxI = 'ERROR'
        ampStatus = 'danger'
        ampBadgeText = '規格外'

        dropV = 'ERROR'
        dropPercent = ''
        dropPercentText = undefined
        dropStatus = 'danger'
        dropBadgeText = '規格外'
      }
      else if (result.optimal && result.optimal.size) {
        // 正常選定
        mainValue = String(result.optimal.size)
        mainUnit = result.optimal.unit || 'sq'
        mainStatus = 'success'

        ampStatus = isAmpCheckOver ? 'danger' : 'success'
        ampBadgeText = isAmpCheckOver ? '許容電流不足' : undefined

        const isDropOver = Boolean(inputs?.targetDrop && Number(dropPercent) > inputs.targetDrop)

        dropStatus = isDropOver ? 'warning' : 'success'
        dropBadgeText = isDropOver ? '降下率超過' : undefined
      }
      else {
        mainValue = 'ERROR'
        mainUnit = ''
        mainStatus = 'danger'
        mainBadgeText = '規格外'
      }
    }
    else {
      // 電圧降下モード
      mainValue = formatVal(result.finalDropV, 'ーー', 2)
      mainUnit = 'V'
      mainStatus = isAmpCheckOver ? 'danger' : 'success'
      mainBadgeText = isAmpCheckOver ? '許容電流不足' : undefined

      ampStatus = isAmpCheckOver ? 'danger' : 'success'
      ampBadgeText = isAmpCheckOver ? '許容電流不足' : undefined

      dropStatus = 'success'
    }
  }

  const isAmpError = currentI === 'ERROR'
  const isDropError = dropV === 'ERROR'

  const details: ResultDetailItem[] | undefined = mode === 'drop'
    ? [
        { label: '選択ケーブル', value: dropCableName },
        { label: '電圧降下率', value: dropRateText },
      ]
    : undefined

  return {
    isReady,
    mode,
    mainLabel,
    mainValue,
    mainUnit,
    mainStatus,
    mainBadgeText,
    currentI,
    maxI,
    isAmpError,
    ampStatus,
    ampBadgeText,
    dropV,
    dropPercent,
    dropPercentText,
    isDropError,
    dropStatus,
    dropBadgeText,
    details,
    errorInfo,
  }
}
