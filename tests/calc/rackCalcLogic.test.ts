import { describe, expect, it } from 'vitest'

import { calculateRackSize } from '../../app/utils/tools/rack/rackCalcLogic'

describe('rackCalcLogic', () => {
  describe('calculateRackSize', () => {
    const standardRackSizes = [100, 200, 300, 400, 500, 600, 800, 1000, 1200]

    it('should calculate both tier1 (single layer) and tier2 (double layer) correctly', () => {
      // cables: d=20 (n=2), d=30 (n=1) -> sorted: [30, 20, 20]
      // tier1 (1段):
      //   cablesWidth = (30+10) + (20+10) + (20+10) = 100
      //   wMain = 100 * 1.2 + 60 = 180
      //   selectedSize = 200
      // tier2 (2段):
      //   lower (2本): 30+10 + 20+10 = 70
      //   upper (1本): 20+10 = 30
      //   max = 70
      //   wMain = 70 * 1.2 + 60 = 144
      //   selectedSize = 200
      const res = calculateRackSize(
        {
          mode: 'strong',
          rackHeight: 110,
          maxDepth: 90,
          cables: [{ d: 20, n: 2 }, { d: 30, n: 1 }],
          otherWidth: 0,
        },
        standardRackSizes,
      )

      expect(res.error).toBe(false)
      // Tier 1
      expect(res.tier1.wMain).toBe(180)
      expect(res.tier1.selectedSize).toBe(200)
      expect(res.tier1.maxCableStackHeight).toBe(30)
      expect(res.tier1.isOverflow).toBe(false)
      // Tier 2
      expect(res.tier2.isApplicable).toBe(true)
      expect(res.tier2.wMain).toBe(144)
      expect(res.tier2.selectedSize).toBe(200)
      expect(res.tier2.maxCableStackHeight).toBe(50) // 30 + 20
      expect(res.tier2.isOverflow).toBe(false)
    })

    it('should handle single cable case where tier2 is not applicable', () => {
      const res = calculateRackSize(
        {
          mode: 'strong',
          rackHeight: 100,
          maxDepth: 80,
          cables: [{ d: 30, n: 1 }],
          otherWidth: 0,
        },
        standardRackSizes,
      )

      expect(res.tier1.wMain).toBe(108) // (30+10)*1.2 + 60 = 48 + 60 = 108
      expect(res.tier1.selectedSize).toBe(200)
      expect(res.tier2.isApplicable).toBe(false)
    })

    it('should calculate rack size with other width (weak cables required width)', () => {
      // strong: d=10 (n=5) -> sum = (10+10)*5 = 100 -> W = 100 * 1.2 + 60 = 180
      // otherWidth (weak required): 150
      // total W = 180 + 150 = 330
      // optimal = 400
      const res = calculateRackSize(
        {
          mode: 'strong',
          rackHeight: 100,
          maxDepth: 80,
          cables: [{ d: 10, n: 5 }],
          otherWidth: 150,
        },
        standardRackSizes,
      )

      expect(res.tier1.wMain).toBe(180)
      expect(res.tier1.wOther).toBe(150)
      expect(res.tier1.totalWidth).toBe(330)
      expect(res.tier1.selectedSize).toBe(400)
    })

    it('should apply custom marginRate, cableSpacing and sideMargin', () => {
      // custom: marginRate=1.0, cableSpacing=0, sideMargin=40
      // cable: d=30 (n=2) -> sum = 30*2 = 60
      // wMain = 60 * 1.0 + 40 = 100
      const res = calculateRackSize(
        {
          mode: 'strong',
          rackHeight: 100,
          maxDepth: 80,
          cables: [{ d: 30, n: 2 }],
          otherWidth: 0,
          marginRate: 1.0,
          cableSpacing: 0,
          sideMargin: 40,
        },
        standardRackSizes,
      )

      expect(res.tier1.wMain).toBe(100)
      expect(res.tier1.selectedSize).toBe(100)
    })

    it('should detect height overflow when stack height exceeds maxDepth', () => {
      // maxDepth = 40, tier2 stackHeight = 30 + 30 = 60 -> overflow
      const res = calculateRackSize(
        {
          mode: 'strong',
          rackHeight: 60,
          maxDepth: 40,
          cables: [{ d: 30, n: 2 }],
          otherWidth: 0,
        },
        standardRackSizes,
      )

      expect(res.tier1.isOverflow).toBe(false) // 30 <= 40
      expect(res.tier2.isOverflow).toBe(true) // 60 > 40
    })
  })
})
