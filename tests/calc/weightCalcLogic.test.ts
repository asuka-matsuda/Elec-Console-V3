import { describe, expect, it } from 'vitest'

import type { CableData, DrumData } from '~/types/database'
import type { WeightCalcInputs } from '~/utils/tools/weight/weightCalcLogic'
import { calculateWeightAndDrum, generateMathData } from '~/utils/tools/weight/weightCalcLogic'

describe('weightCalcLogic', () => {
  const mockCableData: CableData[] = [
    { category: 'CV', diameter: '10', weight: '150', size: '14', unit: 'sq', cores: '3C' },
  ]

  const mockDrumData: DrumData[] = [
    { id: '1号', category: '1', flange_diameter: 1000, barrel_diameter: 500, inner_width: 500, max_winding_weight: 500, weight: 50 },
    { id: '2号', category: '2', flange_diameter: 1200, barrel_diameter: 600, inner_width: 600, max_winding_weight: 1000, weight: 80 },
  ]

  describe('calculateWeightAndDrum', () => {
    it('should throw error if inputs are incomplete', () => {
      const inputs: WeightCalcInputs = {
        category: '',
        cableIdx: '',
        L_input: null,
      }

      expect(() => calculateWeightAndDrum(inputs, mockCableData, mockDrumData)).toThrow('Invalid inputs')
    })

    it('should calculate weight correctly and compute m with (W2 / d) - 1', () => {
      const inputs: WeightCalcInputs = {
        category: 'CV',
        cableIdx: 'idx_0', // mock index
        L_input: 100, // 100m
      }

      const res = calculateWeightAndDrum(inputs, mockCableData, mockDrumData)

      // Weight per km = 150 kg/km
      // Length = 100m -> 0.1km
      // Weight = 150 * 0.1 = 15 kg
      expect(res.error).toBe(false)
      expect(res.cableWeight).toBeCloseTo(15, 2)
      // m = floor(500 / 10) - 1 = 49
      expect(res.bestMathParams?.m).toBe(49)
    })

    it('should return drum_not_found if weight exceeds all drums', () => {
      const inputs: WeightCalcInputs = {
        category: 'CV',
        cableIdx: 'idx_0',
        L_input: 10000, // 10km -> 1500 kg
      }

      // max_winding_weight in mock is 1000, so it will fail
      const res = calculateWeightAndDrum(inputs, mockCableData, mockDrumData)

      expect(res.error).toBe(true)
      expect(res.reason).toBe('drum_not_found')
      expect(res.cableWeight).toBeCloseTo(1500, 2)
    })
  })

  describe('generateMathData', () => {
    it('should generate 4 math steps with m = (W2/d) - 1 formula without drum fill factor K', () => {
      const inputs: WeightCalcInputs = {
        category: 'CV',
        cableIdx: 'idx_0',
        L_input: 100,
      }

      const res = calculateWeightAndDrum(inputs, mockCableData, mockDrumData)
      const steps = generateMathData(inputs, res, mockCableData)

      expect(steps).toHaveLength(4)

      const step3 = steps[2]

      expect(step3?.title).toContain('容量判定')
      // tex3 should include formula for m = (W2/d) - 1
      expect(step3?.tex).toContain('\\frac{W_2}{d} \\right\\rfloor - 1')
      expect(step3?.tex).toContain('49')
      // legend should NOT include ドラム占積率
      expect(step3?.legend.some(l => l.includes('ドラム占積率'))).toBe(false)
      expect(step3?.legend.some(l => l.includes('1層にならぶ条数'))).toBe(true)
      expect(step3?.legend.some(l => l.includes('巻取層数'))).toBe(true)

      const step4 = steps[3]

      expect(step4?.title).toContain('総合選定結果')
      expect(step4?.tex).toContain('1号')
      expect(step4?.tex).toContain('総重量')
    })

    it('should provide fallback formulas when inputs or result are incomplete', () => {
      const inputs: WeightCalcInputs = {
        category: '',
        cableIdx: '',
        L_input: null,
      }

      const steps = generateMathData(inputs, null, mockCableData)

      expect(steps).toHaveLength(4)

      const step3 = steps[2]

      expect(step3?.tex).toContain('\\frac{W_2}{d} \\right\\rfloor - 1')
      expect(step3?.legend.some(l => l.includes('ドラム占積率'))).toBe(false)

      const step4 = steps[3]

      expect(step4?.title).toContain('総合選定結果')
      expect(step4?.tex).toContain('【 --- 】')
    })
  })
})
