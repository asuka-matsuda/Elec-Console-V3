import { describe, expect, it } from 'vitest'

import {
  determineSetsuchiType,
  isElcbBreaker,
  isVoltageOver300V,
} from '../../shared/utils/soudenExam'

describe('接地種別（setsuchiList）自動判定ロジック', () => {
  describe('isVoltageOver300V', () => {
    it('300Vを超える配電方式を正しく検知する', () => {
      expect(isVoltageOver300V('3Φ3W 400V')).toBe(true)
      expect(isVoltageOver300V('3Φ4W 415V')).toBe(true)
      expect(isVoltageOver300V('440V')).toBe(true)
      expect(isVoltageOver300V('6600V')).toBe(true)
      expect(isVoltageOver300V('380V')).toBe(true)
    })

    it('300V以下の配電方式は false を返す', () => {
      expect(isVoltageOver300V('3Φ3W 200V')).toBe(false)
      expect(isVoltageOver300V('1Φ3W 100/200V')).toBe(false)
      expect(isVoltageOver300V('1Φ2W 100V')).toBe(false)
      expect(isVoltageOver300V('1Φ2W 200V')).toBe(false)
      expect(isVoltageOver300V('')).toBe(false)
      expect(isVoltageOver300V(null)).toBe(false)
    })
  })

  describe('isElcbBreaker', () => {
    it('漏電遮断器（ELCB / ELB）を正しく検知する', () => {
      expect(isElcbBreaker('ELCB')).toBe(true)
      expect(isElcbBreaker('ELB')).toBe(true)
      expect(isElcbBreaker('漏電遮断器')).toBe(true)
      expect(isElcbBreaker('3P 30AF/30AT (ELCB)')).toBe(true)
    })

    it('配線用遮断器（MCCB / MCB）は false を返す', () => {
      expect(isElcbBreaker('MCCB')).toBe(false)
      expect(isElcbBreaker('MCB')).toBe(false)
      expect(isElcbBreaker('配線用遮断器')).toBe(false)
      expect(isElcbBreaker('')).toBe(false)
      expect(isElcbBreaker(null)).toBe(false)
    })
  })

  describe('determineSetsuchiType', () => {
    it('1. 接地（手動）が入力されている場合は手動が最優先される', () => {
      const res = determineSetsuchiType({
        setsuchiManual: '特D種',
        haidenHoushiki: '3Φ3W 400V', // 400Vだが手動が勝つ
        keiTo: '幹線',
        shadankiShubetsu: 'ELCB',
      })

      expect(res).toBe('特D種')
    })

    it('2. 接地有無が「無」の場合は接地対象外（-）となる', () => {
      const res = determineSetsuchiType({
        setsuchiUmu: '無',
        haidenHoushiki: '3Φ3W 200V',
        keiTo: '二次側',
        shadankiShubetsu: 'MCCB',
      })

      expect(res).toBe('-')
    })

    it('3. 使用電圧が300V超の場合は「C種」となる', () => {
      const res = determineSetsuchiType({
        haidenHoushiki: '3Φ3W 400V',
        keiTo: '二次側',
        shadankiShubetsu: 'MCCB',
      })

      expect(res).toBe('C種')
    })

    it('4. 使用電圧が300V以下かつ幹線がTRUEの場合は「D種 / D（ELB）種」となる', () => {
      const res = determineSetsuchiType({
        haidenHoushiki: '3Φ3W 200V',
        keiTo: '幹線',
        shadankiShubetsu: 'MCCB',
      })

      expect(res).toBe('D種 / D（ELB）種')
    })

    it('5. 幹線（TRUE）で接地D種と接地D(ELB)種にサイズが入力されている場合、最大2本で結合されC種(-)は除外される (1L-1の例)', () => {
      const res = determineSetsuchiType({
        haidenHoushiki: '3Φ3W 200V',
        keiTo: '幹線',
        shadankiShubetsu: 'MCCB',
        setsuchiC: '-',
        setsuchiD: 'E 14sq',
        setsuchiDelb: 'E 14sq',
      })

      expect(res).toBe('E 14sq / E 14sq')
    })

    it('6. 幹線（TRUE）で全列が「-」の場合、単一の「-」となる（- / - / - にならない）', () => {
      const res = determineSetsuchiType({
        haidenHoushiki: '3Φ3W 200V',
        keiTo: '幹線',
        shadankiShubetsu: 'MCCB',
        setsuchiC: '-',
        setsuchiD: '-',
        setsuchiDelb: '-',
      })

      expect(res).toBe('-')
    })

    it('7. 使用電圧が300V以下かつ幹線がFALSEかつMCCBの場合は「D種」（最大1本）となる', () => {
      const res = determineSetsuchiType({
        haidenHoushiki: '3Φ3W 200V',
        keiTo: '二次側',
        shadankiShubetsu: 'MCCB',
        setsuchiD: 'E 5.5sq',
      })

      expect(res).toBe('E 5.5sq')
    })

    it('8. 使用電圧が300V以下かつ幹線がFALSEかつELCBの場合は「D（ELB）種」（最大1本）となる', () => {
      const res = determineSetsuchiType({
        haidenHoushiki: '1Φ3W 100/200V',
        keiTo: '二次側',
        shadankiShubetsu: 'ELCB',
        setsuchiDelb: 'E 5.5sq',
      })

      expect(res).toBe('E 5.5sq')
    })

    it('9. 使用電圧が300V超の場合はC種（最大1本）となり、D種・D(ELB)種があってもC種のみが採用される', () => {
      const res = determineSetsuchiType({
        haidenHoushiki: '3Φ3W 400V',
        keiTo: '幹線',
        setsuchiC: 'E 22sq',
        setsuchiD: 'E 14sq',
        setsuchiDelb: 'E 14sq',
      })

      expect(res).toBe('E 22sq')
    })
  })
})
