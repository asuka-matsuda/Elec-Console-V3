/**
 * タグ・線名札 Excel 帳票生成エンジン
 *
 * @description 取り込んだ回路台帳Excelからテーブル見出しを動的に取得し、
 * A4定型タグテンプレート（複数面配置）へデータを流し込みます。
 * 1ページの枠数を超えた場合は自動で改ページ・ブロック複製を行い、余剰枠のタグはクリアします。
 */
import type ExcelJS from 'exceljs'

import type { CircuitItem } from '#shared/types/circuit'
import {
  extractBanMeisho,
  extractBanShubetsu,
  extractKairoBangou,
  extractKairoMeisho,
  extractKansenHantei,
  extractKeiToName,
} from '#shared/utils/circuitFields'
import {
  cellValueToString,
  normalizeHeaderName,
} from '#shared/utils/excelNormalize'
import { getExcelJS } from '~/utils/excelHelper'

export interface DynamicTagField {
  /** 見出し名そのまま (例: "盤名称", "回路名称", "ケーブル", "行き先") */
  key: string
  /** タグ記法 (例: "%盤名称%", "%行き先%") */
  tag: string
  /** 列インデックス (1-indexed) */
  colIndex: number
  /** サンプル値（プレビュー用） */
  sampleValue?: string
}

export interface DynamicCircuitRow {
  /** 盤名称 (例: "1L-1") */
  banMeisho: string
  /** 盤種別 (例: "電灯", "動力") */
  banShubetsu?: string
  /** 系統名 (例: "一般電灯盤No.1") */
  keiToName?: string
  /** 幹線可否 (幹線 / 二次) */
  keiTo: string
  /** 回路番号 */
  kairoBangou?: string
  /** 回路名称 */
  kairoMeisho?: string
  /** 列見出し名をキーとした全セルの値マップ */
  values: Record<string, string>
}

interface TagSlotCell {
  row: number
  col: number
  rawText: string
  tags: string[]
}

interface TagSlot {
  slotIndex: number
  cells: TagSlotCell[]
  minRow: number
  minCol: number
}

export interface GenerateTagReportOptions {
  /** A4タグテンプレートのExcelバイナリ */
  templateBuffer: ArrayBuffer | Uint8Array
  /** 出力対象の回路データ行 */
  rows: DynamicCircuitRow[]
  /** 現場名（出力ファイル名用） */
  siteName?: string
  /** 出力日時（%出力日時% タグ置換用） */
  exportDate?: string
  /** 流し込み順（'z' = 行優先:左→右, 'n' = 列優先:上→下） */
  flowDirection?: 'z' | 'n'
}

export interface TagReportResult {
  buffer: Uint8Array
  filename: string
  totalTags: number
  totalPages: number
}

/**
 * ヘッダー行を検出するための判定キーワード（代表的な設備見出し語）
 */
const HEADER_KEYWORDS = [
  '盤',
  '回路',
  '系統',
  '幹線',
  '電線',
  'ケーブル',
  '遮断器',
  '容量',
  '負荷',
  '名称',
  '番号',
  '記号',
]

/**
 * セルから表示用文字列を安全に取得
 */
function formatCellToString(cell: ExcelJS.Cell): string {
  if (cell.value instanceof Date) {
    return cellValueToString(cell.value)
  }

  if (cell.text && typeof cell.text === 'string' && cell.text.trim()) {
    return cell.text.trim()
  }

  return cellValueToString(cell.value)
}

/**
 * 回路台帳Excel（または原本）からテーブル見出し（列名）と行データを動的に抽出
 */
export async function extractTableFromExcel(
  excelBuffer: ArrayBuffer | Uint8Array,
): Promise<{ headers: DynamicTagField[], rows: DynamicCircuitRow[] }> {
  const ExcelJS = await getExcelJS()
  const workbook = new ExcelJS.Workbook()

  await workbook.xlsx.load(excelBuffer as unknown as ExcelJS.Buffer)

  // 1. 回路シートを検出（名前に「回路」「盤」が含まれるシート、なければ第1シート）
  let sheet = workbook.worksheets.find(s => /回路|盤|台帳|List/i.test(s.name))

  if (!sheet) {
    sheet = workbook.worksheets[0]
  }

  if (!sheet) {
    return { headers: [], rows: [] }
  }

  // 2. ヘッダー行の検出（設備キーワードとの一致スコアを優先し、同点ならセル数、最初の候補を採用）
  let headerRowIndex = 1
  let maxScore = -1
  let maxColCount = 0

  const scanLimit = Math.min(sheet.rowCount || 10, 10)

  for (let r = 1; r <= scanLimit; r++) {
    const row = sheet.getRow(r)
    let score = 0
    let count = 0

    row.eachCell({ includeEmpty: false }, (cell) => {
      const val = cellValueToString(cell.value)

      if (val) {
        count++
        const norm = normalizeHeaderName(val)

        if (HEADER_KEYWORDS.some(kw => norm.includes(normalizeHeaderName(kw)))) {
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

  const headerRow = sheet.getRow(headerRowIndex)
  const headerMap = new Map<number, string>()
  const headers: DynamicTagField[] = []

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const text = cellValueToString(cell.value)

    if (text) {
      // 改行除去・トリム
      const cleanHeader = text.replace(/[\r\n]+/g, ' ').trim()

      headerMap.set(colNumber, cleanHeader)
      headers.push({
        key: cleanHeader,
        tag: `%${cleanHeader}%`,
        colIndex: colNumber,
      })
    }
  })

  // 3. データ行の走査
  const rows: DynamicCircuitRow[] = []
  const dataStartRow = headerRowIndex + 1

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < dataStartRow) return

    const values: Record<string, string> = {}
    let hasData = false

    headerMap.forEach((headerName, colIndex) => {
      const cell = row.getCell(colIndex)
      const val = formatCellToString(cell)

      if (val) hasData = true
      values[headerName] = val
    })

    if (!hasData) return

    // 盤名称・盤種別・系統名・幹線判定・回路番号・回路名称の特定（SSoT）
    const banMeisho = extractBanMeisho(values)
    const banShubetsu = extractBanShubetsu(values)
    const keiToName = extractKeiToName(values)
    const keiTo = extractKansenHantei(values)
    const kairoBangou = extractKairoBangou(values)
    const kairoMeisho = extractKairoMeisho(values)

    // サンプル値の更新（ヘッダープレビュー用）
    headers.forEach((h) => {
      if (!h.sampleValue && values[h.key]) {
        h.sampleValue = values[h.key]
      }
    })

    rows.push({
      banMeisho,
      banShubetsu,
      keiToName,
      keiTo,
      kairoBangou,
      kairoMeisho,
      values,
    })
  })

  return { headers, rows }
}

/**
 * CircuitItem[] 配列から DynamicCircuitRow[] およびヘッダー一覧を生成するフォールバック
 */
export function convertCircuitsToDynamicRows(
  circuits: CircuitItem[],
  optionsOrDate: { exportDate?: string } | string = {},
): { headers: DynamicTagField[], rows: DynamicCircuitRow[] } {
  const exportDate = typeof optionsOrDate === 'string' ? optionsOrDate : (optionsOrDate?.exportDate || '')

  const standardKeys = [
    '盤名称',
    '盤種別',
    '系統',
    '幹線判定',
    '回路番号',
    '回路記号',
    '回路名称',
    '配電方式',
    '相種別',
    '遮断器種別',
    '遮断器容量',
    'ケーブル',
    '配線条数',
    '接地有無',
    '接地種別',
    '出力日時',
  ]

  const headers: DynamicTagField[] = standardKeys.map((key, idx) => ({
    key,
    tag: `%${key}%`,
    colIndex: idx + 1,
  }))

  const rows: DynamicCircuitRow[] = circuits.map((c) => {
    const values: Record<string, string> = {
      盤名称: c.banMeisho || '',
      盤種別: c.banShubetsu || '',
      系統: c.banMeisho ? `${c.banMeisho}系統` : '',
      幹線判定: c.keiTo || '二次',
      回路番号: c.kairoBangou || '',
      回路記号: c.kairoKigou || '',
      回路名称: c.kairoMeisho || '',
      配電方式: c.haidenHoushiki || '',
      相種別: c.souShubetsu || '',
      遮断器種別: c.shadankiShubetsu || '',
      遮断器容量: c.shadankiYouryou || '',
      ケーブル: c.cableList || '',
      配線条数: c.haisenJousuu || '',
      接地有無: c.setsuchiUmu || '',
      接地種別: c.setsuchiList || '',
      出力日時: exportDate,
    }

    const rawKeiTo = c.keiTo?.trim() || ''
    const kansenHantei = extractKansenHantei({ 系統: rawKeiTo, 幹線判定: rawKeiTo })
    const keiToName = rawKeiTo.replace(/幹線|二次側?|系統/g, '').trim() || rawKeiTo || (c.banMeisho ? `${c.banMeisho}系` : '一般系統')

    return {
      banMeisho: c.banMeisho || '未分類',
      banShubetsu: c.banShubetsu || '電灯盤',
      keiToName,
      keiTo: kansenHantei,
      kairoBangou: c.kairoBangou || '',
      kairoMeisho: c.kairoMeisho || '',
      values,
    }
  })

  // サンプル値設定
  headers.forEach((h) => {
    const found = rows.find(r => r.values[h.key])

    if (found) {
      h.sampleValue = found.values[h.key]
    }
  })

  return { headers, rows }
}

/**
 * テンプレートシートからタグ枠（スロット）を検出しグループ化
 */
export function detectTagSlots(
  sheet: ExcelJS.Worksheet,
  flowDirection: 'z' | 'n' = 'z',
): { slots: TagSlot[], pageHeight: number } {
  const placeholderCells: TagSlotCell[] = []
  let maxRow = 1

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber > maxRow) maxRow = rowNumber

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const text = cellValueToString(cell.value)

      if (!text) return

      const matches = text.match(/%([^%]+)%/g)

      if (matches && matches.length > 0) {
        const tags = matches.map(m => m.slice(1, -1).trim())

        placeholderCells.push({
          row: rowNumber,
          col: colNumber,
          rawText: text,
          tags,
        })
      }
    })
  })

  if (placeholderCells.length === 0) {
    return { slots: [], pageHeight: maxRow }
  }

  // 1. 各タグの出現回数を集計し、スロット数（枠数）を推定
  const tagCountMap = new Map<string, number>()

  placeholderCells.forEach((c) => {
    c.tags.forEach((t) => {
      tagCountMap.set(t, (tagCountMap.get(t) || 0) + 1)
    })
  })

  // 最も出現回数の多いタグをアンカーとする
  let anchorTag = ''
  let estimatedSlotCount = 1

  tagCountMap.forEach((count, tag) => {
    if (count > estimatedSlotCount) {
      estimatedSlotCount = count
      anchorTag = tag
    }
  })

  // アンカーセル一覧
  const anchorCells = placeholderCells.filter(c => c.tags.includes(anchorTag))

  // スロット並び順（Z順: 行優先、N順: 列優先）でアンカーセルをソート
  anchorCells.sort((a, b) => {
    if (flowDirection === 'z') {
      // 行が近い場合（同一段とみなす閾値：行差が2以内など）
      if (Math.abs(a.row - b.row) <= 2) {
        return a.col - b.col
      }

      return a.row - b.row
    }
    else {
      // 列が近い場合
      if (Math.abs(a.col - b.col) <= 2) {
        return a.row - b.row
      }

      return a.col - b.col
    }
  })

  // アンカーセルを元に各スロットを作成
  const slots: TagSlot[] = anchorCells.map((anchor, index) => ({
    slotIndex: index,
    cells: [anchor],
    minRow: anchor.row,
    minCol: anchor.col,
  }))

  // アンカー以外のセルを最も近いアンカー（スロット）に割り当て
  const nonAnchorCells = placeholderCells.filter(c => !c.tags.includes(anchorTag))

  nonAnchorCells.forEach((cell) => {
    let bestSlot = slots[0]
    let minDistance = Infinity

    slots.forEach((slot) => {
      // マンハッタン距離
      const dist = Math.abs(cell.row - slot.minRow) * 2 + Math.abs(cell.col - slot.minCol)

      if (dist < minDistance) {
        minDistance = dist
        bestSlot = slot
      }
    })

    if (bestSlot) {
      bestSlot.cells.push(cell)
      if (cell.row < bestSlot.minRow) bestSlot.minRow = cell.row
      if (cell.col < bestSlot.minCol) bestSlot.minCol = cell.col
    }
  })

  return { slots, pageHeight: maxRow }
}

/**
 * 行データからキーに対する最適な値を解決する
 * - 完全一致優先
 * - 全角・半角の正規化一致に対応
 * - 出力日時に対応
 * - 互換性キー（エイリアス）や現場名は対応しない（動的生成準拠）
 */
export function resolveValueOfKey(
  row: DynamicCircuitRow,
  key: string,
  optionsOrDate: { exportDate?: string } | string = {},
): string {
  // 1. 完全一致
  if (row.values[key] !== undefined) {
    return row.values[key]
  }

  const exportDate = typeof optionsOrDate === 'string' ? optionsOrDate : (optionsOrDate?.exportDate || '')
  const normKey = normalizeHeaderName(key)

  // 2. 出力日時（全角・半角・別称対応）
  if (normKey === '出力日時' || normKey === '出力日' || normKey === '日付') {
    return exportDate
  }

  // 3. 正規化一致（全角半角、カタカナ、大文字小文字、スペース揺らぎの吸収）
  for (const [k, v] of Object.entries(row.values)) {
    if (normalizeHeaderName(k) === normKey) {
      return v
    }
  }

  return ''
}

/**
 * 行の書式と高さをコピー（ブロック複製用）
 */
function copyRowFormatting(sourceRow: ExcelJS.Row, targetRow: ExcelJS.Row) {
  if (sourceRow.height) targetRow.height = sourceRow.height

  sourceRow.eachCell({ includeEmpty: true }, (sourceCell, colNumber) => {
    const targetCell = targetRow.getCell(colNumber)

    // スタイルプロパティの安全な個別コピー（参照破壊防止）
    if (sourceCell.font) targetCell.font = Object.assign({}, sourceCell.font)
    if (sourceCell.border) targetCell.border = Object.assign({}, sourceCell.border)
    if (sourceCell.fill) targetCell.fill = Object.assign({}, sourceCell.fill)
    if (sourceCell.alignment) targetCell.alignment = Object.assign({}, sourceCell.alignment)

    // 表示形式（numFmt）の引き継ぎ
    if (sourceCell.numFmt) {
      targetCell.numFmt = sourceCell.numFmt
    }

    // セル値（式やテキストなど）も初期コピー
    targetCell.value = sourceCell.value
  })
}

/**
 * A4タグテンプレートに回路データを流し込み、Excelファイルを生成
 */
export async function generateTagReportExcel(
  options: GenerateTagReportOptions,
): Promise<TagReportResult> {
  const {
    templateBuffer,
    rows,
    siteName = '現場',
    flowDirection = 'z',
  } = options

  if (rows.length === 0) {
    throw new Error('出力対象のデータ行がありません')
  }

  const ExcelJS = await getExcelJS()
  const workbook = new ExcelJS.Workbook()

  await workbook.xlsx.load(templateBuffer as unknown as ExcelJS.Buffer)

  const sheet = workbook.worksheets[0]

  if (!sheet) {
    throw new Error('テンプレートにワークシートが見つかりません')
  }

  // 1. 1ページ内のタグ枠（スロット）とページ高さを検出
  const { slots, pageHeight } = detectTagSlots(sheet, flowDirection)
  const slotsPerPage = slots.length

  if (slotsPerPage === 0) {
    throw new Error('テンプレート内に有効なプレースホルダー（%キー名%）が見つかりません')
  }

  const totalTags = rows.length
  const totalPages = Math.ceil(totalTags / slotsPerPage)

  // 3. 複数ページが必要な場合、1ページ目のブロックを下方向へ複製し改ページを挿入
  const originalMerges = sheet.model.merges ? [...sheet.model.merges] : []

  for (let page = 1; page < totalPages; page++) {
    const rowOffset = page * pageHeight

    // 行コピー
    for (let r = 1; r <= pageHeight; r++) {
      const sourceRow = sheet.getRow(r)
      const targetRow = sheet.getRow(r + rowOffset)

      copyRowFormatting(sourceRow, targetRow)
    }

    // 結合セルのオフセットコピー
    originalMerges.forEach((mergeRange) => {
      // mergeRange 例: "A1:C2"
      const parts = mergeRange.split(':')
      const p1 = parts[0]
      const p2 = parts[1]

      if (p1 && p2) {
        const [c1, r1] = parseCellAddress(p1)
        const [c2, r2] = parseCellAddress(p2)

        if (r1 <= pageHeight && r2 <= pageHeight) {
          try {
            sheet.mergeCells(r1 + rowOffset, c1, r2 + rowOffset, c2)
          }
          catch {
            // 重複マージ防止
          }
        }
      }
    })

    // 前ページの末尾に改ページを挿入
    sheet.getRow(rowOffset).addPageBreak()
  }

  // 3. 各ページ・各スロットへデータを流し込み
  for (let page = 0; page < totalPages; page++) {
    const rowOffset = page * pageHeight

    for (let s = 0; s < slotsPerPage; s++) {
      const dataIndex = page * slotsPerPage + s
      const dataRow = dataIndex < totalTags ? rows[dataIndex] : null

      const slot = slots[s]

      if (!slot) continue

      for (const slotCell of slot.cells) {
        const targetRow = slotCell.row + rowOffset
        const cell = sheet.getRow(targetRow).getCell(slotCell.col)

        let cellText = cellValueToString(cell.value)

        if (!cellText && slotCell.rawText) {
          cellText = slotCell.rawText
        }

        if (dataRow) {
          // データがある場合：プレースホルダーを置換
          const prevNumFmt = cell.numFmt
          const replaced = cellText.replace(/%([^%]+)%/g, (_match, key) => {
            return resolveValueOfKey(dataRow, key.trim(), { exportDate: options.exportDate })
          })

          cell.value = replaced
          if (prevNumFmt) {
            cell.numFmt = prevNumFmt
          }
        }
        else {
          // 余剰枠の場合：プレースホルダーを空文字クリア
          const prevNumFmt = cell.numFmt
          const cleared = cellText.replace(/%([^%]+)%/g, '')

          cell.value = cleared.trim()
          if (prevNumFmt) {
            cell.numFmt = prevNumFmt
          }
        }
      }
    }
  }

  // 4. バッファ書き出し
  const outBuffer = await workbook.xlsx.writeBuffer()
  const safeSiteName = (siteName || '現場').replace(/[\\/:*?"<>|]/g, '_')
  const filename = `${safeSiteName}_タグ線名札_${totalTags}件.xlsx`

  return {
    buffer: new Uint8Array(outBuffer),
    filename,
    totalTags,
    totalPages,
  }
}

/**
 * "B3" などのセルアドレスを [colIndex, rowIndex] に変換
 */
function parseCellAddress(addr: string): [number, number] {
  const match = addr.match(/^([A-Z]+)(\d+)$/i)

  if (!match || !match[1] || !match[2]) return [1, 1]

  const colLetters = match[1].toUpperCase()
  const rowIndex = parseInt(match[2], 10)

  let colIndex = 0

  for (let i = 0; i < colLetters.length; i++) {
    colIndex = colIndex * 26 + (colLetters.charCodeAt(i) - 64)
  }

  return [colIndex, rowIndex]
}
