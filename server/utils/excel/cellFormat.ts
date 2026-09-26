/**
 * Excel セル文字列入出力・改行正規化ユーティリティ
 *
 * セル値の安全な抽出（数式結果・RichText対応）、改行コード正規化およびセル内折り返し設定を提供します。
 */

import type ExcelJS from 'exceljs'

/**
 * 文字列内の改行コード（\r\n, \r）を \n に統一し、前後の不要な空白・空行をトリム
 * ただし内部の改行構造は完全に維持する
 */
export function normalizeNewlines(str: string): string {
  if (!str) return ''

  return str.replace(/\r\n|\r/g, '\n').trim()
}

/**
 * セルにテキストを設定し、改行が含まれる場合は Excel 標準の \r\n に変換して wrapText: true を付与する
 */
export function setCellStringWithNewlines(
  cell: ExcelJS.Cell,
  value: string | null | undefined,
): void {
  if (value === null || value === undefined) return
  const str = String(value).trim()

  if (!str) return

  if (str.includes('\n')) {
    // Windows/Excel標準の \r\n に揃え、セル内折り返し（wrapText: true）を有効化
    cell.value = str.replace(/\r?\n/g, '\r\n')
    cell.alignment = {
      ...(cell.alignment || {}),
      wrapText: true,
    }
  }
  else {
    cell.value = str
  }
}

/**
 * 行から指定列番号のセル文字列を安全に取得（数式結果、リッチテキスト対応）
 */
export function getCellString(row: ExcelJS.Row, colNumber: number): string {
  const cell = row.getCell(colNumber)
  const v = cell.value

  if (v === null || v === undefined) return ''

  if (typeof v === 'object') {
    if ('result' in v && v.result !== undefined && v.result !== null) {
      return normalizeNewlines(String(v.result))
    }

    if ('richText' in v && Array.isArray(v.richText)) {
      return normalizeNewlines(v.richText.map(t => t.text).join(''))
    }
  }

  return normalizeNewlines(String(v))
}

/**
 * 幹線・二次側の判定
 */
export function isKansen(v: unknown): string {
  if (v === true || String(v).trim().toLowerCase() === 'true' || String(v).trim() === '1') {
    return '幹線'
  }

  if (typeof v === 'string' && v.includes('幹線')) {
    return '幹線'
  }

  return '二次側'
}

/**
 * フェーズ2（絶縁抵抗測定値）のステータスと数値をパース
 */
export function parseP2Value(valRaw: unknown, keiTo: string): { status: string | null, value: number | null } {
  if (valRaw === null || valRaw === undefined || valRaw === '') {
    return { status: null, value: null }
  }

  const val = parseFloat(String(valRaw))

  if (isNaN(val)) {
    return { status: String(valRaw), value: null }
  }

  if (val === 100 && keiTo === '二次側') {
    return { status: '良好', value: 100 }
  }

  if (val === 500 && keiTo === '幹線') {
    return { status: '良好', value: 500 }
  }

  return { status: '入力', value: val }
}
