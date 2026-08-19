import { describe, it, expect } from 'vitest';
import { calculateWeightAndDrum } from '~/utils/calc/weight/weightCalcLogic';
import type { WeightCalcInputs } from '~/utils/calc/weight/weightCalcLogic';
import type { CableData, DrumData } from '~/types/database';

describe('weightCalcLogic', () => {

  describe('calculateWeightAndDrum', () => {
    const mockCableData: CableData[] = [
      { category: 'CV', diameter: '10', weight: '150', size: '14', unit: 'sq', cores: '3C' },
    ];

    const mockDrumData: DrumData[] = [
      { id: '1号', category: '1', flange_diameter: 1000, barrel_diameter: 500, inner_width: 500, max_winding_weight: 500, weight: 50 },
      { id: '2号', category: '2', flange_diameter: 1200, barrel_diameter: 600, inner_width: 600, max_winding_weight: 1000, weight: 80 },
    ];

    it('should throw error if inputs are incomplete', () => {
      const inputs: WeightCalcInputs = {
        category: '',
        cableIdx: '',
        L_input: null,
        K: null
      };
      expect(() => calculateWeightAndDrum(inputs, mockCableData, mockDrumData)).toThrow('Invalid inputs');
    });

    it('should calculate weight correctly', () => {
      const inputs: WeightCalcInputs = {
        category: 'CV',
        cableIdx: 'idx_0', // mock index
        L_input: 100,      // 100m
        K: 0.9
      };
      
      const res = calculateWeightAndDrum(inputs, mockCableData, mockDrumData);
      
      // Weight per km = 150 kg/km
      // Length = 100m -> 0.1km
      // Weight = 150 * 0.1 = 15 kg
      expect(res.error).toBe(false);
      expect(res.cableWeight).toBeCloseTo(15, 2);
    });

    it('should return drum_not_found if weight exceeds all drums', () => {
      const inputs: WeightCalcInputs = {
        category: 'CV',
        cableIdx: 'idx_0',
        L_input: 10000, // 10km -> 1500 kg
        K: 0.9
      };
      
      // max_winding_weight in mock is 1000, so it will fail
      const res = calculateWeightAndDrum(inputs, mockCableData, mockDrumData);
      expect(res.error).toBe(true);
      expect(res.reason).toBe('drum_not_found');
      expect(res.cableWeight).toBeCloseTo(1500, 2);
    });
  });
});
