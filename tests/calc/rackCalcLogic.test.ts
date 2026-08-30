import { describe, it, expect } from "vitest";
import { calculateRackSize } from "~/utils/tools/rack/rackCalcLogic";

describe('rackCalcLogic', () => {
  describe('calculateRackSize', () => {
    const standardRackSizes = [100, 200, 300, 400, 500, 600, 800, 1000, 1200];

    it('should calculate rack size for strong cables only', () => {
      // settings: strong only, L=1
      // strongCables: d=20 (n=2), d=30 (n=1) -> totalW = 20*2 + 30*1 = 70
      // rack size = ceil(70/100)*100 = 100
      const res = calculateRackSize(
        { isStrong: true, isWeak: false, lStrong: 1, lWeak: null, rackHeight: null, maxDepth: 100, separatorWidth: null, strongCables: [{ d: 20, n: 2 }, { d: 30, n: 1 }], weakCables: [] },
        standardRackSizes
      );
      
      expect(res.error).toBe(false);
      expect(res.wStrong).toBe(192);
      expect(res.selectedSize).toBe(200);
      expect(res.isOverflow).toBe(false);
    });

    it('should account for multi-layer stacking (L > 1)', () => {
      // settings: strong only, L=2
      // strongCables: d=20 (n=3) -> totalW = 60 / 2 = 30
      const res = calculateRackSize(
        { isStrong: true, isWeak: false, lStrong: 2, lWeak: null, rackHeight: null, separatorWidth: null, strongCables: [{ d: 20, n: 3 }], weakCables: [] },
        standardRackSizes
      );
      
      expect(res.wStrong).toBe(90);
      expect(res.selectedSize).toBe(100);
    });

    it('should calculate rack size for mixed strong and weak cables with separator', () => {
      // settings: strong & weak, separator = 50
      // strong: d=10 (n=5) -> W = 50 (L=1)
      // weak: d=5 (n=10) -> W = 50 (L=1)
      // total W = 50 + 50 + 50(separator) = 150
      // optimal = 200
      const res = calculateRackSize(
        { isStrong: true, isWeak: true, lStrong: 1, lWeak: 1, rackHeight: null, separatorWidth: 50, strongCables: [{ d: 10, n: 5 }], weakCables: [{ d: 5, n: 10 }] },
        standardRackSizes
      );
      
      expect(res.error).toBe(false);
      expect(res.wStrong).toBe(192);
      expect(res.wWeak).toBe(162);
      expect(res.totalWidth).toBe(404);
      expect(res.selectedSize).toBe(500);
    });

    it('should return error if inputs are invalid', () => {
      // missing standard sizes array
      const res = calculateRackSize(
        { isStrong: true, isWeak: false, lStrong: 1, lWeak: null, rackHeight: null, separatorWidth: null, strongCables: [{ d: 20, n: 2 }], weakCables: [] },
        []
      );
      expect(res.error).toBe(true);
    });

    it('should return SIZE_OVER if calculated size exceeds max standard size', () => {
      // totalW = 1500, max size = 1200
      const res = calculateRackSize(
        { isStrong: true, isWeak: false, lStrong: 1, lWeak: null, rackHeight: null, separatorWidth: null, strongCables: [{ d: 100, n: 15 }], weakCables: [] },
        standardRackSizes
      );
      expect(res.error).toBe(true);
      expect(res.selectedSize).toBeNull();
      expect(res.totalWidth).toBe(2052);
    });
  });
});
