import { systemData } from '~/constants/data/systemData'
import type { SystemData, VoltageCalcInputs } from '~/types/voltage'
import { findCableByIndexString } from '~/utils/cable'
import { calculateDesignCurrent } from '~/utils/tools/voltage/calcVoltageEngine'
import { voltageSchema } from '~/utils/tools/voltage/voltageSchema'

export interface VoltageFormState {
  mode: 'drop' | 'size'
  phase: string
  loadValue: number | null
  loadUnit: string
  powerFactor: string
  distance: number | null
  category: string
  cores: string
  cableIdx: string
  parallel: string
  derating: string
  ambientTemp: string
  targetDrop: string
  // 旧プロパティとの下位互換性（保存済みLocalStorage復元用）
  cableType?: string
  fixedSize?: string
}

export function mapFormToVoltageCalcInputs(
  form: VoltageFormState,
): VoltageCalcInputs {
  const mode = form.mode
  const sys = systemData.find(s => s.id === form.phase) || null
  const loadVal = form.loadValue
  const loadUnit = form.loadUnit
  const isSinglePhase = sys?.id.startsWith('1P')
  const pf = isSinglePhase
    ? 1.0
    : (form.powerFactor ? parseFloat(form.powerFactor) : null)
  const L = form.distance
  const category = form.category || form.cableType || ''
  const rawIdx = form.cableIdx || form.fixedSize || ''

  let selectedSize: number | null = null
  let selectedCores: string | null = null
  let selectedCableName: string | null = null

  if (mode === 'size') {
    selectedCores = form.cores || null
  }
  else {
    const cable = findCableByIndexString(rawIdx)

    if (cable) {
      selectedSize = parseFloat(String(cable.size))
      selectedCores = cable.cores || null
      selectedCableName = cable.name || null
    }
  }

  const derating = form.derating ? parseFloat(form.derating) : null
  const rawTempVal = form.ambientTemp
  const ambientTemp
    = rawTempVal && rawTempVal !== 'none' ? parseFloat(rawTempVal) : null
  const parallel = form.parallel ? parseInt(form.parallel) : null
  const targetDrop = form.targetDrop ? parseFloat(form.targetDrop) : null

  const I = calculateDesignCurrent(sys, loadVal, loadUnit, pf ?? undefined)

  // バリデーション用正規化オブジェクト
  const normalizedForm = {
    ...form,
    category,
    cableIdx: rawIdx,
  }

  const validationResult = voltageSchema.safeParse(normalizedForm)

  return {
    mode,
    sys: sys as SystemData,
    I,
    L,
    cableType: category,
    selectedCores,
    derating,
    rawTempVal,
    ambientTemp,
    parallel,
    targetDrop,
    selectedSize,
    selectedCableName,
    loadVal,
    loadUnit,
    pf,
    isReady: validationResult.success,
    missingFields: validationResult.success
      ? []
      : validationResult.error.errors.map(e => String(e.path[0])),
  }
}
