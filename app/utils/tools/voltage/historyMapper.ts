import { getVoltageFormFields } from '~/constants/config/voltageFormConfig'
import { cableData } from '~/constants/data/cableData'
import type { CableData } from '~/types/database'
import type { HistoryEntry } from '~/types/history'
import type { VoltageCalcInputs, VoltageCalcResult } from '~/types/voltage'

/**
 * 電圧降下の計算入出力を HistoryEntry 形式に変換する
 */
export function mapVoltageToHistory(
  toolName: string,
  inputs: VoltageCalcInputs,
  result: VoltageCalcResult | null,
): Omit<HistoryEntry, 'id' | 'timestamp'> {
  const formFields = getVoltageFormFields(
    () => true,
    () => true,
    () => [],
    () => !!inputs.cableType,
  )

  const getLabel = (id: string) => {
    return formFields.find(f => f.id === id)?.label || id
  }

  const isAuto = inputs.mode === 'size'

  const historyInputs: { label: string, value: string }[] = []

  const sysName = inputs.sys ? inputs.sys.label : '未選択'

  historyInputs.push({ label: getLabel('phase'), value: sysName })

  const pfStr = inputs.pf ? inputs.pf.toString() : '1.0'
  const loadStr = `${inputs.loadVal}${inputs.loadUnit} (力率: ${pfStr})`

  historyInputs.push({ label: getLabel('loadValue'), value: loadStr })

  historyInputs.push({
    label: getLabel('distance'),
    value: `${inputs.L ?? '--'}m`,
  })

  if (isAuto) {
    historyInputs.push({
      label: getLabel('targetDrop'),
      value: `規定 ${inputs.targetDrop}%`,
    })
  }

  historyInputs.push({
    label: getLabel('parallel'),
    value: `${inputs.parallel ?? '--'}条`,
  })

  const tempStr
    = inputs.rawTempVal && inputs.rawTempVal !== 'none'
      ? `${inputs.ambientTemp}℃`
      : 'なし'

  historyInputs.push({ label: getLabel('ambientTemp'), value: tempStr })

  historyInputs.push({
    label: getLabel('derating'),
    value: inputs.derating ? inputs.derating.toString() : '--',
  })

  const resolveVoltageCableName = (
    category: string,
    size: number | string | null,
    cores: string | null,
  ): string => {
    if (!category || size === null || size === '') return ''
    const sizeNum = parseFloat(String(size))
    const matched = cableData.find(
      (c: CableData) =>
        c.category === category
        && parseFloat(String(c.size)) === sizeNum
        && (!cores || c.cores === cores),
    )

    return matched?.name || `${category} ${size}sq`
  }

  if (!isAuto) {
    const cabName = resolveVoltageCableName(
      inputs.cableType,
      inputs.selectedSize,
      inputs.selectedCores,
    )

    historyInputs.push({ label: getLabel('cableType'), value: cabName })
  }

  const historyResults: {
    label: string
    value: string
    isMain?: boolean
    color?: string
  }[] = []

  let mainResultText = 'エラー'
  let status: 'success' | 'error' | 'warning' = 'success'

  if (!result) {
    status = 'error'
    historyResults.push({
      label: isAuto ? '選定ケーブル' : '判定',
      value: '計算エラー（条件超過）',
      isMain: true as boolean,
      color: 'var(--color-status-danger)',
    })
  }
  else {
    const maxDropV = inputs.sys.voltage * ((inputs.targetDrop || 100) / 100)
    const isAmpOver
      = result.finalEffAmp > 0 && (inputs.I ?? 0) > result.finalEffAmp
    const isDropOver = !isAuto && result.finalDropV > maxDropV
    const hasError = isAmpOver || isDropOver

    if (hasError) status = 'error'

    const cabType = isAuto
      ? result.optimal.category || ''
      : inputs.cableType || ''
    const size = isAuto ? result.optimal.size : inputs.selectedSize
    const cableNameStr = resolveVoltageCableName(cabType, size, inputs.selectedCores)

    const parallelCount = inputs.parallel ?? 1

    mainResultText
      = parallelCount > 1 ? `${cableNameStr} × ${parallelCount}条` : cableNameStr

    historyResults.push({
      label: isAuto ? '選定ケーブル' : '判定',
      value: mainResultText,
      isMain: true as boolean,
      color: hasError ? 'var(--color-status-danger)' : undefined,
    })

    const dropPct = ((result.finalDropV / inputs.sys.voltage) * 100).toFixed(2)
    const dropText = `${result.finalDropV.toFixed(2)}V (${dropPct}%)`

    historyResults.push({ label: '電圧降下', value: dropText })

    historyResults.push({
      label: '設計電流',
      value: `${inputs.I?.toFixed(1) ?? '--'}A`,
    })

    historyResults.push({
      label: '許容電流',
      value: result.finalEffAmp > 0 ? `${result.finalEffAmp.toFixed(1)}A` : '-',
    })
  }

  return {
    toolName: isAuto ? 'ケーブルサイズ自動選定' : '電圧降下計算',
    mode: isAuto ? 'サイズ選定' : '電圧降下',
    status,
    mainResultText,
    inputs: historyInputs,
    results: historyResults,
  }
}
