import { describe, expect, it } from 'vitest'

import {
  parseCustomHolidays,
  parseEventTypes,
  parseExcludedCircuits,
  parseHolidayDays,
  parseNoBreakWords,
  serializeCustomHolidays,
  serializeEventTypes,
  serializeExcludedCircuits,
  serializeHolidayDays,
  serializeNoBreakWords,
} from '../../server/utils/jsonFields'

describe('jsonFields - excludedCircuits', () => {
  it('正常な JSON 配列文字列を正しくパースできること', () => {
    const raw = JSON.stringify(['予備', 'スペース', '空き'])

    expect(parseExcludedCircuits(raw)).toEqual(['予備', 'スペース', '空き'])
  })

  it('前後の不要な空白をトリムし、空文字要素を除外すること', () => {
    const raw = JSON.stringify([' 予備 ', '', '  ', 'スペース'])

    expect(parseExcludedCircuits(raw)).toEqual(['予備', 'スペース'])
  })

  it('カンマ区切り文字列でも安全にフォールバックパースできること', () => {
    expect(parseExcludedCircuits('予備, スペース, 空き')).toEqual(['予備', 'スペース', '空き'])
  })

  it('破損データや null/undefined の場合は空配列を返すこと（例外を投げない）', () => {
    expect(parseExcludedCircuits(null)).toEqual([])
    expect(parseExcludedCircuits(undefined)).toEqual([])
    expect(parseExcludedCircuits('')).toEqual([])
    expect(parseExcludedCircuits('{ broken json')).toEqual(['{ broken json'])
  })

  it('配列を正しく JSON 文字列にシリアライズできること', () => {
    expect(serializeExcludedCircuits(['予備', 'スペース'])).toBe(JSON.stringify(['予備', 'スペース']))
    expect(serializeExcludedCircuits('予備')).toBe(JSON.stringify(['予備']))
    expect(serializeExcludedCircuits([])).toBeNull()
    expect(serializeExcludedCircuits(null)).toBeNull()
    expect(serializeExcludedCircuits(undefined)).toBeNull()
  })
})

describe('jsonFields - eventTypes', () => {
  it('正常なイベント種別をパースできること', () => {
    const types = [
      { id: 't1', label: '送電試験', color: '#ff0000' },
      { id: 't2', label: '会議', color: '#00ff00' },
    ]
    const raw = JSON.stringify(types)

    expect(parseEventTypes(raw)).toEqual(types)
  })

  it('破損 JSON の場合は空配列へフォールバックすること', () => {
    expect(parseEventTypes('broken')).toEqual([])
    expect(parseEventTypes(null)).toEqual([])
  })

  it('シリアライズが正しく動作すること', () => {
    expect(serializeEventTypes([{ id: 't1', label: '試験', color: '#fff' }])).toBe(
      JSON.stringify([{ id: 't1', label: '試験', color: '#fff' }]),
    )
    expect(serializeEventTypes(null)).toBe('[]')
  })
})

describe('jsonFields - holidayDays', () => {
  it('休業曜日をパースできること', () => {
    expect(parseHolidayDays(JSON.stringify([0, 6]))).toEqual([0, 6])
    expect(parseHolidayDays(JSON.stringify([1, 2, 3]))).toEqual([1, 2, 3])
  })

  it('破損時はデフォルトの土日 [0, 6] を返すこと', () => {
    expect(parseHolidayDays(null)).toEqual([0, 6])
    expect(parseHolidayDays('invalid')).toEqual([0, 6])
  })

  it('シリアライズ時に 0〜6 以外の不正値をフィルタすること', () => {
    expect(serializeHolidayDays([0, 6, 99, -1])).toBe(JSON.stringify([0, 6]))
    expect(serializeHolidayDays(null)).toBe('[0, 6]')
  })
})

describe('jsonFields - customHolidays', () => {
  it('カスタム休日リストをパースできること', () => {
    const dates = ['2026-05-03', '2026-05-04', '2026-05-05']

    expect(parseCustomHolidays(JSON.stringify(dates))).toEqual(dates)
    expect(parseCustomHolidays(null)).toEqual([])
    expect(parseCustomHolidays('invalid')).toEqual([])
  })

  it('シリアライズが正しく動作すること', () => {
    expect(serializeCustomHolidays(['2026-01-01'])).toBe(JSON.stringify(['2026-01-01']))
    expect(serializeCustomHolidays(null)).toBe('[]')
  })
})

describe('jsonFields - noBreakWords', () => {
  it('正常な JSON 配列文字列を正しくパースできること', () => {
    const raw = JSON.stringify(['自動倉庫', '受変電設備', '分電盤'])

    expect(parseNoBreakWords(raw)).toEqual(['自動倉庫', '受変電設備', '分電盤'])
  })

  it('前後の不要な空白をトリムし、空文字要素を除外すること', () => {
    const raw = JSON.stringify([' 自動倉庫 ', '', '  ', '受変電設備'])

    expect(parseNoBreakWords(raw)).toEqual(['自動倉庫', '受変電設備'])
  })

  it('カンマ区切り文字列でも安全にフォールバックパースできること', () => {
    expect(parseNoBreakWords('自動倉庫, 受変電設備')).toEqual(['自動倉庫', '受変電設備'])
  })

  it('破損データや null/undefined の場合は空配列を返すこと', () => {
    expect(parseNoBreakWords(null)).toEqual([])
    expect(parseNoBreakWords(undefined)).toEqual([])
    expect(parseNoBreakWords('')).toEqual([])
  })

  it('配列または文字列を正しく JSON 文字列にシリアライズできること', () => {
    expect(serializeNoBreakWords(['自動倉庫', '受変電設備'])).toBe(
      JSON.stringify(['自動倉庫', '受変電設備']),
    )
    expect(serializeNoBreakWords('自動倉庫, 受変電設備')).toBe(
      JSON.stringify(['自動倉庫', '受変電設備']),
    )
    expect(serializeNoBreakWords([])).toBeNull()
    expect(serializeNoBreakWords(null)).toBeNull()
    expect(serializeNoBreakWords(undefined)).toBeNull()
  })
})
