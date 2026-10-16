/**
 * Excel操作共通ユーティリティ（クライアント・サーバー両用 SSoT）
 *
 * セル値の安全な文字列抽出およびヘッダー・見出し文字列の正規化を提供します。
 */

import { formatDate } from './date'

/**
 * Excel見出し・ヘッダー文字列の正規化（全角半角統一・空白改行アンダースコア除去・小文字化）
 */
export function normalizeHeaderName(name: unknown): string {
  if (name === null || name === undefined) return ''

  return String(name)
    .normalize('NFKC')
    .replace(/[\s\r\n\t_]/g, '')
    .toLowerCase()
}

/**
 * セル値のセーフな文字列取得（Formula / RichText / Date / プリミティブ対応）
 */
export function cellValueToString(value: unknown): string {
  if (value === null || value === undefined) return ''

  if (typeof value === 'object') {
    if (value instanceof Date) {
      return formatDate(value)
    }

    const obj = value as Record<string, unknown>

    if ('richText' in obj && Array.isArray(obj.richText)) {
      return obj.richText.map((t: { text?: string }) => t.text || '').join('')
    }

    if ('text' in obj && typeof obj.text === 'string') {
      return cellValueToString(obj.text)
    }

    if ('result' in obj && obj.result !== undefined && obj.result !== null) {
      return cellValueToString(obj.result)
    }
  }

  return String(value)
}

/**
 * 最小限の ExcelJS セル・行・ワークシート抽象型（ライブラリ非依存）
 */
interface MinimalCell {
  value: unknown
}

interface MinimalRow {
  eachCell: (options: { includeEmpty: boolean }, callback: (cell: MinimalCell, colNumber: number) => void) => void
  getCell: (colNumber: number) => MinimalCell
}

export interface MinimalWorksheet {
  name: string
  rowCount?: number
  getRow: (rowNumber: number) => MinimalRow
  eachRow?: (options: { includeEmpty: boolean }, callback: (row: MinimalRow, rowNumber: number) => void) => void
}

interface MinimalWorkbook<T extends MinimalWorksheet = MinimalWorksheet> {
  worksheets: T[]
}

/**
 * 回路・設備シートの優先探索（名前に正規表現が一致するシート、なければ第1シート）
 */
export function findPreferredWorksheet<T extends MinimalWorksheet = MinimalWorksheet>(
  workbook: MinimalWorkbook<T>,
  pattern: RegExp = /回路|盤|台帳|List/i,
): T | undefined {
  return workbook.worksheets.find(s => pattern.test(s.name)) || workbook.worksheets[0]
}

/**
 * シート内のヘッダー行インデックスを検出（見出し語の一致スコア優先、同点ならセル数）
 */
export function detectHeaderRowIndex(
  sheet: MinimalWorksheet,
  targetKeywords: readonly string[],
  options?: {
    scanLimit?: number
    exactMatch?: boolean
  },
): number {
  const scanLimit = options?.scanLimit ?? 10
  const exactMatch = options?.exactMatch ?? false
  const targetNorms = new Set(targetKeywords.map(normalizeHeaderName))
  const targetList = Array.from(targetNorms)

  let headerRowIndex = 1
  let maxScore = -1
  let maxColCount = 0
  const limit = Math.min(sheet.rowCount || scanLimit, scanLimit)

  for (let r = 1; r <= limit; r++) {
    const row = sheet.getRow(r)
    let score = 0
    let count = 0

    row.eachCell({ includeEmpty: false }, (cell) => {
      const val = cellValueToString(cell.value)

      if (val) {
        count++
        const norm = normalizeHeaderName(val)

        const isMatch = exactMatch
          ? targetNorms.has(norm)
          : targetNorms.has(norm) || targetList.some(kw => norm.includes(kw))

        if (isMatch) {
          score++
        }
      }
    })

    if (score > maxScore || (score === maxScore && count > maxColCount)) {
      maxScore = score
      maxColCount = count
      headerRowIndex = r
    }
  }

  return headerRowIndex
}
