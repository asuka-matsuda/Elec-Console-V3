/**
 * Excel 回路台帳エクスポート・結果書き戻しエンジン（JSZip OpenXML In-Place Patch）
 *
 * @description 元のExcelファイル（.xlsx / .xlsm）の内部XML（ZIPアーカイブ）構造を直接安全にパッチ。
 * マクロ（VBAProject）、条件付き書式、セル表示形式（numFmt）、フォント、罫線、背景色を100%温存し、
 * 試験結果・作業者・日時・備考の値のみをピンポイントで書き戻します。
 */

import fs from 'node:fs'
import path from 'node:path'

import type { Circuit } from '@prisma/client'
import type ExcelJS from 'exceljs'
import JSZip from 'jszip'

import { prisma } from '../prisma'
import { setCellStringWithNewlines } from './cellFormat'
import { type CircuitColumnMap, DEFAULT_CIRCUIT_COLUMN_MAP, makeCircuitKey } from './circuitMapping'
import { validateSafeExcelPath } from './safePath'

/**
 * セルに日時を設定し、yyyy/m/d h:mm 書式を適用する
 */
function setCellDateTime(cell: ExcelJS.Cell, date: Date | string | null | undefined): void {
  if (!date) return
  const d = date instanceof Date ? date : new Date(date)

  if (isNaN(d.getTime())) return
  cell.value = d
  cell.numFmt = 'yyyy/m/d h:mm'
}

/**
 * 回路データの各フェーズ試験結果を行セルへ書き戻す（ExcelJS行互換ユーティリティ）
 */
export function applyCircuitToRow(
  row: ExcelJS.Row,
  c: Circuit,
  colMap: CircuitColumnMap = DEFAULT_CIRCUIT_COLUMN_MAP,
) {
  // Phase 1 書戻し
  if (c.p1ConfirmedAt && c.p1Kakunin && c.p1Mashishime) {
    if (colMap.p1Worker !== undefined) {
      setCellStringWithNewlines(row.getCell(colMap.p1Worker), c.p1Worker || '確認済')
    }
    if (colMap.p1ConfirmedAt !== undefined) {
      setCellDateTime(row.getCell(colMap.p1ConfirmedAt), c.p1ConfirmedAt)
    }
  }
  if (c.p1Remarks && colMap.p1Remarks !== undefined) {
    setCellStringWithNewlines(row.getCell(colMap.p1Remarks), c.p1Remarks)
  }

  // Phase 2 書戻し
  if (c.p2ConfirmedAt || c.p2IsComplete) {
    // R相
    if (colMap.zetsuenR !== undefined) {
      if (c.p2RStatus === '良好') {
        row.getCell(colMap.zetsuenR).value = c.keiTo === '幹線' ? 500 : 100
      }
      else if (c.zetsuenR !== null && c.zetsuenR !== undefined) {
        row.getCell(colMap.zetsuenR).value = c.zetsuenR
      }
    }

    // S相
    if (colMap.zetsuenS !== undefined) {
      if (c.p2SStatus === '良好') {
        row.getCell(colMap.zetsuenS).value = c.keiTo === '幹線' ? 500 : 100
      }
      else if (c.zetsuenS !== null && c.zetsuenS !== undefined) {
        row.getCell(colMap.zetsuenS).value = c.zetsuenS
      }
    }

    // T相
    if (colMap.zetsuenT !== undefined) {
      if (c.p2TStatus === '良好') {
        row.getCell(colMap.zetsuenT).value = c.keiTo === '幹線' ? 500 : 100
      }
      else if (c.zetsuenT !== null && c.zetsuenT !== undefined) {
        row.getCell(colMap.zetsuenT).value = c.zetsuenT
      }
    }

    if (c.p2Worker && colMap.p2Worker !== undefined) {
      setCellStringWithNewlines(row.getCell(colMap.p2Worker), c.p2Worker)
    }
    if (c.p2ConfirmedAt && colMap.p2ConfirmedAt !== undefined) {
      setCellDateTime(row.getCell(colMap.p2ConfirmedAt), c.p2ConfirmedAt)
    }
    if (c.p2Remarks && colMap.p2Remarks !== undefined) {
      setCellStringWithNewlines(row.getCell(colMap.p2Remarks), c.p2Remarks)
    }
  }

  // Phase 3 書戻し
  if (c.p3ConfirmedAt) {
    if (colMap.denatsuRs !== undefined && c.denatsuRs !== null && c.denatsuRs !== undefined) {
      row.getCell(colMap.denatsuRs).value = c.denatsuRs
    }
    if (colMap.denatsuSt !== undefined && c.denatsuSt !== null && c.denatsuSt !== undefined) {
      row.getCell(colMap.denatsuSt).value = c.denatsuSt
    }
    if (colMap.denatsuRt !== undefined && c.denatsuRt !== null && c.denatsuRt !== undefined) {
      row.getCell(colMap.denatsuRt).value = c.denatsuRt
    }
    if (colMap.kensou !== undefined && c.kensou) {
      setCellStringWithNewlines(row.getCell(colMap.kensou), c.kensou)
    }
    if (colMap.p3Worker !== undefined && c.p3Worker) {
      setCellStringWithNewlines(row.getCell(colMap.p3Worker), c.p3Worker)
    }
    if (colMap.p3ConfirmedAt !== undefined) {
      setCellDateTime(row.getCell(colMap.p3ConfirmedAt), c.p3ConfirmedAt)
    }
    if (colMap.p3Remarks !== undefined && c.p3Remarks) {
      setCellStringWithNewlines(row.getCell(colMap.p3Remarks), c.p3Remarks)
    }
  }
}

interface ExportCircuitResult {
  success: boolean
  count: number
  filePath: string
  error?: string
}

export interface GeneratedExcelResult {
  buffer: Buffer
  count: number
  isXlsm: boolean
  originalFileName: string
}

// 列文字から列インデックス (1-based, "A" -> 1, "Z" -> 26, "AA" -> 27)
function lettersToColNumber(letters: string): number {
  let col = 0

  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64)
  }

  return col
}

// セルアドレス ("AJ4") から列名と行番号
function parseCellAddress(addr: string): { colLetters: string, colNumber: number, rowNumber: number } | null {
  const m = addr.match(/^([A-Z]+)([0-9]+)$/)

  if (!m || !m[1] || !m[2]) return null

  return { colLetters: m[1], colNumber: lettersToColNumber(m[1]), rowNumber: parseInt(m[2], 10) }
}

// XML 特殊文字エスケープ
function escapeXml(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return ''

  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// 日時を Excel シリアル値（JST基準）に変換
function dateToExcelSerial(date: Date | string | null | undefined): number | null {
  if (!date) return null
  const d = date instanceof Date ? date : new Date(date)

  if (isNaN(d.getTime())) return null

  const epoch = new Date(Date.UTC(1899, 11, 30))
  const tzOffsetMs = d.getTimezoneOffset() * 60 * 1000
  const localTime = d.getTime() - tzOffsetMs

  return (localTime - epoch.getTime()) / 86400000
}

type CellValuePayload
  = | { type: 'empty', value?: unknown }
    | { type: 'string', value: string | number | null | undefined }
    | { type: 'number', value: number }
    | { type: 'date', value: Date | string | null | undefined }

/**
 * 行XML文字列内の特定セルを更新または列順序を守って挿入（スタイル属性 s="..." は完全温存）
 */
function updateCellInRowXml(rowXml: string, cellAddr: string, payload: CellValuePayload): string {
  const cellRegex = new RegExp(`<c r="${cellAddr}"([^>]*?)(?:>(.*?)</c>|/>)`)
  const m = rowXml.match(cellRegex)

  let styleAttr = ''

  if (m) {
    const existingAttrs = m[1] || ''
    const styleMatch = existingAttrs.match(/\s+s="([^"]+)"/)

    if (styleMatch) {
      styleAttr = ` s="${styleMatch[1]}"`
    }
  }

  let cellXml = ''

  if (!payload || payload.type === 'empty' || payload.value === null || payload.value === undefined || payload.value === '') {
    cellXml = `<c r="${cellAddr}"${styleAttr}/>`
  }
  else if (payload.type === 'string') {
    const escaped = escapeXml(payload.value)

    cellXml = `<c r="${cellAddr}"${styleAttr} t="inlineStr"><is><t>${escaped}</t></is></c>`
  }
  else if (payload.type === 'number') {
    cellXml = `<c r="${cellAddr}"${styleAttr}><v>${payload.value}</v></c>`
  }
  else if (payload.type === 'date') {
    const serial = dateToExcelSerial(payload.value)

    if (serial !== null) {
      cellXml = `<c r="${cellAddr}"${styleAttr}><v>${serial}</v></c>`
    }
    else {
      cellXml = `<c r="${cellAddr}"${styleAttr}/>`
    }
  }

  if (m) {
    return rowXml.replace(cellRegex, cellXml)
  }

  // 行内にセルが存在しない場合、列番号の昇順位置に挿入
  const parsed = parseCellAddress(cellAddr)

  if (!parsed) return rowXml

  const targetCol = parsed.colNumber
  const allCells = [...rowXml.matchAll(/<c r="([A-Z]+)[0-9]+"/g)]

  let insertIndex = -1

  for (const match of allCells) {
    if (!match[1] || match.index === undefined) continue
    const colNum = lettersToColNumber(match[1])

    if (colNum > targetCol) {
      insertIndex = match.index
      break
    }
  }

  if (insertIndex !== -1) {
    return rowXml.slice(0, insertIndex) + cellXml + rowXml.slice(insertIndex)
  }
  else {
    const endRowIdx = rowXml.lastIndexOf('</row>')

    if (endRowIdx !== -1) {
      return rowXml.slice(0, endRowIdx) + cellXml + rowXml.slice(endRowIdx)
    }

    return rowXml
  }
}

/**
 * sharedStrings.xml から文字列配列を構築（ルビ <rPh> は除外して本体テキストのみ抽出）
 */
function parseSharedStrings(sstXml: string): string[] {
  const strings: string[] = []
  const siMatches = sstXml.matchAll(/<si>([\s\S]*?)<\/si>/g)

  for (const si of siMatches) {
    const content = si[1] || ''
    // ルビ <rPh>...</rPh> を除去
    const cleanContent = content.replace(/<rPh[\s\S]*?<\/rPh>/g, '')
    const tMatches = [...cleanContent.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]

    strings.push(tMatches.map(m => m[1] || '').join(''))
  }

  return strings
}

interface ExportColumnMap {
  p1Worker?: string
  p1ConfirmedAt?: string
  p1Remarks?: string
  zetsuenR?: string
  zetsuenS?: string
  zetsuenT?: string
  p2Worker?: string
  p2ConfirmedAt?: string
  p2Remarks?: string
  denatsuRs?: string
  denatsuSt?: string
  denatsuRt?: string
  kensou?: string
  p3Worker?: string
  p3ConfirmedAt?: string
  p3Remarks?: string
  banMeishoCol?: string
  kairoBangouCol?: string
  kairoMeishoCol?: string
  keiToCol?: string
}

/**
 * テンプレート台帳が存在しない場合の標準Excel帳票生成フォールバック
 */
async function generateFallbackCircuitsExcel(siteId: string): Promise<GeneratedExcelResult> {
  const ExcelJSModule = await import('exceljs')
  const WorkbookClass = ExcelJSModule.default?.Workbook || ExcelJSModule.Workbook
  const wb = new WorkbookClass()
  const ws = wb.addWorksheet('List')

  // ヘッダー定義
  ws.columns = [
    { header: '系統', key: 'keiTo', width: 12 },
    { header: '盤種別', key: 'banShubetsu', width: 12 },
    { header: '盤名称', key: 'banMeisho', width: 18 },
    { header: '配電方式', key: 'haidenHoushiki', width: 16 },
    { header: '相種別', key: 'souShubetsu', width: 10 },
    { header: '回路記号', key: 'kairoKigou', width: 10 },
    { header: '回路番号', key: 'kairoBangou', width: 10 },
    { header: '回路名称', key: 'kairoMeisho', width: 25 },
    { header: 'P1確認者', key: 'p1Worker', width: 14 },
    { header: 'P1確認日時', key: 'p1ConfirmedAt', width: 18 },
    { header: 'P1備考', key: 'p1Remarks', width: 20 },
    { header: '絶縁R(MΩ)', key: 'zetsuenR', width: 14 },
    { header: '絶縁S(MΩ)', key: 'zetsuenS', width: 14 },
    { header: '絶縁T(MΩ)', key: 'zetsuenT', width: 14 },
    { header: 'P2測定者', key: 'p2Worker', width: 14 },
    { header: 'P2測定日時', key: 'p2ConfirmedAt', width: 18 },
    { header: 'P2備考', key: 'p2Remarks', width: 20 },
    { header: '電圧RS(V)', key: 'denatsuRs', width: 12 },
    { header: '電圧ST(V)', key: 'denatsuSt', width: 12 },
    { header: '電圧RT(V)', key: 'denatsuRt', width: 12 },
    { header: '検相', key: 'kensou', width: 10 },
    { header: 'P3測定者', key: 'p3Worker', width: 14 },
    { header: 'P3測定日時', key: 'p3ConfirmedAt', width: 18 },
    { header: 'P3備考', key: 'p3Remarks', width: 20 },
  ]

  const circuits = await prisma.circuit.findMany({
    where: { siteId },
    orderBy: [{ excelRow: 'asc' }, { createdAt: 'asc' }],
  })

  for (const c of circuits) {
    ws.addRow({
      keiTo: c.keiTo,
      banShubetsu: c.banShubetsu,
      banMeisho: c.banMeisho,
      haidenHoushiki: c.haidenHoushiki,
      souShubetsu: c.souShubetsu,
      kairoKigou: c.kairoKigou,
      kairoBangou: c.kairoBangou,
      kairoMeisho: c.kairoMeisho,
      p1Worker: c.p1Worker || (c.p1Kakunin && c.p1Mashishime ? '確認済' : ''),
      p1ConfirmedAt: c.p1ConfirmedAt ? new Date(c.p1ConfirmedAt).toLocaleString('ja-JP') : '',
      p1Remarks: c.p1Remarks || '',
      zetsuenR: c.p2RStatus === '良好' ? '良好' : c.zetsuenR,
      zetsuenS: c.p2SStatus === '良好' ? '良好' : c.zetsuenS,
      zetsuenT: c.p2TStatus === '良好' ? '良好' : c.zetsuenT,
      p2Worker: c.p2Worker || '',
      p2ConfirmedAt: c.p2ConfirmedAt ? new Date(c.p2ConfirmedAt).toLocaleString('ja-JP') : '',
      p2Remarks: c.p2Remarks || '',
      denatsuRs: c.denatsuRs,
      denatsuSt: c.denatsuSt,
      denatsuRt: c.denatsuRt,
      kensou: c.kensou,
      p3Worker: c.p3Worker || '',
      p3ConfirmedAt: c.p3ConfirmedAt ? new Date(c.p3ConfirmedAt).toLocaleString('ja-JP') : '',
      p3Remarks: c.p3Remarks || '',
    })
  }

  const uint8 = await wb.xlsx.writeBuffer()
  const buffer = Buffer.from(uint8)

  return {
    buffer,
    count: circuits.length,
    isXlsm: false,
    originalFileName: '回路台帳.xlsx',
  }
}

/**
 * 回路データおよび最新試験結果を含むExcelファイルのバイナリバッファを生成する（OpenXML インプレースパッチ）
 */
export async function generateCircuitsExcelBuffer(
  siteId: string,
  baseFilePath?: string | null,
): Promise<GeneratedExcelResult> {
  let cleanPath = baseFilePath && typeof baseFilePath === 'string' && baseFilePath.trim()
    ? validateSafeExcelPath(baseFilePath)
    : ''

  // 1. 指定パスにファイルがない場合、.data/templates/${siteId}/ を自動検索
  if (!cleanPath || !fs.existsSync(cleanPath)) {
    const templateDir = path.resolve(process.cwd(), `.data/templates/${siteId}`)

    if (fs.existsSync(templateDir)) {
      try {
        const files = fs.readdirSync(templateDir)
        const found = files.find(f => f.toLowerCase().endsWith('.xlsm') || f.toLowerCase().endsWith('.xlsx'))

        if (found) {
          cleanPath = path.join(templateDir, found)
        }
      }
      catch (err) {
        console.warn('[circuitExport] Failed to scan template dir', err)
      }
    }
  }

  // 2. テンプレートが一切見つからない場合は標準フォーマットで動的生成
  if (!cleanPath || !fs.existsSync(cleanPath)) {
    return await generateFallbackCircuitsExcel(siteId)
  }

  const fileExt = path.extname(cleanPath).toLowerCase()
  const isXlsm = fileExt === '.xlsm'
  const originalFileName = path.basename(cleanPath)

  const rawBuffer = await fs.promises.readFile(cleanPath)
  const zip = await JSZip.loadAsync(rawBuffer)

  // 1. sharedStrings の取得
  let sharedStrings: string[] = []
  const sstFile = zip.file('xl/sharedStrings.xml')

  if (sstFile) {
    const sstXml = await sstFile.async('text')

    sharedStrings = parseSharedStrings(sstXml)
  }

  // 2. workbook.xml と workbook.xml.rels からシート一覧を取得
  const wbFile = zip.file('xl/workbook.xml')
  const wbRelsFile = zip.file('xl/_rels/workbook.xml.rels')

  if (!wbFile || !wbRelsFile) {
    throw new Error('Excelブックの構造が無効です (workbook.xml が見つかりません)')
  }

  const wbXml = await wbFile.async('text')
  const wbRelsXml = await wbRelsFile.async('text')

  // sheetName -> rId
  const sheetMatches = [...wbXml.matchAll(/<sheet\s+[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"[^>]*\/?>/g)]
  // rId -> target
  const relsMatches = [...wbRelsXml.matchAll(/<Relationship\s+[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"[^>]*\/?>/g)]
  const relsMap = new Map<string, string>()

  for (const m of relsMatches) {
    if (m[1] && m[2]) {
      relsMap.set(m[1], m[2])
    }
  }

  // 回路一覧シートの特定（"List" を最優先、なければ "回路" を含むシート、なければ最初のシート）
  let targetSheetPath = ''
  let targetSheetName = ''

  for (const s of sheetMatches) {
    const name = s[1] || ''
    const rId = s[2] || ''
    const relPath = relsMap.get(rId) || ''
    const fullPath = relPath.startsWith('/') ? relPath.slice(1) : (relPath.startsWith('xl/') ? relPath : `xl/${relPath}`)

    if (name.toLowerCase() === 'list') {
      targetSheetPath = fullPath
      targetSheetName = name
      break
    }
    if (!targetSheetPath && (name.includes('回路') || name.includes('台帳'))) {
      targetSheetPath = fullPath
      targetSheetName = name
    }
  }

  if (!targetSheetPath && sheetMatches[0]) {
    const rId = sheetMatches[0][2] || ''
    const relPath = relsMap.get(rId) || ''

    targetSheetPath = relPath.startsWith('/') ? relPath.slice(1) : (relPath.startsWith('xl/') ? relPath : `xl/${relPath}`)
    targetSheetName = sheetMatches[0][1] || ''
  }

  const targetSheetFile = zip.file(targetSheetPath)

  if (!targetSheetFile) {
    throw new Error(`回路一覧シート (${targetSheetName || 'List'}) が見つかりません: ${targetSheetPath}`)
  }

  let sheetXml = await targetSheetFile.async('text')

  // 3. ヘッダー行の走査と列マッピングの特定
  const rows = [...sheetXml.matchAll(/<row\s+r="([0-9]+)"[^>]*>([\s\S]*?)<\/row>/g)]
  let colMap: ExportColumnMap = {
    // 遠野SMC標準のデフォルトフォールバック
    p1Worker: 'AJ',
    p1ConfirmedAt: 'AK',
    p1Remarks: 'AL',
    zetsuenR: 'AM',
    zetsuenS: 'AN',
    zetsuenT: 'AO',
    p2Worker: 'AP',
    p2ConfirmedAt: 'AQ',
    p2Remarks: 'AR',
    denatsuRs: 'AS',
    denatsuSt: 'AT',
    denatsuRt: 'AU',
    kensou: 'AV',
    p3Worker: 'AX',
    p3ConfirmedAt: 'AY',
    p3Remarks: 'AZ',
    banMeishoCol: 'F',
    kairoBangouCol: 'J',
    kairoMeishoCol: 'L',
    keiToCol: 'H',
  }

  let headerRowNumber = 3

  for (const rMatch of rows.slice(0, 10)) {
    const rNum = parseInt(rMatch[1] || '0', 10)
    const rContent = rMatch[2] || ''
    const cellMatches = [...rContent.matchAll(/<c\s+r="([A-Z]+)[0-9]+"[^>]*?(?:>(.*?)<\/c>|\/>)/g)]

    const foundHeaders: Record<string, string> = {}

    for (const c of cellMatches) {
      const col = c[1] || ''
      const inner = c[2] || ''
      let text = ''

      if (inner.includes('<is><t>')) {
        const t = inner.match(/<t[^>]*>([\s\S]*?)<\/t>/)

        if (t) text = t[1] || ''
      }
      else if (inner.includes('<v>')) {
        const v = inner.match(/<v>([0-9]+)<\/v>/)

        if (v && v[1]) {
          const idx = parseInt(v[1], 10)

          text = sharedStrings[idx] || ''
        }
      }

      if (text) {
        foundHeaders[col] = text
      }
    }

    // 接続確認者、絶縁抵抗、電圧、盤名称などの見出しが含まれるか走査
    const values = Object.values(foundHeaders)
    const hasP1 = values.some(v => v.includes('接続確認者') || v.includes('確認者'))
    const hasP2 = values.some(v => v.includes('絶縁抵抗') || v.includes('絶縁'))
    const hasBan = values.some(v => v.includes('盤名称') || v.includes('分電盤'))

    if ((hasP1 && hasP2) || (hasBan && hasP1)) {
      headerRowNumber = rNum
      const dynamicMap: ExportColumnMap = { ...colMap }

      for (const [col, title] of Object.entries(foundHeaders)) {
        if (title.includes('接続確認者') || (title.includes('確認者') && !title.includes('日時'))) dynamicMap.p1Worker = col
        else if (title.includes('確認日時') && !title.includes('P2') && !title.includes('P3')) dynamicMap.p1ConfirmedAt = col
        else if (title.includes('備考1') || title.includes('P1備考')) dynamicMap.p1Remarks = col
        else if (title.includes('絶縁抵抗R') || title.includes('P2(R)')) dynamicMap.zetsuenR = col
        else if (title.includes('絶縁抵抗S') || title.includes('P2(S)')) dynamicMap.zetsuenS = col
        else if (title.includes('絶縁抵抗T') || title.includes('P2(T)')) dynamicMap.zetsuenT = col
        else if (title.includes('絶縁抵抗測定者') || title.includes('P2測定者')) dynamicMap.p2Worker = col
        else if (title.includes('絶縁抵抗測定日時') || title.includes('絶縁測定日時')) dynamicMap.p2ConfirmedAt = col
        else if (title.includes('備考2') || title.includes('P2備考')) dynamicMap.p2Remarks = col
        else if (title.includes('電圧RS') || title.includes('P3(RS)')) dynamicMap.denatsuRs = col
        else if (title.includes('電圧ST') || title.includes('P3(ST)')) dynamicMap.denatsuSt = col
        else if (title.includes('電圧RT') || title.includes('P3(RT)')) dynamicMap.denatsuRt = col
        else if (title.includes('確認') || title.includes('検相')) dynamicMap.kensou = col
        else if (title.includes('電圧測定者') || title.includes('P3測定者')) dynamicMap.p3Worker = col
        else if (title.includes('電圧測定日時') || title.includes('P3測定日時')) dynamicMap.p3ConfirmedAt = col
        else if (title.includes('備考3') || title.includes('P3備考')) dynamicMap.p3Remarks = col
        else if (title.includes('盤名称') || title.includes('盤名')) dynamicMap.banMeishoCol = col
        else if (title.includes('回路番号') || title.includes('回路No')) dynamicMap.kairoBangouCol = col
        else if (title.includes('回路名称') || title.includes('回路名')) dynamicMap.kairoMeishoCol = col
        else if (title.includes('幹線判定') || title.includes('系統')) dynamicMap.keiToCol = col
      }

      colMap = dynamicMap
      break
    }
  }

  // 4. DB から現場回路を取得
  const circuits = await prisma.circuit.findMany({
    where: { siteId },
    orderBy: [
      { excelRow: 'asc' },
      { createdAt: 'asc' },
    ],
  })

  // excelRow マップおよび複合キーマップの構築
  const circuitByRow = new Map<number, Circuit>()
  const circuitByKey = new Map<string, Circuit[]>()

  for (const c of circuits) {
    if (c.excelRow) {
      circuitByRow.set(c.excelRow, c)
    }
    const key = makeCircuitKey(c.keiTo, c.banMeisho, c.kairoBangou, c.kairoMeisho)
    const list = circuitByKey.get(key) || []

    list.push(c)
    circuitByKey.set(key, list)
  }

  // 5. シートXMLの各行を安全に更新
  let updatedCount = 0

  sheetXml = sheetXml.replace(/<row\s+r="([0-9]+)"([^>]*?)>([\s\S]*?)<\/row>/g, (fullRowXml, rNumStr, _rowAttrs, rowInner) => {
    const rowNumber = parseInt(rNumStr, 10)

    if (rowNumber <= headerRowNumber) return fullRowXml

    // 照合する Circuit を特定
    let targetCircuit = circuitByRow.get(rowNumber)

    if (!targetCircuit) {
      // 複合キーによるフォールバック照合
      // 行内の盤名・回路名等を取得
      const getCellVal = (col: string | undefined): string => {
        if (!col) return ''
        const m = rowInner.match(new RegExp(`<c\\s+r="${col}${rowNumber}"[^>]*?(?:>(.*?)<\\/c>|\\/>)`))

        if (!m || !m[1]) return ''
        const inner = m[1]

        if (inner.includes('<is><t>')) {
          const t = inner.match(/<t[^>]*>([\s\S]*?)<\/t>/)

          return t ? t[1] || '' : ''
        }
        if (inner.includes('<v>')) {
          const v = inner.match(/<v>([0-9]+)<\/v>/)

          if (v && v[1]) {
            return sharedStrings[parseInt(v[1], 10)] || ''
          }
        }

        return ''
      }

      const ban = getCellVal(colMap.banMeishoCol)
      const num = getCellVal(colMap.kairoBangouCol)
      const name = getCellVal(colMap.kairoMeishoCol)
      const keiToVal = getCellVal(colMap.keiToCol)
      const keiTo = keiToVal.includes('幹線') || keiToVal === '1' || keiToVal.toLowerCase() === 'true' ? '幹線' : '二次側'

      const key = makeCircuitKey(keiTo, ban, num, name)
      const candidates = circuitByKey.get(key)

      if (candidates && candidates.length > 0) {
        targetCircuit = candidates.shift()!
      }
    }

    if (!targetCircuit) return fullRowXml

    let rowXml = fullRowXml
    const c = targetCircuit

    // Phase 1 書戻し
    if (colMap.p1Worker) {
      if (c.p1ConfirmedAt && c.p1Kakunin && c.p1Mashishime) {
        rowXml = updateCellInRowXml(rowXml, `${colMap.p1Worker}${rowNumber}`, {
          type: 'string',
          value: c.p1Worker || '確認済',
        })
      }
    }
    if (colMap.p1ConfirmedAt) {
      if (c.p1ConfirmedAt && c.p1Kakunin && c.p1Mashishime) {
        rowXml = updateCellInRowXml(rowXml, `${colMap.p1ConfirmedAt}${rowNumber}`, {
          type: 'date',
          value: c.p1ConfirmedAt,
        })
      }
    }
    if (colMap.p1Remarks && c.p1Remarks) {
      rowXml = updateCellInRowXml(rowXml, `${colMap.p1Remarks}${rowNumber}`, {
        type: 'string',
        value: c.p1Remarks,
      })
    }

    // Phase 2 書戻し
    if (c.p2ConfirmedAt || c.p2IsComplete) {
      // R相
      if (colMap.zetsuenR) {
        if (c.p2RStatus === '良好') {
          const defVal = c.keiTo === '幹線' ? 500 : 100

          rowXml = updateCellInRowXml(rowXml, `${colMap.zetsuenR}${rowNumber}`, { type: 'number', value: defVal })
        }
        else if (c.zetsuenR !== null && c.zetsuenR !== undefined) {
          rowXml = updateCellInRowXml(rowXml, `${colMap.zetsuenR}${rowNumber}`, { type: 'number', value: c.zetsuenR })
        }
      }
      // S相
      if (colMap.zetsuenS) {
        if (c.p2SStatus === '良好') {
          const defVal = c.keiTo === '幹線' ? 500 : 100

          rowXml = updateCellInRowXml(rowXml, `${colMap.zetsuenS}${rowNumber}`, { type: 'number', value: defVal })
        }
        else if (c.zetsuenS !== null && c.zetsuenS !== undefined) {
          rowXml = updateCellInRowXml(rowXml, `${colMap.zetsuenS}${rowNumber}`, { type: 'number', value: c.zetsuenS })
        }
      }
      // T相
      if (colMap.zetsuenT) {
        if (c.p2TStatus === '良好') {
          const defVal = c.keiTo === '幹線' ? 500 : 100

          rowXml = updateCellInRowXml(rowXml, `${colMap.zetsuenT}${rowNumber}`, { type: 'number', value: defVal })
        }
        else if (c.zetsuenT !== null && c.zetsuenT !== undefined) {
          rowXml = updateCellInRowXml(rowXml, `${colMap.zetsuenT}${rowNumber}`, { type: 'number', value: c.zetsuenT })
        }
      }

      if (colMap.p2Worker && c.p2Worker) {
        rowXml = updateCellInRowXml(rowXml, `${colMap.p2Worker}${rowNumber}`, {
          type: 'string',
          value: c.p2Worker,
        })
      }
      if (colMap.p2ConfirmedAt && c.p2ConfirmedAt) {
        rowXml = updateCellInRowXml(rowXml, `${colMap.p2ConfirmedAt}${rowNumber}`, {
          type: 'date',
          value: c.p2ConfirmedAt,
        })
      }
      if (colMap.p2Remarks && c.p2Remarks) {
        rowXml = updateCellInRowXml(rowXml, `${colMap.p2Remarks}${rowNumber}`, {
          type: 'string',
          value: c.p2Remarks,
        })
      }
    }

    // Phase 3 書戻し
    if (c.p3ConfirmedAt) {
      if (colMap.denatsuRs && c.denatsuRs !== null && c.denatsuRs !== undefined) {
        rowXml = updateCellInRowXml(rowXml, `${colMap.denatsuRs}${rowNumber}`, { type: 'number', value: c.denatsuRs })
      }
      if (colMap.denatsuSt && c.denatsuSt !== null && c.denatsuSt !== undefined) {
        rowXml = updateCellInRowXml(rowXml, `${colMap.denatsuSt}${rowNumber}`, { type: 'number', value: c.denatsuSt })
      }
      if (colMap.denatsuRt && c.denatsuRt !== null && c.denatsuRt !== undefined) {
        rowXml = updateCellInRowXml(rowXml, `${colMap.denatsuRt}${rowNumber}`, { type: 'number', value: c.denatsuRt })
      }
      if (colMap.kensou && c.kensou) {
        rowXml = updateCellInRowXml(rowXml, `${colMap.kensou}${rowNumber}`, { type: 'string', value: c.kensou })
      }
      if (colMap.p3Worker && c.p3Worker) {
        rowXml = updateCellInRowXml(rowXml, `${colMap.p3Worker}${rowNumber}`, { type: 'string', value: c.p3Worker })
      }
      if (colMap.p3ConfirmedAt) {
        rowXml = updateCellInRowXml(rowXml, `${colMap.p3ConfirmedAt}${rowNumber}`, { type: 'date', value: c.p3ConfirmedAt })
      }
      if (colMap.p3Remarks && c.p3Remarks) {
        rowXml = updateCellInRowXml(rowXml, `${colMap.p3Remarks}${rowNumber}`, { type: 'string', value: c.p3Remarks })
      }
    }

    updatedCount++

    return rowXml
  })

  // 更新したシートXMLを ZIP に書き戻す
  zip.file(targetSheetPath, sheetXml)

  // 6. ZIP バイナリの生成（全マクロ・リレーションをそのまま出力）
  const outBuf = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  return {
    buffer: outBuf,
    count: updatedCount,
    isXlsm,
    originalFileName,
  }
}

/**
 * Web上の最新試験結果を元Excelファイルに直接書き戻す（エクスポート）
 */
export async function exportCircuitsToExcel(
  siteId: string,
  rawFilePath: string,
  workerName: string = 'システム管理者',
): Promise<ExportCircuitResult> {
  const filePath = validateSafeExcelPath(rawFilePath)

  if (!fs.existsSync(filePath)) {
    throw new Error(`Excelファイルが見つかりません: ${filePath}`)
  }

  const { buffer, count } = await generateCircuitsExcelBuffer(siteId, filePath)

  await fs.promises.writeFile(filePath, buffer)

  await prisma.operationLog.create({
    data: {
      siteId,
      worker: workerName,
      action: 'Excel書戻し',
      targetBan: '全体',
      targetKairo: '一括書戻し',
      details: `Excel(${filePath})へ${count}件の最新試験結果を安全に書き戻しました（マクロ・書式を完全保護）`,
    },
  })

  return {
    success: true,
    count,
    filePath,
  }
}
