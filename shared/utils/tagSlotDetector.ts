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

/**
 * 昇順ソートされた数値配列を、指定ギャップを超える境界でクラスタリング
 */
export function clusterConsecutiveNumbers(numbers: number[], maxGap = 1): number[][] {
  if (numbers.length === 0) return []

  const bands: number[][] = []
  let currentBand: number[] = [numbers[0]!]

  for (let i = 1; i < numbers.length; i++) {
    const prev = numbers[i - 1]!
    const curr = numbers[i]!

    if (curr - prev > maxGap) {
      bands.push(currentBand)
      currentBand = [curr]
    }
    else {
      currentBand.push(curr)
    }
  }
  bands.push(currentBand)

  return bands
}

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

  // 行・列のクラスタリング（枠と枠の間のギャップ gap > 1 で分割）
  const rowBands = clusterConsecutiveNumbers(uniqueRows)
  const colBands = clusterConsecutiveNumbers(uniqueCols)

  const slots: TagSlotDef[] = []
  let slotIndex = 0

  // 流し込み順（Z順: 行優先、N順: 列優先）に応じた二次元走査
  const primaryBands = flowDirection === 'z' ? rowBands : colBands
  const secondaryBands = flowDirection === 'z' ? colBands : rowBands

  for (const pBand of primaryBands) {
    for (const sBand of secondaryBands) {
      const rBand = flowDirection === 'z' ? pBand : sBand
      const cBand = flowDirection === 'z' ? sBand : pBand

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

  return slots
}
