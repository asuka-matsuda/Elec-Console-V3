import { describe, expect, it } from 'vitest'

import {
  collectAvailableKanaRows,
  filterByKana,
  getKanaRow,
  sortByKana,
} from '../../app/utils/kana'

describe('kana utility', () => {
  describe('getKanaRow', () => {
    it('should identify vowels row (a)', () => {
      expect(getKanaRow('あんぺあ')).toBe('a')
      expect(getKanaRow('インピーダンス')).toBe('a')
      expect(getKanaRow('ウル')).toBe('a')
      expect(getKanaRow('エネルギー')).toBe('a')
      expect(getKanaRow('オーム')).toBe('a')
    })

    it('should identify k row including voiced consonants', () => {
      expect(getKanaRow('かいろ')).toBe('k')
      expect(getKanaRow('ケーブル')).toBe('k')
      expect(getKanaRow('がわ')).toBe('k')
      expect(getKanaRow('グラウンド')).toBe('k')
    })

    it('should identify s, t, n rows', () => {
      expect(getKanaRow('遮断器')).toBe('other') // 漢字はother
      expect(getKanaRow('しゃだんき')).toBe('s')
      expect(getKanaRow('じゅうでん')).toBe('s')
      expect(getKanaRow('たいあつ')).toBe('t')
      expect(getKanaRow('でんあつ')).toBe('t')
      expect(getKanaRow('ないせん')).toBe('n')
    })

    it('should identify h row including semi-voiced consonants', () => {
      expect(getKanaRow('はいかん')).toBe('h')
      expect(getKanaRow('ブレーカー')).toBe('h')
      expect(getKanaRow('パワー')).toBe('h')
    })

    it('should identify m, y, r, w rows', () => {
      expect(getKanaRow('メガ')).toBe('m')
      expect(getKanaRow('ようりょう')).toBe('y')
      expect(getKanaRow('リレー')).toBe('r')
      expect(getKanaRow('ワット')).toBe('w')
    })

    it('should identify non-kana characters as other', () => {
      expect(getKanaRow('100V')).toBe('other')
      expect(getKanaRow('CVT')).toBe('other')
      expect(getKanaRow('')).toBe('other')
    })
  })

  describe('sortByKana', () => {
    it('should sort items by kana property in japanese alphabetical order', () => {
      const items = [
        { name: '配管', kana: 'はいかん' },
        { name: 'オーム', kana: 'おーむ' },
        { name: '回路', kana: 'かいろ' },
      ]
      const sorted = sortByKana(items, i => i.kana)

      expect(sorted.map(i => i.name)).toEqual(['オーム', '回路', '配管'])
    })
  })

  describe('filterByKana', () => {
    const items = [
      { name: 'オーム', kana: 'おーむ' },
      { name: '回路', kana: 'かいろ' },
      { name: '接地', kana: 'せっち' },
      { name: 'CVT', kana: 'CVT' },
    ]

    it('should return all items if activeRows is empty', () => {
      expect(filterByKana(items, [], i => i.kana)).toEqual(items)
    })

    it('should filter items by selected row', () => {
      const filtered = filterByKana(items, ['a', 'k'], i => i.kana)

      expect(filtered.map(i => i.name)).toEqual(['オーム', '回路'])
    })

    it('should include other items when w row is selected', () => {
      const filtered = filterByKana(items, ['w'], i => i.kana)

      expect(filtered.map(i => i.name)).toEqual(['CVT'])
    })
  })

  describe('collectAvailableKanaRows', () => {
    it('should collect unique kana rows from list', () => {
      const items = [
        { kana: 'おーむ' },
        { kana: 'あんぺあ' },
        { kana: 'かいろ' },
        { kana: 'CVT' },
      ]
      const rows = collectAvailableKanaRows(items, i => i.kana)

      expect(rows.has('a')).toBe(true)
      expect(rows.has('k')).toBe(true)
      expect(rows.has('other')).toBe(true)
      expect(rows.has('s')).toBe(false)
    })
  })
})
