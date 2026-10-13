/**
 * 線名札・タグ帳票 プレースホルダー動的スロット検出エンジン
 *
 * @description
 * テンプレートExcelのセルを走査し、%回路番号% や %ケーブル% 等のプレースホルダーを完全自動検出。
 * 行・列の段間ギャップから各枠（スロット）をグルーピングし、固定セル番地（Row, Col決め打ち）に一切依存せず
 * キーを直接狙い撃ちしてデータを流し込むためのスロット定義を動的生成します。
 */

import type ExcelJS from 'exceljs'

import type { TagSlotDef } from '#shared/types/tagTemplate'
import { cellValueToString } from '#shared/utils/excelNormalize'

export function detectTagSlotsFromSheet(
  sheet: ExcelJS.Worksheet,
  flowDirection: 'z' | 'n' = 'z',
): TagSlotDef[] {
  interface DetectedCell {
    row: number
    col: number
    rawText: string
    key: string
  }

  const detectedCells: DetectedCell[] = []

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
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

  // 行のクラスタリング（Row Bands / 縦の段）
  // 枠と枠の間のギャップ（gap > 1）で段を分割
  const rowBands: number[][] = []
  let currentRowBand: number[] = [uniqueRows[0]!]

  for (let i = 1; i < uniqueRows.length; i++) {
    const prev = uniqueRows[i - 1]!
    const curr = uniqueRows[i]!

    if (curr - prev > 1) {
      rowBands.push(currentRowBand)
      currentRowBand = [curr]
    }
    else {
      currentRowBand.push(curr)
    }
  }
  rowBands.push(currentRowBand)

  // 列のクラスタリング（Col Bands / 横の列グループ）
  const colBands: number[][] = []
  let currentColBand: number[] = [uniqueCols[0]!]

  for (let i = 1; i < uniqueCols.length; i++) {
    const prev = uniqueCols[i - 1]!
    const curr = uniqueCols[i]!

    if (curr - prev > 1) {
      colBands.push(currentColBand)
      currentColBand = [curr]
    }
    else {
      currentColBand.push(curr)
    }
  }
  colBands.push(currentColBand)

  const slots: TagSlotDef[] = []
  let slotIndex = 0

  if (flowDirection === 'z') {
    // Z順: 行優先（横方向に各列 → 次の段へ）
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
    // N順: 列優先（縦方向に各段 → 次の列へ）
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
