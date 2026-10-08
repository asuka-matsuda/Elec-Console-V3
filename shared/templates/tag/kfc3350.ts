import type { TagSlotDef, TagTemplateDefinition } from '#shared/types/tagTemplate'

/**
 * KFC-3350（A4・24面）線名札テンプレート定義
 *
 * @description
 * - 用紙: A4縦（24枠 / ページ）
 * - 配置: 横3列 × 縦8段
 * - 列座標: B列(2), D列(4), F列(6)
 * - 行座標: Row 2, 9, 16, 23, 30, 37, 44, 51 (ピッチ 7行)
 * - 枠内構成（縦5行）:
 *   +0: 回路番号
 *   +1: ケーブル
 *   +2: 配電方式
 *   +3: 系統
 *   +4: 回路名称
 * - 1ページ総行数: 56行
 */
const COLS = [2, 4, 6]
const START_ROWS = [2, 9, 16, 23, 30, 37, 44, 51]

const FIELD_OFFSETS: { key: string, offset: number }[] = [
  { key: '回路番号', offset: 0 },
  { key: 'ケーブル', offset: 1 },
  { key: '配電方式', offset: 2 },
  { key: '系統', offset: 3 },
  { key: '回路名称', offset: 4 },
]

export const kfc3350Template: TagTemplateDefinition = {
  id: 'kfc-3350',
  name: 'KFC-3350（A4・24面）',
  description: '横3列×縦8段の標準的な線名札24枠テンプレート',
  pageHeight: 56,
  slotsPerPage: 24,

  match: (nameOrFilename: string) => {
    return /kfc[-_]?3350/i.test(nameOrFilename)
  },

  getSlots: (flowDirection: 'z' | 'n'): TagSlotDef[] => {
    const slots: TagSlotDef[] = []

    if (flowDirection === 'z') {
      // Z順: 行優先（左→右、上→下）
      let slotIndex = 0

      for (const startRow of START_ROWS) {
        for (const col of COLS) {
          slots.push({
            slotIndex: slotIndex++,
            cells: FIELD_OFFSETS.map(f => ({
              key: f.key,
              row: startRow + f.offset,
              col,
            })),
          })
        }
      }
    }
    else {
      // N順: 列優先（上→下、左→右）
      let slotIndex = 0

      for (const col of COLS) {
        for (const startRow of START_ROWS) {
          slots.push({
            slotIndex: slotIndex++,
            cells: FIELD_OFFSETS.map(f => ({
              key: f.key,
              row: startRow + f.offset,
              col,
            })),
          })
        }
      }
    }

    return slots
  },
}
