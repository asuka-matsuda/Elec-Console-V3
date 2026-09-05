import { describe, expect, it } from 'vitest'

import {
  findCableByIndexString,
  formatCableName,
  getAvailableSizes,
  getCableCategories,
  getCableDisplayName,
  getEffectiveCableDiameter,
  parseCableIndex,
} from '~/utils/cable'

describe('cable utilities', () => {
  describe('getCableCategories & getAvailableSizes', () => {
    it('should return unique categories', () => {
      const categories = getCableCategories()

      expect(categories.length).toBeGreaterThan(0)
      expect(categories[0]).toHaveProperty('label')
      expect(categories[0]).toHaveProperty('value')
    })

    it('should return available sizes with idx_ prefixes', () => {
      const sizes = getAvailableSizes('CVT')

      expect(sizes.length).toBeGreaterThan(0)
      expect(sizes[0]?.value).toMatch(/^idx_\d+$/)
    })

    it('should return empty array for empty category', () => {
      expect(getAvailableSizes('')).toEqual([])
    })
  })

  describe('parseCableIndex', () => {
    it('should correctly parse idx_ string', () => {
      expect(parseCableIndex('idx_0')).toBe(0)
      expect(parseCableIndex('idx_42')).toBe(42)
    })

    it('should return null for invalid inputs', () => {
      expect(parseCableIndex(null)).toBeNull()
      expect(parseCableIndex(undefined)).toBeNull()
      expect(parseCableIndex('')).toBeNull()
      expect(parseCableIndex('invalid_12')).toBeNull()
      expect(parseCableIndex('idx_abc')).toBeNull()
    })
  })

  describe('findCableByIndexString', () => {
    it('should find cable by valid idx_ string', () => {
      const cable = findCableByIndexString('idx_0')

      expect(cable).not.toBeNull()
      expect(cable).toHaveProperty('category')
      expect(cable).toHaveProperty('diameter')
    })

    it('should return null for out-of-range index', () => {
      expect(findCableByIndexString('idx_999999')).toBeNull()
      expect(findCableByIndexString('idx_-1')).toBeNull()
    })
  })

  describe('getEffectiveCableDiameter', () => {
    it('should parse single number or numeric string', () => {
      expect(getEffectiveCableDiameter(15.5)).toBe(15.5)
      expect(getEffectiveCableDiameter('15.5')).toBe(15.5)
      expect(getEffectiveCableDiameter('  12  ')).toBe(12)
    })

    it('should parse flat cable dimensions (e.g. 6.2×9.4) and return max dimension', () => {
      expect(getEffectiveCableDiameter('6.2×9.4')).toBe(9.4)
      expect(getEffectiveCableDiameter('9.4×6.2')).toBe(9.4)
      expect(getEffectiveCableDiameter(' 5.0 × 10.5 ')).toBe(10.5)
    })

    it('should return 0 for empty or invalid inputs', () => {
      expect(getEffectiveCableDiameter(null)).toBe(0)
      expect(getEffectiveCableDiameter(undefined)).toBe(0)
      expect(getEffectiveCableDiameter('')).toBe(0)
      expect(getEffectiveCableDiameter('abc')).toBe(0)
      expect(getEffectiveCableDiameter(-5)).toBe(0)
    })
  })

  describe('formatCableName & getCableDisplayName', () => {
    it('should format cable name with size and cores', () => {
      expect(formatCableName({ category: 'CVT', size: '22', cores: '3' })).toBe('CVT 22 3C')
      expect(formatCableName({ category: 'IV', size: '2.0', cores: '1' })).toBe('IV 2.0')
      expect(formatCableName({ category: 'VVF', size: '1.6', cores: '2C' })).toBe('VVF 1.6 2C')
    })

    it('should use fallback when cableDef is missing in getCableDisplayName', () => {
      expect(getCableDisplayName(null, { category: 'CV', size: '14', cores: '3' })).toBe('CV 14')
      expect(getCableDisplayName(null, { category: 'CV', size: '14', cores: '3' }, true, true)).toBe('CV 14 3C')
    })
  })
})
