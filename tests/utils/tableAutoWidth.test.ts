import { describe, expect, it } from 'vitest'

import type { TableColumn } from '../../app/types/components'
import {
  calculateColumnBaseWidths,
  distributeColumnWidths,
  getDisplayWidth,
  parsePixelWidth,
} from '../../app/utils/tableAutoWidth'

describe('tableAutoWidth utility', () => {
  describe('getDisplayWidth', () => {
    it('calculates ascii characters as 1 width', () => {
      expect(getDisplayWidth('abc123')).toBe(6)
      expect(getDisplayWidth('HL-102')).toBe(6)
      expect(getDisplayWidth('')).toBe(0)
      expect(getDisplayWidth(null)).toBe(0)
      expect(getDisplayWidth(undefined)).toBe(0)
    })

    it('calculates full-width japanese characters as 2 width', () => {
      expect(getDisplayWidth('電灯')).toBe(4)
      expect(getDisplayWidth('盤A-回路1')).toBe(9) // 盤(2) + A(1) + -(1) + 回路(4) + 1(1) = 9
    })

    it('returns the maximum width among lines for multiline text (newlines)', () => {
      // 1行目: "1F 事務室" (9width), 2行目: "コンセント回路" (14width) ➔ 最大の 14 を返す
      expect(getDisplayWidth('1F 事務室\nコンセント回路')).toBe(14)
      expect(getDisplayWidth('短\r\n長い行です')).toBe(10)
    })
  })

  describe('parsePixelWidth', () => {
    it('parses px string to number', () => {
      expect(parsePixelWidth('120px')).toBe(120)
      expect(parsePixelWidth('95.5px')).toBe(95.5)
      expect(parsePixelWidth(150)).toBe(150)
      expect(parsePixelWidth(undefined)).toBeUndefined()
      expect(parsePixelWidth('100%')).toBeUndefined()
    })
  })

  describe('calculateColumnBaseWidths', () => {
    const columns: TableColumn<unknown>[] = [
      { key: 'ban', label: '盤情報', sortable: true },
      { key: 'circuit', label: '回路名称' },
      { key: 'action', label: '操作', width: '100px' }, // 明示的固定列
    ]

    const data = [
      { ban: 'A盤', circuit: '非常用照明回路' },
      { ban: 'メイン配電盤', circuit: 'コンセント' },
    ]

    it('calculates base widths from max text length', () => {
      const widths = calculateColumnBaseWidths(columns, data)

      // 操作列は固定100px
      expect(widths.action).toBe(100)

      // ban: メイン配電盤 (12幅)
      expect(widths.ban).toBeGreaterThan(60)

      // circuit: 非常用照明回路 (14幅)
      expect(widths.circuit).toBeGreaterThan(widths.ban)
    })

    it('preserves existing max cache and does not shrink on filtered smaller data', () => {
      const initialWidths = calculateColumnBaseWidths(columns, data)

      // フィルターにより短い1件のみになった場合
      const filteredData = [
        { ban: 'A', circuit: '短' },
      ]

      const nextWidths = calculateColumnBaseWidths(columns, filteredData, initialWidths)

      // 縮まないことを検証
      expect(nextWidths.ban).toBe(initialWidths.ban)
      expect(nextWidths.circuit).toBe(initialWidths.circuit)
      expect(nextWidths.action).toBe(100)
    })
  })

  describe('distributeColumnWidths', () => {
    const columns: TableColumn<unknown>[] = [
      { key: 'c1', label: 'C1' },
      { key: 'c2', label: 'C2' },
      { key: 'fixed', label: 'Fixed', width: '100px' },
    ]

    const baseWidths = {
      c1: 100,
      c2: 200,
      fixed: 100,
    }
    // 合計BaseWidth: 400px

    it('distributes extra width equally to flex columns when container is wider', () => {
      // コンテナ幅 600px ➔ 余剰 200px ➔ c1, c2 に各 100px 追加
      const distributed = distributeColumnWidths(columns, baseWidths, 600)

      expect(distributed.fixed).toBe(100) // 固定列はそのまま
      expect(distributed.c1).toBe(200) // 100 + 100
      expect(distributed.c2).toBe(300) // 200 + 100

      // 合計がコンテナ幅に完全一致
      const sum = distributed.c1 + distributed.c2 + distributed.fixed

      expect(sum).toBe(600)
    })

    it('respects maxWidth on flex columns and cascades remaining extra to uncapped columns', () => {
      const colsWithMax: TableColumn<unknown>[] = [
        { key: 'c1', label: '上限あり列', maxWidth: '150px' },
        { key: 'c2', label: '上限なし列' },
        { key: 'fixed', label: '固定列', width: '100px' },
      ]

      // コンテナ幅 600px ➔ 余剰 200px
      // c1 は base 100 ➔ maxWidth 150 のため +50 で頭打ち！
      // 残りの余剰 +150 はすべて c2（上限なし）に配分され、c2 は 200 + 150 = 350
      const distributed = distributeColumnWidths(colsWithMax, baseWidths, 600)

      expect(distributed.fixed).toBe(100)
      expect(distributed.c1).toBe(150) // maxWidth 150 を超えない！
      expect(distributed.c2).toBe(350) // 残りの余剰をすべて吸収

      const sum = distributed.c1 + distributed.c2 + distributed.fixed

      expect(sum).toBe(600)
    })

    it('preserves base widths when container is narrower without forced compression', () => {
      // コンテナ幅 300px が totalBaseWidth (400px) より狭い場合、文字潰れを防ぐためベース幅を維持
      const distributed = distributeColumnWidths(columns, baseWidths, 300)

      expect(distributed.fixed).toBe(100)
      expect(distributed.c1).toBe(100)
      expect(distributed.c2).toBe(200)
    })
  })
})
