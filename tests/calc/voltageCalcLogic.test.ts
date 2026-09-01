import { describe, expect, it } from 'vitest'

import { calculateDesignCurrent, getAmbientTempDerating } from '~/utils/tools/voltage/voltageCalcLogic'

describe('voltageCalcLogic', () => {
  describe('calculateDesignCurrent', () => {
    const sys3 = {
      id: '3_3w_200v',
      name: '三相3線式 200V',
      voltage: 200,
      simpleK: 30.8,
      preciseK: 1.732,
      kwDivisor: 200 * 1.732, // 346.4
      wireCount: 3,
    }

    const sys1 = {
      id: '1_2w_100v',
      name: '単相2線式 100V',
      voltage: 100,
      simpleK: 35.6,
      preciseK: 2.0,
      kwDivisor: 100,
      wireCount: 2,
    }

    it('should return null for invalid loadVal', () => {
      expect(calculateDesignCurrent(sys3, null, 'A')).toBeNull()
      expect(calculateDesignCurrent(sys3, undefined, 'A')).toBeNull()
      expect(calculateDesignCurrent(sys3, -10, 'A')).toBeNull()
      expect(calculateDesignCurrent(sys3, 0, 'A')).toBeNull()
    })

    it('should return loadVal directly if unit is A', () => {
      expect(calculateDesignCurrent(sys3, 15, 'A')).toBe(15)
    })

    it('should calculate current for kW', () => {
      // 10kW, 3相200V, pf=0.8
      // I = (10 * 1000) / (200 * 1.732 * 0.8) = 10000 / 277.12 = 36.08
      const current = calculateDesignCurrent(sys3, 10, 'kW', 0.8)

      expect(current).toBeCloseTo(36.085, 2)
    })

    it('should calculate current for kVA', () => {
      // 10kVA, 単相100V
      // I = (10 * 1000) / 100 = 100
      const current = calculateDesignCurrent(sys1, 10, 'kVA')

      expect(current).toBe(100)
    })

    it('should calculate current for VA', () => {
      // 5000VA, 単相100V
      // I = 5000 / 100 = 50
      const current = calculateDesignCurrent(sys1, 5000, 'VA')

      expect(current).toBe(50)
    })
  })

  describe('getAmbientTempDerating', () => {
    it('should return 1.0 for invalid inputs', () => {
      expect(getAmbientTempDerating('30', '60', null)).toBe(1.0)
      expect(getAmbientTempDerating('abc', '60', 40)).toBe(1.0)
    })

    it('should calculate correct derating factor', () => {
      // base=30, max=60, ambient=40
      // sqrt((60 - 40) / (60 - 30)) = sqrt(20 / 30) = sqrt(0.666) ≈ 0.816
      const factor = getAmbientTempDerating(30, 60, 40)

      expect(factor).toBeCloseTo(0.816, 3)
    })

    it('should return 0.1 if ambientTemp is greater than or equal to maxTemp', () => {
      expect(getAmbientTempDerating(30, 60, 60)).toBe(0.1)
      expect(getAmbientTempDerating(30, 60, 70)).toBe(0.1)
    })
  })

  // Note: calculateLogic testing involves mocking or using defaultCableData,
  // which might be extensive. We can add core cases here.
})
