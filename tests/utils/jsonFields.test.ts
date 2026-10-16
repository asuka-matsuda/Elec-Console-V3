import { describe, expect, it } from 'vitest'

import {
  parseAssignedReports,
  parseCustomHolidayLabels,
  parseCustomHolidays,
  parseEventTypes,
  parseExcludedCircuits,
  parseHolidayDays,
  serializeAssignedReports,
  serializeCustomHolidays,
  serializeEventTypes,
  serializeExcludedCircuits,
  serializeHolidayDays,
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

  it('破損データや null/undefined の場合は空配列を返すこと（破損JSON断片を混入させない）', () => {
    expect(parseExcludedCircuits(null)).toEqual([])
    expect(parseExcludedCircuits(undefined)).toEqual([])
    expect(parseExcludedCircuits('')).toEqual([])
    expect(parseExcludedCircuits('{ broken json')).toEqual([])
    expect(parseExcludedCircuits('[ broken array')).toEqual([])
  })

  it('配列を正しく JSON 文字列にシリアライズできること', () => {
    expect(serializeExcludedCircuits(['予備', 'スペース'])).toBe(JSON.stringify(['予備', 'スペース']))
    expect(serializeExcludedCircuits('予備')).toBe(JSON.stringify(['予備']))
    expect(serializeExcludedCircuits([])).toBeNull()
    expect(serializeExcludedCircuits(null)).toBeNull()
    expect(serializeExcludedCircuits(undefined)).toBeNull()
  })
})

describe('jsonFields - assignedReports', () => {
  it('空配列 [] をシリアライズした際に null ではなく "[]" として保持され、全帳票解除状態が復元できること', () => {
    const serializedEmpty = serializeAssignedReports([])

    expect(serializedEmpty).toBe('[]')
    expect(parseAssignedReports(serializedEmpty)).toEqual([])
    expect(parseAssignedReports(null)).toEqual(['tag', 'socket-tepra', 'exam', 'remote'])
  })
})

describe('jsonFields - eventTypes', () => {
  it('正常なイベント種別（name プロパティ）をパースできること', () => {
    const types = [
      { id: 't1', name: '送電試験', color: '#ff0000' },
      { id: 't2', name: '会議', color: '#00ff00' },
    ]
    const raw = JSON.stringify(types)

    expect(parseEventTypes(raw)).toEqual(types)
  })

  it('旧フォーマット（label / colorVar プロパティ）も name / color へ正規化してパースできること', () => {
    const legacy = [
      { id: 't1', label: '送電試験', colorVar: 'status-danger' },
      { id: 't2', label: '会議', color: '#00ff00' },
    ]
    const raw = JSON.stringify(legacy)

    expect(parseEventTypes(raw)).toEqual([
      { id: 't1', name: '送電試験', color: '#f85149' },
      { id: 't2', name: '会議', color: '#00ff00' },
    ])
  })

  it('破損 JSON の場合は空配列へフォールバックすること', () => {
    expect(parseEventTypes('broken')).toEqual([])
    expect(parseEventTypes(null)).toEqual([])
  })

  it('シリアライズが name 形式で正規化されて動作すること', () => {
    expect(serializeEventTypes([{ id: 't1', name: '試験', color: '#fff' }])).toBe(
      JSON.stringify([{ id: 't1', name: '試験', color: '#fff' }]),
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

  it('5文字以内の休日ラベル付きシリアライズ・パースが正しく動作すること', () => {
    const serialized = serializeCustomHolidays(
      ['2026-08-13', '2026-08-14'],
      { '2026-08-13': '夏季休暇です', '2026-08-14': 'GW' },
    )

    expect(parseCustomHolidays(serialized)).toEqual(['2026-08-13', '2026-08-14'])
    expect(parseCustomHolidayLabels(serialized)).toEqual({
      '2026-08-13': '夏季休暇で', // 5文字に切り詰め
      '2026-08-14': 'GW',
    })
  })
})
