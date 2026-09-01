import { describe, expect, it } from 'vitest'

import { buildFormula, formatVal, hlNg, hlOk, hlVal, TEX_DANGER_CLASS, TEX_HL_CLASS, TEX_SUCCESS_CLASS } from '~/utils/math'

describe('mathUtils', () => {
  describe('hlVal', () => {
    it('should format a valid number and wrap it with htmlClass', () => {
      expect(hlVal(12.34, 'X')).toBe(`\\htmlClass{${TEX_HL_CLASS}}{12.3}`)
      expect(hlVal(12.36, 'X')).toBe(`\\htmlClass{${TEX_HL_CLASS}}{12.4}`) // rounding check
      expect(hlVal('12.34', 'X')).toBe(`\\htmlClass{${TEX_HL_CLASS}}{12.3}`)
    })

    it('should format an integer without decimal points', () => {
      expect(hlVal(12, 'X')).toBe(`\\htmlClass{${TEX_HL_CLASS}}{12}`)
      expect(hlVal('12', 'X')).toBe(`\\htmlClass{${TEX_HL_CLASS}}{12}`)
    })

    it('should format with custom decimal places', () => {
      expect(hlVal(12.345, 'X', 2)).toBe(`\\htmlClass{${TEX_HL_CLASS}}{12.35}`)
    })

    it('should format with a custom class name', () => {
      expect(hlVal(12.3, 'X', 1, 'custom-class')).toBe('\\htmlClass{custom-class}{12.3}')
    })

    it('should return fallback for invalid or empty values', () => {
      expect(hlVal(null, 'FALLBACK')).toBe('FALLBACK')
      expect(hlVal(undefined, 'FALLBACK')).toBe('FALLBACK')
      expect(hlVal('', 'FALLBACK')).toBe('FALLBACK')
      expect(hlVal('abc', 'FALLBACK')).toBe('FALLBACK')
      expect(hlVal(NaN, 'FALLBACK')).toBe('FALLBACK')
    })
  })

  describe('formatVal', () => {
    it('should format a valid number without wrapping', () => {
      expect(formatVal(12.34, 'X')).toBe('12.3')
      expect(formatVal('12.34', 'X')).toBe('12.3')
      expect(formatVal(12, 'X')).toBe('12')
    })

    it('should format with custom decimal places', () => {
      expect(formatVal(12.345, 'X', 2)).toBe('12.35')
    })

    it('should return fallback for invalid or empty values', () => {
      expect(formatVal(null, 'FALLBACK')).toBe('FALLBACK')
      expect(formatVal(undefined, 'FALLBACK')).toBe('FALLBACK')
      expect(formatVal('', 'FALLBACK')).toBe('FALLBACK')
      expect(formatVal('abc', 'FALLBACK')).toBe('FALLBACK')
      expect(formatVal(NaN, 'FALLBACK')).toBe('FALLBACK')
    })
  })

  describe('hlOk / hlNg', () => {
    it('should wrap value with success class', () => {
      expect(hlOk('OK')).toBe(`\\htmlClass{${TEX_SUCCESS_CLASS}}{OK}`)
      expect(hlOk(100)).toBe(`\\htmlClass{${TEX_SUCCESS_CLASS}}{100}`)
    })

    it('should wrap value with danger class', () => {
      expect(hlNg('NG')).toBe(`\\htmlClass{${TEX_DANGER_CLASS}}{NG}`)
      expect(hlNg(0)).toBe(`\\htmlClass{${TEX_DANGER_CLASS}}{0}`)
    })
  })

  describe('buildFormula', () => {
    it('should build a simple formula without result or unit', () => {
      const tex = buildFormula('A', 'B + C')

      expect(tex).toBe('\\begin{aligned} A &= B + C \\end{aligned}')
    })

    it('should build a formula with result but no unit', () => {
      const tex = buildFormula('A', 'B + C', '10')

      expect(tex).toBe('\\begin{aligned} A &= B + C \\\\ &= 10 \\end{aligned}')
    })

    it('should build a formula with result and unit', () => {
      const tex = buildFormula('A', 'B + C', '10', 'A')

      expect(tex).toBe('\\begin{aligned} A &= B + C \\\\ &= 10 \\text{ [A]} \\end{aligned}')
    })

    it('should handle superscript in units correctly', () => {
      const tex = buildFormula('A', 'B \\times C', '100', 'mm^2')

      // ^(\d+) becomes }^$1\text{
      // mm^2 -> mm}^2\text{
      expect(tex).toBe('\\begin{aligned} A &= B \\times C \\\\ &= 100 \\text{ [mm}^2\\text{]} \\end{aligned}')
    })
  })
})
