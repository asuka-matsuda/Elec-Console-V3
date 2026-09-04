import type { VoltageCalcInputs, VoltageCalcResult } from '~/types/voltage'
import { formatVal } from '~/utils/math'

export interface VoltageResultViewModel {
  isReady: boolean
  mode: 'drop' | 'size'
  dropCableName: string
  mainLabel: string
  mainValue: string
  mainUnit: string
  mainStatusClass: 'is-neutral' | 'is-success' | 'is-warning' | 'is-danger'
  currentI: string
  maxI: string
  ampStatusClass: 'is-neutral' | 'is-success' | 'is-danger'
  dropV: string
  dropPercent: string
  dropStatusClass: 'is-neutral' | 'is-success' | 'is-warning'
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

  // ドロップ時のケーブル名
  const dropCableName = !isReady ? 'ーー' : (result?.optimal?.name || 'ーー')

  // メイン指標（降下電圧 または 選定サイズ）
  const mainLabel = mode === 'size' ? '選定ケーブルサイズ' : '電圧降下'

  let mainValue = 'ーー'
  let mainUnit = mode === 'size' ? 'sq' : 'V'
  let mainStatusClass: VoltageResultViewModel['mainStatusClass'] = 'is-neutral'

  if (isReady && result) {
    if (mode === 'size') {
      const size = result.optimal?.size

      mainValue = size ? String(size) : '選定不可'
      mainUnit = result.optimal?.unit || 'sq'
      mainStatusClass = result.optimal ? 'is-success' : 'is-danger'
    }
    else {
      mainValue = formatVal(result.finalDropV, 'ーー', 2)
      mainUnit = 'V'
      mainStatusClass
        = (inputs?.I || 0) <= result.finalEffAmp ? 'is-success' : 'is-danger'
    }
  }

  // 電流チェック (設計 / 許容)
  const currentI = isReady && inputs ? formatVal(inputs.I, 'ーー', 1) : 'ーー'
  const maxI
    = isReady && result ? formatVal(result.finalEffAmp, 'ーー', 1) : 'ーー'
  const ampStatusClass: VoltageResultViewModel['ampStatusClass']
    = !isReady || !result
      ? 'is-neutral'
      : (inputs?.I || 0) <= result.finalEffAmp
          ? 'is-success'
          : 'is-danger'

  // 電圧降下 (V / %)
  const dropV
    = isReady && result ? formatVal(result.finalDropV, 'ーー', 2) : 'ーー'

  let dropPercent = 'ーー'
  let dropStatusClass: VoltageResultViewModel['dropStatusClass'] = 'is-neutral'

  if (isReady && result && inputs?.sys?.voltage) {
    const currentPercent = (result.finalDropV / inputs.sys.voltage) * 100

    dropPercent = formatVal(currentPercent, 'ーー', 2)

    if (mode === 'size' && inputs.targetDrop) {
      dropStatusClass
        = currentPercent <= inputs.targetDrop ? 'is-success' : 'is-warning'
    }
    else {
      dropStatusClass = 'is-success'
    }
  }

  return {
    isReady,
    mode,
    dropCableName,
    mainLabel,
    mainValue,
    mainUnit,
    mainStatusClass,
    currentI,
    maxI,
    ampStatusClass,
    dropV,
    dropPercent,
    dropStatusClass,
  }
}
