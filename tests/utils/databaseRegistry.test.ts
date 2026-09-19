import { describe, expect, it } from 'vitest'

import { DATABASE_REGISTRY } from '../../app/constants/databaseRegistry'

describe('databaseRegistry & Database Configuration', () => {
  const expectedKeys = ['cable-db', 'conduit-db', 'drum-db', 'rack-db', 'torque-db']

  it('contains all 5 standard database definitions', () => {
    expect(Object.keys(DATABASE_REGISTRY)).toEqual(expectedKeys)
  })

  it.each(expectedKeys)('validates structure for database: %s', (key) => {
    const config = DATABASE_REGISTRY[key]

    expect(config).toBeDefined()
    expect(config.title).toBeTruthy()
    expect(Array.isArray(config.data)).toBe(true)
    expect(config.data.length).toBeGreaterThan(0)
    expect(Array.isArray(config.columns)).toBe(true)
    expect(config.columns.length).toBeGreaterThan(0)
    expect(typeof config.searchMapper).toBe('function')
    expect(typeof config.placeholder).toBe('string')
  })

  it('correctly formats cable data columns', () => {
    const cableConfig = DATABASE_REGISTRY['cable-db']
    const sampleRow = {
      name: 'CVT 22',
      category: 'CVT',
      ampacity: 115,
      diameter: 24.0,
      weight: 980,
      voltage: 600,
      baseTemp: 30,
      maxTemp: 90,
      standard: 'JIS C 3605',
    }

    const weightCol = cableConfig.columns.find(c => c.key === 'weight')
    const voltageCol = cableConfig.columns.find(c => c.key === 'voltage')
    const tempCol = cableConfig.columns.find(c => c.key === 'baseTemp')

    expect(weightCol?.format?.(sampleRow.weight, sampleRow)).toBe(0.98)
    expect(voltageCol?.format?.(sampleRow.voltage, sampleRow)).toBe('600 V')
    expect(tempCol?.format?.(sampleRow.baseTemp, sampleRow)).toBe('30℃ / 90℃')
  })
})
