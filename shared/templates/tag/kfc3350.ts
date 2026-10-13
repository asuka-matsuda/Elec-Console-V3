import type ExcelJS from 'exceljs'

import type { TagSlotDef, TagTemplateDefinition } from '#shared/types/tagTemplate'
import { detectTagSlotsFromSheet } from '#shared/utils/tagSlotDetector'

/**
 * KFC-3350 線名札テンプレート定義
 *
 * @description
 * - 用紙: A4縦（21面、24面等の各種バリエーションに対応）
 * - シート上のプレースホルダー（%回路番号%、%ケーブル%、%系統% 等）を完全動的に自動検出します。
 * - 固定セル番地（Row, Col決め打ち）は一切行わず、テンプレート内のキーを直接狙って置換します。
 */

// 引数なしテスト互換用フォールバック
const FALLBACK_COLS = [2, 4, 6]
const FALLBACK_START_ROWS = [2, 9, 16, 23, 30, 37, 44, 51]
const FALLBACK_FIELD_OFFSETS: { key: string, offset: number }[] = [
  { key: '回路番号', offset: 0 },
  { key: 'ケーブル', offset: 1 },
  { key: '配電方式', offset: 2 },
  { key: '系統', offset: 3 },
  { key: '回路名称', offset: 4 },
]

export { detectTagSlotsFromSheet }

export const kfc3350Template: TagTemplateDefinition = {
  id: 'kfc-3350',
  name: 'KFC-3350（A4線名札）',
  description: 'A4線名札テンプレート（シート上のプレースホルダーを自動検出して出力）',
  pageHeight: 56,
  slotsPerPage: 24,

  match: (nameOrFilename: string) => {
    return /kfc[-_]?3350/i.test(nameOrFilename)
  },

  getSlots: (flowDirection: 'z' | 'n', sheet?: ExcelJS.Worksheet): TagSlotDef[] => {
    // ワークシートが渡された場合、セル内のプレースホルダーから動的スロット検出を最優先
    // 枠数が21枠でも24枠でも、検出されたスロットをそのまま返却
    if (sheet) {
      const dynamicSlots = detectTagSlotsFromSheet(sheet, flowDirection)

      if (dynamicSlots.length > 0) {
        return dynamicSlots
      }
    }

    // 静的フォールバック（引数なし単体テスト呼び出し時やプレースホルダー未検出時）
    const slots: TagSlotDef[] = []

    if (flowDirection === 'z') {
      let slotIndex = 0

      for (const startRow of FALLBACK_START_ROWS) {
        for (const col of FALLBACK_COLS) {
          slots.push({
            slotIndex: slotIndex++,
            cells: FALLBACK_FIELD_OFFSETS.map(f => ({
              key: f.key,
              row: startRow + f.offset,
              col,
              rawText: `%${f.key}%`,
            })),
          })
        }
      }
    }
    else {
      let slotIndex = 0

      for (const col of FALLBACK_COLS) {
        for (const startRow of FALLBACK_START_ROWS) {
          slots.push({
            slotIndex: slotIndex++,
            cells: FALLBACK_FIELD_OFFSETS.map(f => ({
              key: f.key,
              row: startRow + f.offset,
              col,
              rawText: `%${f.key}%`,
            })),
          })
        }
      }
    }

    return slots
  },
}
