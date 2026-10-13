import type ExcelJS from 'exceljs'

import type { TagSlotDef, TagTemplateDefinition } from '#shared/types/tagTemplate'
import { cellValueToString } from '#shared/utils/excelNormalize'

/**
 * KFC-3350（A4・24面）線名札テンプレート定義
 *
 * @description
 * - 用紙: A4縦（24枠 / ページ）
 * - 配置: 横3列 × 縦8段
 * - セル内に記述されたプレースホルダー（%回路番号%、%系統% 等）を動的に狙ってスロットを検出します。
 * - テンプレート側の行順変更（例: 系統と回路名称の上下入れ替え）や新規キーの追加にも追従します。
 */
const DEFAULT_COLS = [2, 4, 6]
const DEFAULT_START_ROWS = [2, 9, 16, 23, 30, 37, 44, 51]

const DEFAULT_FIELD_OFFSETS: { key: string, offset: number }[] = [
  { key: '回路番号', offset: 0 },
  { key: 'ケーブル', offset: 1 },
  { key: '配電方式', offset: 2 },
  { key: '系統', offset: 3 },
  { key: '回路名称', offset: 4 },
]

/**
 * 数値配列の中でギャップ（間隔）が大きい上位 (numBands - 1) 箇所を境界としてクラスタリング分割する
 */
export function splitByLargestGaps(sortedNumbers: number[], numBands: number): number[][] {
  if (sortedNumbers.length === 0) return []
  if (numBands <= 1 || sortedNumbers.length <= numBands) {
    return sortedNumbers.map(n => [n])
  }

  const gaps: { index: number, gap: number }[] = []

  for (let i = 0; i < sortedNumbers.length - 1; i++) {
    const prev = sortedNumbers[i]!
    const next = sortedNumbers[i + 1]!

    gaps.push({
      index: i,
      gap: next - prev,
    })
  }

  // ギャップの大きい順（間隔が1より大きいもの優先）に (numBands - 1) 個を選択
  const splitPoints = gaps
    .filter(g => g.gap > 1)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, numBands - 1)
    .map(g => g.index)
    .sort((a, b) => a - b)

  const bands: number[][] = []
  let startIdx = 0

  for (const splitIdx of splitPoints) {
    bands.push(sortedNumbers.slice(startIdx, splitIdx + 1))
    startIdx = splitIdx + 1
  }
  bands.push(sortedNumbers.slice(startIdx))

  return bands
}

/**
 * シート内のプレースホルダーセルから KFC-3350（横3列×縦8段 = 24枠）のスロットを動的検出
 */
export function detectKfc3350SlotsFromSheet(
  sheet: ExcelJS.Worksheet,
  flowDirection: 'z' | 'n',
): TagSlotDef[] {
  interface DetectedCell {
    row: number
    col: number
    rawText: string
    key: string
  }

  const detectedCells: DetectedCell[] = []

  sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const val = cellValueToString(cell.value)

      if (val && val.includes('%')) {
        const matches = val.match(/%([^%]+)%/g)

        if (matches && matches.length > 0) {
          const firstKey = matches[0]!.replace(/%/g, '').trim()

          detectedCells.push({
            row: rowNumber,
            col: colNumber,
            rawText: val,
            key: firstKey,
          })
        }
      }
    })
  })

  if (detectedCells.length === 0) {
    return []
  }

  const uniqueRows = Array.from(new Set(detectedCells.map(c => c.row))).sort((a, b) => a - b)
  const uniqueCols = Array.from(new Set(detectedCells.map(c => c.col))).sort((a, b) => a - b)

  // KFC-3350 規格: 縦8段 × 横3列
  const rowBands = splitByLargestGaps(uniqueRows, 8)
  const colBands = splitByLargestGaps(uniqueCols, 3)

  // 8段 × 3列 の枠構成が取れない場合は空配列を返してフォールバック
  if (rowBands.length !== 8 || colBands.length !== 3) {
    return []
  }

  const slots: TagSlotDef[] = []
  let slotIndex = 0

  if (flowDirection === 'z') {
    // Z順: 行優先（横3列 → 次の段へ）
    for (const rBand of rowBands) {
      for (const cBand of colBands) {
        const slotCells = detectedCells
          .filter(c => rBand.includes(c.row) && cBand.includes(c.col))
          .sort((a, b) => (a.row !== b.row ? a.row - b.row : a.col - b.col))

        if (slotCells.length > 0) {
          slots.push({
            slotIndex: slotIndex++,
            cells: slotCells.map(c => ({
              key: c.key,
              row: c.row,
              col: c.col,
              rawText: c.rawText,
            })),
          })
        }
      }
    }
  }
  else {
    // N順: 列優先（縦8段 → 次の列へ）
    for (const cBand of colBands) {
      for (const rBand of rowBands) {
        const slotCells = detectedCells
          .filter(c => rBand.includes(c.row) && cBand.includes(c.col))
          .sort((a, b) => (a.row !== b.row ? a.row - b.row : a.col - b.col))

        if (slotCells.length > 0) {
          slots.push({
            slotIndex: slotIndex++,
            cells: slotCells.map(c => ({
              key: c.key,
              row: c.row,
              col: c.col,
              rawText: c.rawText,
            })),
          })
        }
      }
    }
  }

  return slots
}

export const kfc3350Template: TagTemplateDefinition = {
  id: 'kfc-3350',
  name: 'KFC-3350（A4・24面）',
  description: '横3列×縦8段の標準的な線名札24枠テンプレート',
  pageHeight: 56,
  slotsPerPage: 24,

  match: (nameOrFilename: string) => {
    return /kfc[-_]?3350/i.test(nameOrFilename)
  },

  getSlots: (flowDirection: 'z' | 'n', sheet?: ExcelJS.Worksheet): TagSlotDef[] => {
    // ワークシートが渡された場合、セル内のプレースホルダーから動的スロット検出を最優先
    if (sheet) {
      const dynamicSlots = detectKfc3350SlotsFromSheet(sheet, flowDirection)

      if (dynamicSlots.length === 24) {
        return dynamicSlots
      }
    }

    // 静的フォールバック（引数なし呼び出し時やプレースホルダー未検出時）
    const slots: TagSlotDef[] = []

    if (flowDirection === 'z') {
      // Z順: 行優先（左→右、上→下）
      let slotIndex = 0

      for (const startRow of DEFAULT_START_ROWS) {
        for (const col of DEFAULT_COLS) {
          slots.push({
            slotIndex: slotIndex++,
            cells: DEFAULT_FIELD_OFFSETS.map(f => ({
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
      // N順: 列優先（上→下、左→右）
      let slotIndex = 0

      for (const col of DEFAULT_COLS) {
        for (const startRow of DEFAULT_START_ROWS) {
          slots.push({
            slotIndex: slotIndex++,
            cells: DEFAULT_FIELD_OFFSETS.map(f => ({
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
