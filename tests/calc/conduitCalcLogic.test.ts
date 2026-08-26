import { describe, it, expect } from 'vitest';
import { calculateCableArea, calculateConduitSize } from '~/utils/calc/conduit/conduitCalcLogic';
import type { CableInput } from '~/utils/calc/conduit/conduitCalcLogic';

describe('conduitCalcLogic', () => {
  describe('calculateCableArea', () => {
    it('should calculate area for a simple circular cable', () => {
      // diameter = 10 -> r = 5 -> area = 25 * PI ≈ 78.5398
      const area = calculateCableArea('10');
      expect(area).toBeCloseTo(78.5398, 4);
    });

    it('should calculate area for flat cable (e.g. VVF) using max diameter', () => {
      // VVF 6.2x9.4 -> uses max which is 9.4 -> r = 4.7 -> area = 22.09 * PI ≈ 69.39778
      const area = calculateCableArea('6.2×9.4');
      expect(area).toBeCloseTo(69.3978, 4);
    });

    it('should return 0 for invalid inputs', () => {
      expect(calculateCableArea('')).toBe(0);
      expect(calculateCableArea('abc')).toBe(0);
      expect(calculateCableArea('-5')).toBe(0);
    });
  });

  describe('calculateConduitSize', () => {
    // Mock Data
    const mockCableData: unknown[] = [
      { diameter: '10', size: 10 },    // idx_0: area = 78.54
      { diameter: '20', size: 20 },    // idx_1: area = 314.16
    ];

    const mockConduitData: unknown[] = [
      { category: 'PF', size: '16', innerDiameter: 16.4, area: 211.2, area32: 67.6, area48: 101.4 },
      { category: 'PF', size: '22', innerDiameter: 21.9, area: 376.7, area32: 120.5, area48: 180.8 },
      { category: 'PF', size: '28', innerDiameter: 27.8, area: 607.0, area32: 194.2, area48: 291.4 },
    ];

    it('should handle zero cables or missing inputs', () => {
      const result = calculateConduitSize('PF', [], mockConduitData, mockCableData);
      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_INPUT');

      const inputs: CableInput[] = [{ id: '1', category: 'any', cableIdx: 'idx_0', count: 0 }];
      const res2 = calculateConduitSize('PF', inputs, mockConduitData, mockCableData);
      expect(res2.success).toBe(false);
      expect(res2.error).toBe('ZERO_CABLES');
    });

    it('should handle conduit category not found', () => {
      const inputs: CableInput[] = [{ id: '1', category: 'any', cableIdx: 'idx_0', count: 1 }];
      const result = calculateConduitSize('VE', inputs, mockConduitData, mockCableData);
      expect(result.success).toBe(false);
      expect(result.error).toBe('CONDUIT_NOT_FOUND');
    });

    it('should pick correct conduit based on area32 and area48', () => {
      // 1 cable of 10mm -> area = 78.5398
      // area32 <= 120.5 (PF22)
      // area48 <= 101.4 (PF16)
      const inputs: CableInput[] = [{ id: '1', category: 'any', cableIdx: 'idx_0', count: 1 }];
      const result = calculateConduitSize('PF', inputs, mockConduitData, mockCableData);

      expect(result.success).toBe(true);
      expect(result.totalArea).toBeCloseTo(78.5398, 4);

      expect(result.conduit32?.size).toBe('22');
      expect(result.isOversize32).toBe(false);

      expect(result.conduit48?.size).toBe('16');
      expect(result.isOversize48).toBe(false);
    });

    it('should flag as oversize if required area exceeds max conduit', () => {
      // 3 cables of 20mm -> 3 * 314.16 = 942.48
      // Max PF is PF28 (area32 = 194.2, area48 = 291.4) -> Over
      const inputs: CableInput[] = [{ id: '1', category: 'any', cableIdx: 'idx_1', count: 3 }];
      const result = calculateConduitSize('PF', inputs, mockConduitData, mockCableData);

      expect(result.success).toBe(true);
      expect(result.conduit32?.size).toBe('28'); // Picks the largest available
      expect(result.isOversize32).toBe(true);
      
      expect(result.conduit48?.size).toBe('28');
      expect(result.isOversize48).toBe(true);
    });
  });
});
