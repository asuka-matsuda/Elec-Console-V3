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
    if (!sheet) return []

    return detectTagSlotsFromSheet(sheet, flowDirection)
  },
}
