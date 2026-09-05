import { describe, expect, it } from 'vitest'

import { calculateRackSize } from '../../app/utils/tools/rack/rackCalcLogic'

describe('rackCalcLogic', () => {
  describe('calculateRackSize', () => {
    const standardRackSizes = [100, 200, 300, 400, 500, 600, 800, 1000, 1200]

    it('should calculate rack size for strong cables only', () => {
      // settings: strong only, L=1
      // cables: d=20 (n=2), d=30 (n=1)
      // sum = (20+10)*2 + (30+10)*1 = 60 + 40 = 100
      // wStrong = 1.2 * (100 + 60) / 1 = 192
      const res = calculateRackSize(
        {
          mode: 'strong',
          layers: 1,
          rackHeight: 110,
          maxDepth: 100,
          cables: [{ d: 20, n: 2 }, { d: 30, n: 1 }],
          otherWidth: 0,
        },
        standardRackSizes,
      )

      expect(res.error).toBe(false)
      expect(res.wStrong).toBe(192)
      expect(res.selectedSize).toBe(200)
      expect(res.isOverflow).toBe(false)
    })

    it('should account for multi-layer stacking (L > 1)', () => {
      // settings: strong, L=2
      // cables: d=20 (n=3)
      // sum = (20+10)*3 = 90
      // wStrong = 1.2 * (90 + 60) / 2 = 90
      const res = calculateRackSize(
        {
          mode: 'strong',
          layers: 2,
          rackHeight: 100,
          maxDepth: 90,
          cables: [{ d: 20, n: 3 }],
          otherWidth: 0,
        },
        standardRackSizes,
      )

      expect(res.wStrong).toBe(90)
      expect(res.selectedSize).toBe(100)
    })

    it('should calculate rack size with other width (weak cables required width)', () => {
      // strong: d=10 (n=5) -> sum = 100 -> W = 1.2 * (100 + 60) = 192
      // otherWidth (weak required): 150
      // total W = 192 + 150 = 342
      // optimal = 400
      const res = calculateRackSize(
        {
          mode: 'strong',
          layers: 1,
          rackHeight: 100,
          maxDepth: 90,
          cables: [{ d: 10, n: 5 }],
          otherWidth: 150,
        },
        standardRackSizes,
      )

      expect(res.error).toBe(false)
      expect(res.wStrong).toBe(192)
      expect(res.wWeak).toBe(150)
      expect(res.totalWidth).toBe(342)
      expect(res.selectedSize).toBe(400)
    })

    it('should return error if inputs are invalid', () => {
      // missing standard sizes array
      const res = calculateRackSize(
        {
          mode: 'strong',
          layers: 1,
          rackHeight: 100,
          maxDepth: 90,
          cables: [{ d: 20, n: 2 }],
          otherWidth: 0,
        },
        [],
      )

      expect(res.error).toBe(true)
    })

    it('should return SIZE_OVER if calculated size exceeds max standard size', () => {
      // totalW = 2052, max size = 1200
      const res = calculateRackSize(
        {
          mode: 'strong',
          layers: 1,
          rackHeight: 100,
          maxDepth: 90,
          cables: [{ d: 100, n: 15 }],
          otherWidth: 0,
        },
        standardRackSizes,
      )

      expect(res.error).toBe(true)
      expect(res.selectedSize).toBeNull()
      expect(res.totalWidth).toBe(2052)
    })
  })
})
