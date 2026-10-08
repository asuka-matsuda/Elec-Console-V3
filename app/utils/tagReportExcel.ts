/**
 * タグ・線名札 Excel 帳票生成エンジン
 *
 * @description 取り込んだ回路台帳Excelからテーブル見出しを動的に取得し、
 * A4定型タグテンプレート（複数面配置）へデータを流し込みます。
 * 1ページの枠数を超えた場合は自動で改ページ・ブロック複製を行い、余剰枠のタグはクリアします。
 */
import type ExcelJS from 'exceljs'

import { findTagTemplateDefinition } from '#shared/templates/tag'
import type { CircuitItem } from '#shared/types/circuit'
import type { TagTemplateDefinition } from '#shared/types/tagTemplate'
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
  /** 回路ID (存在する場合) */
  id?: string
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
  /** テンプレート名・ファイル名・ID（確定定義のマッチング用） */
  templateName?: string
  /** 直接指定する確定テンプレート定義（指定した場合は最優先で使用） */
  templateDefinition?: TagTemplateDefinition
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
      系統: c.keiToName || (c.banMeisho ? `${c.banMeisho}系統` : ''),
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
    const kansenHantei = rawKeiTo.includes('幹線') ? '幹線' : '二次'
    const keiToName = c.keiToName?.trim() || (c.banMeisho ? `${c.banMeisho}系統` : '一般系統')

    return {
      id: c.id,
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
 * ワークシートを完全に複製（印刷設定・余白・列幅・行高・書式を完全維持）
 */
function cloneWorksheet(
  workbook: ExcelJS.Workbook,
  sourceSheet: ExcelJS.Worksheet,
  newName: string,
): ExcelJS.Worksheet {
  const newSheet = workbook.addWorksheet(newName, {
    pageSetup: sourceSheet.pageSetup ? Object.assign({}, sourceSheet.pageSetup) : undefined,
    properties: sourceSheet.properties ? Object.assign({}, sourceSheet.properties) : undefined,
    views: sourceSheet.views ? JSON.parse(JSON.stringify(sourceSheet.views)) : undefined,
  })

  // 列幅・スタイルの複製
  if (sourceSheet.columns) {
    newSheet.columns = sourceSheet.columns.map(col => ({
      width: col.width,
      hidden: col.hidden,
      outlineLevel: col.outlineLevel,
      style: col.style ? Object.assign({}, col.style) : undefined,
    }))
  }

  // 行の高さ・セル値・書式の複製
  sourceSheet.eachRow({ includeEmpty: true }, (sourceRow, rowNumber) => {
    const targetRow = newSheet.getRow(rowNumber)

    if (sourceRow.height) targetRow.height = sourceRow.height
    targetRow.hidden = sourceRow.hidden

    sourceRow.eachCell({ includeEmpty: true }, (sourceCell, colNumber) => {
      const targetCell = targetRow.getCell(colNumber)

      targetCell.value = sourceCell.value

      if (sourceCell.font) targetCell.font = Object.assign({}, sourceCell.font)
      if (sourceCell.border) targetCell.border = Object.assign({}, sourceCell.border)
      if (sourceCell.fill) targetCell.fill = Object.assign({}, sourceCell.fill)
      if (sourceCell.alignment) targetCell.alignment = Object.assign({}, sourceCell.alignment)
      if (sourceCell.numFmt) targetCell.numFmt = sourceCell.numFmt
    })
  })

  // 結合セルの複製
  if (sourceSheet.model.merges) {
    sourceSheet.model.merges.forEach((mergeRange) => {
      try {
        newSheet.mergeCells(mergeRange)
      }
      catch {
        // 重複マージ防止
      }
    })
  }

  return newSheet
}

/**
 * 複数ページ時のシート名を生成（Excelの31文字制限に対応）
 */
function formatSheetName(baseName: string, pageIndex: number, totalPages: number): string {
  if (totalPages === 1) return baseName

  const suffix = ` (${pageIndex + 1})`
  const maxBaseLen = Math.max(1, 31 - suffix.length)
  const safeBase = (baseName || 'Page').slice(0, maxBaseLen)

  return `${safeBase}${suffix}`
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

  // 1. 確定定義（TypeScript）があるか判定（直接指定、またはテンプレート名・シート名から）
  const matchedDef
    = options.templateDefinition
      || findTagTemplateDefinition(options.templateName)
      || findTagTemplateDefinition(sheet.name)

  if (!matchedDef) {
    throw new Error(
      `指定された線名札テンプレート「${options.templateName || sheet.name}」に対応する確定ロジックファイル（TS）が登録されていません。マスター管理で適切なロジックファイルを指定してください。`,
    )
  }

  // 確定定義（TS）から決定論的にスロットを生成（推測ゼロ・完全安全）
  const defSlots = matchedDef.getSlots(flowDirection)

  const slots: TagSlot[] = defSlots.map(s => ({
    slotIndex: s.slotIndex,
    cells: s.cells.map(c => ({
      row: c.row,
      col: c.col,
      rawText: `%${c.key}%`,
      tags: [c.key],
    })),
    minRow: Math.min(...s.cells.map(c => c.row)),
    minCol: Math.min(...s.cells.map(c => c.col)),
  }))

  const slotsPerPage = slots.length

  if (slotsPerPage === 0) {
    throw new Error('テンプレート内に有効なプレースホルダー（%キー名%）が見つかりません')
  }

  const totalTags = rows.length
  const totalPages = Math.ceil(totalTags / slotsPerPage)

  // 2. 複数ページがある場合、テンプレートが変更される前に全シートをクローン
  const baseSheetName = sheet.name
  const pageSheets: ExcelJS.Worksheet[] = [sheet]

  if (totalPages > 1) {
    sheet.name = formatSheetName(baseSheetName, 0, totalPages)

    for (let page = 1; page < totalPages; page++) {
      const cloned = cloneWorksheet(workbook, sheet, formatSheetName(baseSheetName, page, totalPages))

      pageSheets.push(cloned)
    }
  }

  // 3. 各ページ（独立シート）へデータを流し込み
  for (let page = 0; page < totalPages; page++) {
    const currentSheet = pageSheets[page]!

    for (let s = 0; s < slotsPerPage; s++) {
      const dataIndex = page * slotsPerPage + s
      const dataRow = dataIndex < totalTags ? rows[dataIndex] : null
      const slot = slots[s]

      if (!slot) continue

      for (const slotCell of slot.cells) {
        // シート複製のため行オフセット不要（常にテンプレートそのままの row, col）
        const cell = currentSheet.getRow(slotCell.row).getCell(slotCell.col)

        let cellText = cellValueToString(cell.value)

        // セル値が空、またはプレースホルダーが含まれない場合はスロットのキー定義で補完
        if (!cellText || !cellText.includes('%')) {
          cellText = slotCell.rawText || cellText
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

  // 3. バッファ書き出し
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
