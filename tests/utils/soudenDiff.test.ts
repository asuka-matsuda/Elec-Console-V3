import { describe, expect, it } from 'vitest'

import { getPhaseDiffItems } from '../../shared/utils/soudenExam'

describe('getPhaseDiffItems & Conflict Diff Extraction', () => {
  it('correctly compares Phase 1 confirmation and mashishime', () => {
    const serverData = { p1Kakunin: 1, p1Mashishime: 0, p1Bikou: '問題なし' }
    const clientPayload = { kakunin: true, mashishime: true, bikou: '問題なし' }

    const diffs = getPhaseDiffItems(1, serverData, clientPayload)

    expect(diffs).toHaveLength(3)

    const kakunin = diffs.find(d => d.key === 'kakunin')

    expect(kakunin?.serverValue).toBe('済')
    expect(kakunin?.clientValue).toBe('済')
    expect(kakunin?.isDifferent).toBe(false)

    const mashi = diffs.find(d => d.key === 'mashishime')

    expect(mashi?.serverValue).toBe('未')
    expect(mashi?.clientValue).toBe('済')
    expect(mashi?.isDifferent).toBe(true)

    const bikou = diffs.find(d => d.key === 'bikou')

    expect(bikou?.isDifferent).toBe(false)
  })

  it('correctly compares Phase 2 insulation resistance values and detects differences', () => {
    const serverData = { zetsuenR: 100, zetsuenS: 50, zetsuenT: 20 }
    const clientPayload = { rVal: 100, sVal: 200, tVal: 20 }

    const diffs = getPhaseDiffItems(2, serverData, clientPayload)

    const r = diffs.find(d => d.key === 'rVal')

    expect(r?.serverValue).toBe('100 MΩ')
    expect(r?.clientValue).toBe('100 MΩ')
    expect(r?.isDifferent).toBe(false)

    const s = diffs.find(d => d.key === 'sVal')

    expect(s?.serverValue).toBe('50 MΩ')
    expect(s?.clientValue).toBe('200 MΩ')
    expect(s?.isDifferent).toBe(true)

    const t = diffs.find(d => d.key === 'tVal')

    expect(t?.isDifferent).toBe(false)
  })

  it('correctly compares Phase 3 voltages and phase rotation check', () => {
    const serverData = { denatsuRs: 200, denatsuSt: 201, denatsuRt: 200, kensou: '正相' }
    const clientPayload = { rs: 200, st: 205, rt: 200, kensou: '正相' }

    const diffs = getPhaseDiffItems(3, serverData, clientPayload)

    const rs = diffs.find(d => d.key === 'rs')

    expect(rs?.serverValue).toBe('200 V')
    expect(rs?.isDifferent).toBe(false)

    const st = diffs.find(d => d.key === 'st')

    expect(st?.serverValue).toBe('201 V')
    expect(st?.clientValue).toBe('205 V')
    expect(st?.isDifferent).toBe(true)

    const kensou = diffs.find(d => d.key === 'kensou')

    expect(kensou?.isDifferent).toBe(false)
  })
})
