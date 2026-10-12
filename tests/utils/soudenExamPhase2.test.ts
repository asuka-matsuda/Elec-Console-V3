import { describe, expect, it } from 'vitest'

import { PHASE2_TABLE_COLUMNS } from '../../app/constants/soudenConstants'
import {
  getPhase2ActivePhases,
  isPhase2MeasurementsPass,
} from '../../shared/utils/soudenExam'

describe('フェーズ2 相種別による測定相制御 (getPhase2ActivePhases)', () => {
  it('RN (1Φ2W 100V) では R-E と S(N)-E が有効で、T-E は無効になること', () => {
    const active = getPhase2ActivePhases('RN', '1Φ2W 100V')

    expect(active.hasR).toBe(true)
    expect(active.hasS).toBe(true)
    expect(active.hasT).toBe(false)
    expect(active.labelR).toBe('R-E')
    expect(active.labelS).toBe('N-E')
    expect(active.labelT).toBe('T-E')
  })

  it('TN (1Φ2W 100V) では S(N)-E と T-E が有効で、R-E は無効になること', () => {
    const active = getPhase2ActivePhases('TN', '1Φ2W 100V')

    expect(active.hasR).toBe(false)
    expect(active.hasS).toBe(true)
    expect(active.hasT).toBe(true)
    expect(active.labelR).toBe('R-E')
    expect(active.labelS).toBe('N-E')
    expect(active.labelT).toBe('T-E')
  })

  it('RT (1Φ2W 200V) では R-E と T-E が有効で、S(N)-E は無効になること', () => {
    const active = getPhase2ActivePhases('RT', '1Φ2W 200V')

    expect(active.hasR).toBe(true)
    expect(active.hasS).toBe(false)
    expect(active.hasT).toBe(true)
    expect(active.labelR).toBe('R-E')
    expect(active.labelS).toBe('S-E')
    expect(active.labelT).toBe('T-E')
  })

  it('RNT (1Φ3W 100/200V) では全相が有効で、中性線ラベルは N-E になること', () => {
    const active = getPhase2ActivePhases('RNT', '1Φ3W 100/200V')

    expect(active.hasR).toBe(true)
    expect(active.hasS).toBe(true)
    expect(active.hasT).toBe(true)
    expect(active.labelR).toBe('R-E')
    expect(active.labelS).toBe('N-E')
    expect(active.labelT).toBe('T-E')
  })

  it('RST (3Φ3W 200V) では全相が有効で、S相ラベルは S-E になること', () => {
    const active = getPhase2ActivePhases('RST', '3Φ3W 200V')

    expect(active.hasR).toBe(true)
    expect(active.hasS).toBe(true)
    expect(active.hasT).toBe(true)
    expect(active.labelR).toBe('R-E')
    expect(active.labelS).toBe('S-E')
    expect(active.labelT).toBe('T-E')
  })

  it('RS では R-E と S-E が有効で、T-E は無効になること', () => {
    const active = getPhase2ActivePhases('RS')

    expect(active.hasR).toBe(true)
    expect(active.hasS).toBe(true)
    expect(active.hasT).toBe(false)
    expect(active.labelR).toBe('R-E')
    expect(active.labelS).toBe('S-E')
    expect(active.labelT).toBe('T-E')
  })

  it('ST では S-E と T-E が有効で、R-E は無効になること', () => {
    const active = getPhase2ActivePhases('ST')

    expect(active.hasR).toBe(false)
    expect(active.hasS).toBe(true)
    expect(active.hasT).toBe(true)
    expect(active.labelR).toBe('R-E')
    expect(active.labelS).toBe('S-E')
    expect(active.labelT).toBe('T-E')
  })

  it('souShubetsu が未指定の場合、haidenHoushiki から適切にフォールバックすること', () => {
    const fallback100V = getPhase2ActivePhases(null, '1Φ2W 100V')

    expect(fallback100V.hasR).toBe(true)
    expect(fallback100V.hasS).toBe(true)
    expect(fallback100V.hasT).toBe(false)

    const fallback200V = getPhase2ActivePhases(null, '1Φ2W 200V')

    expect(fallback200V.hasR).toBe(true)
    expect(fallback200V.hasS).toBe(false)
    expect(fallback200V.hasT).toBe(true)

    const fallback3W = getPhase2ActivePhases(null, '1Φ3W 100/200V')

    expect(fallback3W.hasR).toBe(true)
    expect(fallback3W.hasS).toBe(true)
    expect(fallback3W.hasT).toBe(true)
  })
})

describe('フェーズ2 合否判定 (isPhase2MeasurementsPass)', () => {
  it('RN回路の場合、R相とS(N)相がOKであればT相が未入力でも合格と判定されること', () => {
    const activeRN = getPhase2ActivePhases('RN')

    expect(isPhase2MeasurementsPass(activeRN, 'OK', 'OK', null)).toBe(true)
    expect(isPhase2MeasurementsPass(activeRN, 'OK', 'OK', '')).toBe(true)
    expect(isPhase2MeasurementsPass(activeRN, 'OK', 'NG', null)).toBe(false)
    expect(isPhase2MeasurementsPass(activeRN, 'NG', 'OK', null)).toBe(false)
  })

  it('TN回路の場合、S(N)相とT相がOKであればR相が未入力でも合格と判定されること', () => {
    const activeTN = getPhase2ActivePhases('TN')

    expect(isPhase2MeasurementsPass(activeTN, null, 'OK', 'OK')).toBe(true)
    expect(isPhase2MeasurementsPass(activeTN, null, 'OK', 'NG')).toBe(false)
  })

  it('RT回路の場合、R相とT相がOKであればS相が未入力でも合格と判定されること', () => {
    const activeRT = getPhase2ActivePhases('RT')

    expect(isPhase2MeasurementsPass(activeRT, 'OK', null, 'OK')).toBe(true)
    expect(isPhase2MeasurementsPass(activeRT, 'NG', null, 'OK')).toBe(false)
  })

  it('RST回路の場合、3相すべてがOKでなければ合格にならないこと', () => {
    const activeRST = getPhase2ActivePhases('RST')

    expect(isPhase2MeasurementsPass(activeRST, 'OK', 'OK', 'OK')).toBe(true)
    expect(isPhase2MeasurementsPass(activeRST, 'OK', 'OK', null)).toBe(false)
    expect(isPhase2MeasurementsPass(activeRST, 'OK', 'OK', 'NG')).toBe(false)
  })
})

describe('フェーズ2 テーブル列見出し定義 (PHASE2_TABLE_COLUMNS)', () => {
  it('列見出しが線間ではなく大地間 R-E, S（N）-E, T-E になっていること', () => {
    const colR = PHASE2_TABLE_COLUMNS.find(c => c.key === 'zetsuenR')
    const colS = PHASE2_TABLE_COLUMNS.find(c => c.key === 'zetsuenS')
    const colT = PHASE2_TABLE_COLUMNS.find(c => c.key === 'zetsuenT')

    expect(colR?.label).toBe('R-E')
    expect(colS?.label).toBe('S（N）-E')
    expect(colT?.label).toBe('T-E')
  })
})
