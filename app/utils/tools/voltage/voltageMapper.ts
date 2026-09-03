import { cableData } from '~/constants/data/cableData'
import { systemData } from '~/constants/data/systemData'
import type { SystemData, VoltageCalcInputs } from '~/types/voltage'
import { calculateDesignCurrent } from '~/utils/tools/voltage/calcVoltageEngine'
import { voltageSchema } from '~/utils/tools/voltage/voltageSchema'

export interface VoltageFormState {
  mode: 'drop' | 'size'
  phase: string
  loadValue: number | null
  loadUnit: string
  powerFactor: string
  distance: number | null
  cableType: string
  cores: string
  fixedSize: string
  parallel: string
  derating: string
  ambientTemp: string
  targetDrop: string
}

export function mapFormToVoltageCalcInputs(
  form: VoltageFormState,
): VoltageCalcInputs {
  const mode = form.mode
  const sys = systemData.find(s => s.id === form.phase) || null
  const loadVal = form.loadValue
  const loadUnit = form.loadUnit
  const pf = form.powerFactor ? parseFloat(form.powerFactor) : null
  const L = form.distance
  const cableType = form.cableType || ''
  const rawSize = form.fixedSize || ''

  let selectedSize: number | null = null
  let selectedCores: string | null = null

  if (mode === 'size') {
    selectedCores = form.cores || null
  }
  else if (rawSize && rawSize.startsWith('idx_')) {
    const idx = parseInt(rawSize.replace('idx_', ''), 10)
    const cable = cableData[idx]

    if (cable) {
      selectedSize = parseFloat(String(cable.size))
      selectedCores = cable.cores || null
    }
  }

  const derating = form.derating ? parseFloat(form.derating) : null
  const rawTempVal = form.ambientTemp
  const ambientTemp
    = rawTempVal && rawTempVal !== 'none' ? parseFloat(rawTempVal) : null
  const parallel = form.parallel ? parseInt(form.parallel) : null
  const targetDrop = form.targetDrop ? parseFloat(form.targetDrop) : null

  const I = calculateDesignCurrent(sys, loadVal, loadUnit, pf ?? undefined)

  const validationResult = voltageSchema.safeParse(form)

  return {
    mode,
    sys: sys as SystemData,
    I,
    L,
    cableType,
    selectedCores,
    derating,
    rawTempVal,
    ambientTemp,
    parallel,
    targetDrop,
    selectedSize,
    loadVal,
    loadUnit,
    pf,
    isReady: validationResult.success,
    missingFields: validationResult.success
      ? []
      : validationResult.error.errors.map(e => String(e.path[0])),
  }
}
