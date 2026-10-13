import { describe, expect, it } from 'vitest'

import {
  cellValueToString,
  detectHeaderRowIndex,
  findPreferredWorksheet,
  type MinimalWorksheet,
  normalizeHeaderName,
} from '#shared/utils/excelNormalize'
import { extractRemoteCircuitsFromWorksheet } from '#shared/utils/remoteCircuits'

describe('excelNormalize utils', () => {
  it('normalizeHeaderName should normalize NFKC, remove whitespace and lowercase', () => {
    expect(normalizeHeaderName(' 盤 名 称 ')).toBe('盤名称')
    expect(normalizeHeaderName('回路_番号\n')).toBe('回路番号')
    expect(normalizeHeaderName('Ｐｈａｓｅ 1')).toBe('phase1')
    expect(normalizeHeaderName(null)).toBe('')
    expect(normalizeHeaderName(undefined)).toBe('')
  })

  it('cellValueToString should handle primitives, richText, text, and dates', () => {
    expect(cellValueToString(123)).toBe('123')
    expect(cellValueToString('abc')).toBe('abc')
    expect(cellValueToString(null)).toBe('')
    expect(cellValueToString(undefined)).toBe('')
    expect(cellValueToString(new Date(2026, 7, 31))).toBe('2026/08/31')
    expect(cellValueToString({ text: 'sample' })).toBe('sample')
    expect(cellValueToString({ richText: [{ text: 'Hello ' }, { text: 'World' }] })).toBe('Hello World')
    expect(cellValueToString({ result: 456 })).toBe('456')
  })

  it('findPreferredWorksheet should match preferred patterns or fallback to first', () => {
    const ws1 = { name: '表紙' } as MinimalWorksheet
    const ws2 = { name: '回路リスト' } as MinimalWorksheet
    const ws3 = { name: '備考' } as MinimalWorksheet

    const wb = { worksheets: [ws1, ws2, ws3] }

    expect(findPreferredWorksheet(wb)).toBe(ws2)

    const wbNoMatch = { worksheets: [ws1, ws3] }

    expect(findPreferredWorksheet(wbNoMatch)).toBe(ws1)
  })

  it('detectHeaderRowIndex should score matching keywords and return highest scoring row', () => {
    const mockSheet: MinimalWorksheet = {
      name: '回路',
      rowCount: 3,
      getRow: (r: number) => {
        if (r === 1) {
          return {
            eachCell: (_opts, cb) => {
              cb({ value: '電気設備設計書' }, 1)
              cb({ value: '日付: 2026/10/01' }, 2)
            },
            getCell: () => ({ value: '' }),
          }
        }
        if (r === 2) {
          return {
            eachCell: (_opts, cb) => {
              cb({ value: '盤名称' }, 1)
              cb({ value: '回路番号' }, 2)
              cb({ value: '回路名称' }, 3)
              cb({ value: '負荷アドレス' }, 4)
            },
            getCell: () => ({ value: '' }),
          }
        }

        return {
          eachCell: (_opts, cb) => {
            cb({ value: '1L-1' }, 1)
            cb({ value: '1' }, 2)
          },
          getCell: () => ({ value: '' }),
        }
      },
    }

    const keywords = ['盤名称', '回路番号', '回路名称', '負荷アドレス']
    const headerRow = detectHeaderRowIndex(mockSheet, keywords)

    expect(headerRow).toBe(2)
  })

  it('extractRemoteCircuitsFromWorksheet should extract slots with default empty filling', () => {
    const mockSheet: MinimalWorksheet = {
      name: '回路台帳',
      rowCount: 3,
      getRow: (r: number) => {
        if (r === 1) {
          return {
            eachCell: (_opts, cb) => {
              cb({ value: '伝送系統' }, 1)
              cb({ value: '盤名称' }, 2)
              cb({ value: '回路記号' }, 3)
              cb({ value: '回路番号' }, 4)
              cb({ value: '回路名称' }, 5)
              cb({ value: '負荷アドレス' }, 6)
              cb({ value: 'リレー番号' }, 7)
            },
            getCell: () => ({ value: '' }),
          }
        }

        return {
          eachCell: () => {},
          getCell: (col: number) => {
            const vals: Record<number, unknown> = {
              1: '1',
              2: '1L-1',
              3: '○',
              4: '1',
              5: '事務室電灯',
              6: '1-1',
              7: 'R1',
            }

            return { value: vals[col] ?? '' }
          },
        }
      },
      eachRow: (_opts, cb) => {
        const row = mockSheet.getRow(2)

        cb(row, 2)
      },
    }

    const circuits = extractRemoteCircuitsFromWorksheet(mockSheet, 'test-site')

    expect(circuits).toHaveLength(256)

    const c11 = circuits.find(c => c.fukaAddress === '1-1')!

    expect(c11.isVacant).toBe(false)
    expect(c11.siteId).toBe('test-site')
    expect(c11.banMeisho).toBe('1L-1')
    expect(c11.kairoMeisho).toBe('事務室電灯')
    expect(c11.relayNumber).toBe('R1')

    const c01 = circuits.find(c => c.fukaAddress === '0-1')!

    expect(c01.isVacant).toBe(true)
    expect(c01.kairoMeisho).toBe('空き')
  })
})
