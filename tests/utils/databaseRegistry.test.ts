import { describe, expect, it } from 'vitest'

import { DATABASE_REGISTRY } from '../../app/constants/databaseRegistry'

describe('databaseRegistry & Database Configuration', () => {
  const expectedKeys = ['cable-db', 'conduit-db', 'drum-db', 'rack-db', 'torque-db', 'terminal-db']

  it('contains all standard database definitions', () => {
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

  it('correctly formats terminal data columns', () => {
    const terminalConfig = DATABASE_REGISTRY['terminal-db']
    const sampleRow = {
      category: '5.5 mm²',
      name: 'R 5.5-5',
      stud: 'M5',
      holeDia: 5.3,
      widthB: 9.5,
      lengthL: 19.8,
      innerDiaD1: 3.4,
      wireRangeStranded: '2.63 ~ 6.64',
      wireRangeSolid: '1.82 ~ 2.89',
      wireRangeAWG: '12-10',
      stripLength: 8.5,
      tool: 'NH 1',
      standard: 'JIS C 2805',
    }

    const holeCol = terminalConfig.columns.find(c => c.key === 'holeDia')
    const widthCol = terminalConfig.columns.find(c => c.key === 'widthB')
    const lengthCol = terminalConfig.columns.find(c => c.key === 'lengthL')
    const innerCol = terminalConfig.columns.find(c => c.key === 'innerDiaD1')
    const wireCol = terminalConfig.columns.find(c => c.key === 'wireRangeStranded')

    expect(holeCol?.format?.(sampleRow.holeDia, sampleRow)).toBe('5.3 mm')
    expect(widthCol?.format?.(sampleRow.widthB, sampleRow)).toBe('9.5 mm')
    expect(lengthCol?.format?.(sampleRow.lengthL, sampleRow)).toBe('19.8 mm')
    expect(innerCol?.format?.(sampleRow.innerDiaD1, sampleRow)).toBe('3.4 mm')
    expect(wireCol?.format?.(sampleRow.wireRangeStranded, sampleRow)).toBe('2.63 ~ 6.64 mm² (単線 Φ1.82 ~ 2.89)')
    expect(terminalConfig.columns.find(c => c.key === 'stripLength')).toBeUndefined()
    expect(terminalConfig.columns.find(c => c.key === 'tool')).toBeUndefined()
  })
})
