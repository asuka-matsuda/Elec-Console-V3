/**
 * タグ・線名札 Excel 帳票生成エンジン
 *
 * @description 取り込んだ回路台帳Excelからテーブル見出しを動的に取得し、
 * A4定型タグテンプレート（複数面配置）へデータを流し込みます。
 * 1ページの枠数を超えた場合は自動で改ページ・ブロック複製を行い、余剰枠のキーはクリアします。
 */
import ExcelJS from 'exceljs'

import type { CircuitItem } from '#shared/types/circuit'
import {
  cellValueToString,
  normalizeHeaderName,
} from '#shared/utils/excelNormalize'

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
  /** 盤名称 */
  banMeisho: string
  /** 系統種別 (幹線 / 二次) */
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
  keys: string[]
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
  /** 現場名（ファイル名・プレースホルダー用） */
  siteName?: string
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
 * 主要な列エイリアスマップ（動的見出しと標準キーの相互補完用）
 */
const STANDARD_ALIASES: Record<string, string[]> = {
  盤名称: ['盤名', '分電盤名称', '盤名称', 'banmeisho'],
  盤種別: ['盤種別', '種別', 'banshubetsu'],
  系統: ['系統', 'keito'],
  幹線判定: ['幹線判定', '幹線/二次側', '区分'],
  回路番号: ['回路番号', '回路no', '回路no.', 'kairobangou'],
  回路記号: ['回路記号', 'kairokigou'],
  回路名称: ['回路名称', '回路名', '負荷名称', 'kairomeisho'],
  配電方式: ['配電方式', 'haidenhoushiki'],
  相種別: ['相種別', 'soushubetsu'],
  遮断器種別: ['遮断器種別', 'shudankishubetsu'],
  遮断器容量: ['遮断器容量', '遮断器サイズ', '定格容量', '配電盤遮断器容量', 'shadankiyouryou'],
  ケーブル: ['ケーブル', 'ケーブルサイズ', 'ケーブルリスト', 'ｹｰﾌﾞﾙﾘｽﾄ', '電線', 'cablelist'],
  配線条数: ['配線条数', 'haisenjousuu'],
  接地有無: ['接地有無', 'setsujiumu'],
  接地種別: ['接地種別', '接地リスト', '接地ﾘｽﾄ', '接地', 'setsujilist'],
}

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

  // 2. ヘッダー行の検出（標準見出し語との一致スコアを優先し、同点ならセル数、最初の候補を採用）
  const allAliases = new Set<string>()

  for (const list of Object.values(STANDARD_ALIASES)) {
    for (const a of list) {
      allAliases.add(normalizeHeaderName(a))
    }
  }

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

        if (allAliases.has(norm)) {
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

    // 盤名称・系統・回路番号・回路名称の特定（標準エイリアス照合）
    const findValue = (aliases: string[]): string => {
      for (const [colName, val] of Object.entries(values)) {
        const norm = normalizeHeaderName(colName)

        for (const a of aliases) {
          if (norm === normalizeHeaderName(a)) {
            return val
          }
        }
      }

      return ''
    }

    const banMeisho = findValue(STANDARD_ALIASES['盤名称'] || []) || '未分類'
    const kansenHanteiRaw = findValue(STANDARD_ALIASES['幹線判定'] || [])
    let keiTo: string

    if (kansenHanteiRaw) {
      const isKansen = kansenHanteiRaw === 'true' || kansenHanteiRaw === '1' || kansenHanteiRaw.includes('幹線')

      keiTo = isKansen ? '幹線' : '二次'
    }
    else {
      const rawKeiTo = findValue(STANDARD_ALIASES['系統'] || [])

      keiTo = rawKeiTo.includes('幹線') ? '幹線' : '二次'
    }
    const kairoBangou = findValue(STANDARD_ALIASES['回路番号'] || [])
    const kairoMeisho = findValue(STANDARD_ALIASES['回路名称'] || [])

    // サンプル値の更新（ヘッダープレビュー用）
    headers.forEach((h) => {
      if (!h.sampleValue && values[h.key]) {
        h.sampleValue = values[h.key]
      }
    })

    rows.push({
      banMeisho,
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
  siteName: string = '',
): { headers: DynamicTagField[], rows: DynamicCircuitRow[] } {
  const standardKeys = [
    '現場名',
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
  ]

  const headers: DynamicTagField[] = standardKeys.map((key, idx) => ({
    key,
    tag: `%${key}%`,
    colIndex: idx + 1,
  }))

  const rows: DynamicCircuitRow[] = circuits.map((c) => {
    const values: Record<string, string> = {
      現場名: siteName,
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
      ケーブルサイズ: c.cableList || '',
      配線条数: c.haisenJousuu || '',
      接地有無: c.setsuchiUmu || '',
      接地種別: c.setsuchiList || '',
    }

    return {
      banMeisho: c.banMeisho || '未分類',
      keiTo: c.keiTo || '二次',
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
        const keys = matches.map(m => m.slice(1, -1).trim())

        placeholderCells.push({
          row: rowNumber,
          col: colNumber,
          rawText: text,
          keys,
        })
      }
    })
  })

  if (placeholderCells.length === 0) {
    return { slots: [], pageHeight: maxRow }
  }

  // 1. 各キーの出現回数を集計し、スロット数（枠数）を推定
  const keyCountMap = new Map<string, number>()

  placeholderCells.forEach((c) => {
    c.keys.forEach((k) => {
      keyCountMap.set(k, (keyCountMap.get(k) || 0) + 1)
    })
  })

  // 最も出現回数の多いキーをアンカーとする
  let anchorKey = ''
  let estimatedSlotCount = 1

  keyCountMap.forEach((count, key) => {
    if (count > estimatedSlotCount) {
      estimatedSlotCount = count
      anchorKey = key
    }
  })

  // アンカーセル一覧
  const anchorCells = placeholderCells.filter(c => c.keys.includes(anchorKey))

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
  const nonAnchorCells = placeholderCells.filter(c => !c.keys.includes(anchorKey))

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
 */
export function resolveValueOfKey(row: DynamicCircuitRow, key: string, siteName: string = ''): string {
  // 1. 完全一致
  if (row.values[key] !== undefined) {
    return row.values[key]
  }

  // 2. 現場名
  if (key === '現場名' || key === 'siteName') {
    return siteName
  }

  // 3. 正規化一致
  const normKey = normalizeHeaderName(key)

  for (const [k, v] of Object.entries(row.values)) {
    if (normalizeHeaderName(k) === normKey) {
      return v
    }
  }

  // 4. 標準エイリアスからのフォールバック
  for (const [stdName, aliases] of Object.entries(STANDARD_ALIASES)) {
    const isTarget = normalizeHeaderName(stdName) === normKey
      || aliases.some(a => normalizeHeaderName(a) === normKey)

    if (isTarget) {
      // row.values 内のエイリアスを探索
      for (const a of [stdName, ...aliases]) {
        for (const [k, v] of Object.entries(row.values)) {
          if (normalizeHeaderName(k) === normalizeHeaderName(a)) {
            return v
          }
        }
      }
      // ショートカットプロパティ
      if (stdName === '盤名称' && row.banMeisho) return row.banMeisho
      if (stdName === '系統' && row.keiTo) return row.keiTo
      if (stdName === '回路番号' && row.kairoBangou) return row.kairoBangou
      if (stdName === '回路名称' && row.kairoMeisho) return row.kairoMeisho
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
            return resolveValueOfKey(dataRow, key.trim(), siteName)
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
