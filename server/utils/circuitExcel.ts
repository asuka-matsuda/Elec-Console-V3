/**
 * 送電回路 Excel インポート・エクスポートコアユーティリティ
 *
 * 現場回路リスト（Exceljs）のスマートマージ読込、セル書式設定および安全なファイルパス検証を提供します。
 */

import fs from 'node:fs'
import path from 'node:path'

import type { Circuit, Prisma } from '@prisma/client'
import ExcelJS from 'exceljs'

import { prisma } from './prisma'

/**
 * Excelファイルパスの安全性を検証する (パストラバーサル・任意ファイル上書き防止)
 */
export function validateSafeExcelPath(rawPath: string): string {
  if (!rawPath || typeof rawPath !== 'string') {
    throw new Error('ファイルパスが指定されていません')
  }

  const cleaned = rawPath.trim().replace(/^["']+|["']+$/g, '').trim()

  if (!cleaned) {
    throw new Error('ファイルパスが空です')
  }

  // 拡張子チェック (.xlsx または .xlsm のみ許可)
  const ext = path.extname(cleaned).toLowerCase()

  if (ext !== '.xlsx' && ext !== '.xlsm') {
    throw new Error('Excelファイル形式（.xlsx または .xlsm）のみ指定可能です')
  }

  // パストラバーサル (..) の禁止
  if (cleaned.includes('..')) {
    throw new Error('パストラバーサル（..）を含むファイルパスは指定できません')
  }

  // Windows / UNIX の禁止文字・制御文字チェック
  const hasInvalidChars = /[*?"<>|]/.test(cleaned) || cleaned.split('').some(c => c.charCodeAt(0) < 32)

  if (hasInvalidChars) {
    throw new Error('ファイルパスに使用できない無効な文字が含まれています')
  }

  const normalized = path.normalize(cleaned)
  const normalizedLower = normalized.toLowerCase()

  // 機密ディレクトリやシステムフォルダへのアクセス禁止
  const forbiddenSegments = [
    '\\.git',
    '/\\.git',
    '\\node_modules',
    '/node_modules',
    '\\.env',
    '/\\.env',
    '\\prisma',
    '/prisma',
    '\\server',
    '/server',
    '\\windows',
    '\\system32',
    '/etc',
    '/usr',
    '/bin',
    '/sbin',
  ]

  for (const seg of forbiddenSegments) {
    if (normalizedLower.includes(seg)) {
      throw new Error(`セキュリティ上の理由から、指定されたパスへのアクセスは許可されていません: ${seg}`)
    }
  }

  return normalized
}

export interface ImportCircuitResult {
  success: boolean
  count: number
  createdCount?: number
  updatedCount?: number
  keptCount?: number
  deletedCount?: number
  error?: string
}

export interface ExportCircuitResult {
  success: boolean
  count: number
  filePath: string
  error?: string
}

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

function isKansen(v: unknown): string {
  if (v === true || String(v).trim().toLowerCase() === 'true' || String(v).trim() === '1') {
    return '幹線'
  }

  if (typeof v === 'string' && v.includes('幹線')) {
    return '幹線'
  }

  return '二次側'
}

function parseP2Value(valRaw: unknown, keiTo: string) {
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

export interface CircuitColumnMap {
  banMeisho: number
  banShubetsu: number
  haidenHoushiki: number
  souShubetsu: number
  shadankiShubetsu: number
  shadankiYouryou: number
  kairoKigou: number
  kairoBangou: number
  kairoMeisho: number
  cableList: number
  haisenJousuu: number
  setsuchiUmu: number
  setsuchiList: number
  keiTo: number
  p1Worker: number
  p1Remarks: number
  zetsuenR: number
  zetsuenS: number
  zetsuenT: number
  p2Worker: number
  p2Remarks: number
  denatsuRs: number
  denatsuSt: number
  denatsuRt: number
  kensou: number
  p3Worker: number
  p3Remarks: number
}

export const DEFAULT_CIRCUIT_COLUMN_MAP: CircuitColumnMap = {
  banMeisho: 5,
  banShubetsu: 6,
  haidenHoushiki: 7,
  souShubetsu: 9,
  shadankiShubetsu: 10,
  shadankiYouryou: 11,
  kairoKigou: 12,
  kairoBangou: 13,
  kairoMeisho: 14,
  cableList: 15,
  haisenJousuu: 16,
  setsuchiUmu: 17,
  setsuchiList: 18,
  keiTo: 22,
  p1Worker: 24,
  p1Remarks: 25,
  zetsuenR: 26,
  zetsuenS: 27,
  zetsuenT: 28,
  p2Worker: 29,
  p2Remarks: 30,
  denatsuRs: 31,
  denatsuSt: 32,
  denatsuRt: 33,
  kensou: 34,
  p3Worker: 35,
  p3Remarks: 36,
}

export const STANDARD_HEADER_NAMES: Record<keyof CircuitColumnMap, string> = {
  banMeisho: '盤名称',
  banShubetsu: '盤種別',
  haidenHoushiki: '配電方式',
  souShubetsu: '相種別',
  shadankiShubetsu: '遮断器種別',
  shadankiYouryou: '遮断器容量',
  kairoKigou: '回路記号',
  kairoBangou: '回路番号',
  kairoMeisho: '回路名称',
  cableList: 'ケーブル',
  haisenJousuu: '配線条数',
  setsuchiUmu: '接地有無',
  setsuchiList: '接地種別',
  keiTo: '幹線/二次側',
  p1Worker: 'P1確認者',
  p1Remarks: 'P1備考',
  zetsuenR: 'P2(R)',
  zetsuenS: 'P2(S)',
  zetsuenT: 'P2(T)',
  p2Worker: 'P2測定者',
  p2Remarks: 'P2備考',
  denatsuRs: 'P3(RS)',
  denatsuSt: 'P3(ST)',
  denatsuRt: 'P3(RT)',
  kensou: '検相',
  p3Worker: 'P3測定者',
  p3Remarks: 'P3備考',
}

/**
 * ワークシートのヘッダー行から見出し文字を直接取得し、列番号マップを構築する
 */
export function detectCircuitColumns(sheet: ExcelJS.Worksheet): {
  colMap: CircuitColumnMap
  headerMap: Map<string, number>
  headerRowNumber: number
  dataStartRowNumber: number
} {
  let bestHeaderRow = 4
  let maxMatches = 0
  let bestHeaderMap = new Map<string, number>()

  const scanLimit = Math.min(sheet.rowCount || 10, 10)
  const standardNames = new Set(Object.values(STANDARD_HEADER_NAMES))

  for (let r = 1; r <= scanLimit; r++) {
    const row = sheet.getRow(r)
    const currentMap = new Map<string, number>()
    let matchCount = 0

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const name = cell.value != null ? String(cell.value).trim() : ''

      if (!name) return

      currentMap.set(name, colNumber)

      if (standardNames.has(name)) {
        matchCount++
      }
    })

    if (matchCount > maxMatches) {
      maxMatches = matchCount
      bestHeaderRow = r
      bestHeaderMap = currentMap
    }
  }

  // 見出し名から直接列番号を決定（未検知項目はデフォルト列番号でフォールバック）
  const colMap: CircuitColumnMap = { ...DEFAULT_CIRCUIT_COLUMN_MAP }

  for (const [key, headerName] of Object.entries(STANDARD_HEADER_NAMES) as [keyof CircuitColumnMap, string][]) {
    const colNumber = bestHeaderMap.get(headerName)

    if (colNumber !== undefined) {
      colMap[key] = colNumber
    }
  }

  return {
    colMap,
    headerMap: bestHeaderMap,
    headerRowNumber: bestHeaderRow,
    dataStartRowNumber: bestHeaderRow + 1,
  }
}

export function makeCircuitKey(
  keiTo: string,
  banMeisho: string,
  kairoBangou: string | null | undefined,
  kairoMeisho: string | null | undefined,
): string {
  const norm = (s: string | null | undefined) => normalizeNewlines(s || '')

  return `${norm(keiTo)}::${norm(banMeisho)}::${norm(kairoBangou)}::${norm(kairoMeisho)}`
}

/**
 * Excelファイルまたはバッファから回路情報を取り込む（差分同期 または 初期化取込）
 *
 * mode === 'merge': Webで入力された試験結果（Phase 1〜3）を100%保護し、Excel側の設計情報変更や行追加のみを安全にマージ
 * mode === 'reset': 既存回路を全削除し、Excelからまっさらに作り直す
 */
export async function importCircuitsFromExcel(
  siteId: string,
  rawSource: string | Buffer,
  workerName: string = 'システム管理者',
  mode: 'merge' | 'reset' = 'merge',
  fileNameHint?: string,
): Promise<ImportCircuitResult> {
  const isBuffer = Buffer.isBuffer(rawSource)
  const filePath = typeof rawSource === 'string' && rawSource.trim() ? validateSafeExcelPath(rawSource) : ''
  const sourceLabel = isBuffer ? (fileNameHint ? `ファイル「${fileNameHint}」` : 'アップロードExcel') : `Excel(${filePath})`

  if (!isBuffer && !fs.existsSync(filePath)) {
    throw new Error(`Excelファイルが見つかりません: ${filePath}`)
  }

  const workbook = new ExcelJS.Workbook()

  if (isBuffer) {
    await workbook.xlsx.load(rawSource as unknown as ExcelJS.Buffer)
  }
  else {
    await workbook.xlsx.readFile(filePath)
  }

  const sheet = workbook.getWorksheet('回路ﾘｽﾄ') || workbook.worksheets[0]

  if (!sheet) {
    throw new Error('ワークブックにシートが見つかりません')
  }

  // ヘッダー行を動的走査して列マップを構築
  const { colMap, dataStartRowNumber } = detectCircuitColumns(sheet)
  const parsedCircuits: Prisma.CircuitCreateManyInput[] = []

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber < dataStartRowNumber) return

    const banMeisho = getCellString(row, colMap.banMeisho)
    const kairoMeisho = getCellString(row, colMap.kairoMeisho)
    const kairoBangou = getCellString(row, colMap.kairoBangou)

    // 盤名称も回路名称も回路番号も無い空行はスキップ
    if (!banMeisho && !kairoMeisho && !kairoBangou) {
      return
    }

    const kansenRaw = row.getCell(colMap.keiTo).value
    const keiTo = isKansen(kansenRaw)

    const rawShubetsu = getCellString(row, colMap.banShubetsu)
    const banShubetsu = rawShubetsu || (keiTo === '幹線' ? '幹線' : 'その他')

    const rRaw = row.getCell(colMap.zetsuenR).value
    const sRaw = row.getCell(colMap.zetsuenS).value
    const tRaw = row.getCell(colMap.zetsuenT).value

    const rData = parseP2Value(rRaw, keiTo)
    const sData = parseP2Value(sRaw, keiTo)
    const tData = parseP2Value(tRaw, keiTo)

    const p1Worker = getCellString(row, colMap.p1Worker) || null
    const p2Worker = getCellString(row, colMap.p2Worker) || null
    const p3Worker = getCellString(row, colMap.p3Worker) || null

    const vRs = parseFloat(getCellString(row, colMap.denatsuRs)) || null
    const vSt = parseFloat(getCellString(row, colMap.denatsuSt)) || null
    const vRt = parseFloat(getCellString(row, colMap.denatsuRt)) || null
    const kensou = getCellString(row, colMap.kensou) || null

    parsedCircuits.push({
      siteId,
      excelRow: rowNumber,
      keiTo,
      banShubetsu,
      banMeisho: banMeisho || '未分類',
      haidenHoushiki: getCellString(row, colMap.haidenHoushiki) || null,
      souShubetsu: getCellString(row, colMap.souShubetsu) || null,
      shadankiShubetsu: getCellString(row, colMap.shadankiShubetsu) || null,
      shadankiYouryou: getCellString(row, colMap.shadankiYouryou) || null,
      kairoKigou: getCellString(row, colMap.kairoKigou) || null,
      kairoBangou: kairoBangou || null,
      kairoMeisho: kairoMeisho || null,
      cableList: getCellString(row, colMap.cableList) || null,
      haisenJousuu: getCellString(row, colMap.haisenJousuu) || null,
      setsuchiUmu: getCellString(row, colMap.setsuchiUmu) || null,
      setsuchiList: getCellString(row, colMap.setsuchiList) || null,

      p1Kakunin: Boolean(p1Worker),
      p1Mashishime: Boolean(p1Worker),
      p1Worker,
      p1ConfirmedAt: p1Worker ? new Date() : null,
      p1Remarks: getCellString(row, colMap.p1Remarks) || null,
      p1ModifiedFields: '[]',

      zetsuenR: rData.value,
      zetsuenS: sData.value,
      zetsuenT: tData.value,
      p2RStatus: rData.status,
      p2SStatus: sData.status,
      p2TStatus: tData.status,
      p2Worker,
      p2ConfirmedAt: p2Worker ? new Date() : null,
      p2Remarks: getCellString(row, colMap.p2Remarks) || null,
      p2IsComplete: Boolean(p2Worker),

      denatsuRs: vRs,
      denatsuSt: vSt,
      denatsuRt: vRt,
      kensou,
      p3Worker,
      p3ConfirmedAt: p3Worker ? new Date() : null,
      p3Remarks: getCellString(row, colMap.p3Remarks) || null,
      p3IsComplete: Boolean(p3Worker),
    })
  })

  if (mode === 'reset') {
    // 完全初期化（全件削除して新規作成）
    await prisma.$transaction([
      prisma.circuit.deleteMany({ where: { siteId } }),
      prisma.circuit.createMany({ data: parsedCircuits }),
      prisma.operationLog.create({
        data: {
          siteId,
          worker: workerName,
          action: 'Excel初期化取込',
          targetBan: '全体',
          targetKairo: '一括取込',
          details: `${sourceLabel}から${parsedCircuits.length}件の回路情報を初期化取り込みしました`,
        },
      }),
      ...(filePath
        ? [
            prisma.siteSettings.upsert({
              where: { siteId },
              create: { siteId, excelPath: filePath },
              update: { excelPath: filePath },
            }),
          ]
        : []),
    ])

    return {
      success: true,
      count: parsedCircuits.length,
      createdCount: parsedCircuits.length,
      updatedCount: 0,
    }
  }

  // mode === 'merge': 差分同期（スマートマージ）
  const existingCircuits = await prisma.circuit.findMany({
    where: { siteId },
  })

  // 複合キーによるマップ構築（同名・同番号の予備などは配列で管理し出現順に照合）
  const existingMap = new Map<string, Circuit[]>()

  for (const c of existingCircuits) {
    const key = makeCircuitKey(c.keiTo, c.banMeisho, c.kairoBangou, c.kairoMeisho)
    const list = existingMap.get(key) || []

    list.push(c)
    existingMap.set(key, list)
  }

  const createdCircuits: Prisma.CircuitCreateManyInput[] = []
  const updatedCircuits: { id: string, data: Prisma.CircuitUpdateInput }[] = []
  const matchedExistingIds = new Set<string>()

  for (const item of parsedCircuits) {
    const key = makeCircuitKey(item.keiTo, item.banMeisho, item.kairoBangou, item.kairoMeisho)
    const candidates = existingMap.get(key)
    const existing = candidates && candidates.length > 0 ? candidates.shift()! : null

    if (existing) {
      matchedExistingIds.add(existing.id)

      // Web側で入力された試験結果は最優先で保持。Web側が未入力でExcel側に値がある場合のみ補完
      updatedCircuits.push({
        id: existing.id,
        data: {
          excelRow: item.excelRow,
          banShubetsu: item.banShubetsu,
          haidenHoushiki: item.haidenHoushiki,
          souShubetsu: item.souShubetsu,
          shadankiShubetsu: item.shadankiShubetsu,
          shadankiYouryou: item.shadankiYouryou,
          kairoKigou: item.kairoKigou,
          cableList: item.cableList,
          haisenJousuu: item.haisenJousuu,
          setsuchiUmu: item.setsuchiUmu,
          setsuchiList: item.setsuchiList,

          // Phase 1
          p1Kakunin: existing.p1Kakunin || item.p1Kakunin,
          p1Mashishime: existing.p1Mashishime || item.p1Mashishime,
          p1Worker: existing.p1Worker || item.p1Worker,
          p1ConfirmedAt: existing.p1ConfirmedAt || item.p1ConfirmedAt,
          p1Remarks: existing.p1Remarks || item.p1Remarks,

          // Phase 2
          zetsuenR: existing.zetsuenR ?? item.zetsuenR,
          zetsuenS: existing.zetsuenS ?? item.zetsuenS,
          zetsuenT: existing.zetsuenT ?? item.zetsuenT,
          p2RStatus: existing.p2RStatus ?? item.p2RStatus,
          p2SStatus: existing.p2SStatus ?? item.p2SStatus,
          p2TStatus: existing.p2TStatus ?? item.p2TStatus,
          p2Worker: existing.p2Worker || item.p2Worker,
          p2ConfirmedAt: existing.p2ConfirmedAt || item.p2ConfirmedAt,
          p2Remarks: existing.p2Remarks || item.p2Remarks,
          p2IsComplete: existing.p2IsComplete || item.p2IsComplete,

          // Phase 3
          denatsuRs: existing.denatsuRs ?? item.denatsuRs,
          denatsuSt: existing.denatsuSt ?? item.denatsuSt,
          denatsuRt: existing.denatsuRt ?? item.denatsuRt,
          kensou: existing.kensou || item.kensou,
          p3Worker: existing.p3Worker || item.p3Worker,
          p3ConfirmedAt: existing.p3ConfirmedAt || item.p3ConfirmedAt,
          p3Remarks: existing.p3Remarks || item.p3Remarks,
          p3IsComplete: existing.p3IsComplete || item.p3IsComplete,
        },
      })
    }
    else {
      // Excelの途中に差し込まれた新しい回路、または末尾の新規回路
      createdCircuits.push(item)
    }
  }

  // Excel側に存在しなくなった回路の判定（作業データがあるものは安全のため保持、完全未着手のもののみ削除）
  const unmatchedExisting = existingCircuits.filter(c => !matchedExistingIds.has(c.id))
  const deleteIds: string[] = []
  let keptTestedCount = 0

  for (const c of unmatchedExisting) {
    const hasWork = Boolean(
      c.p1ConfirmedAt || c.p2ConfirmedAt || c.p3ConfirmedAt || c.p1Kakunin || c.p2IsComplete,
    )

    if (hasWork) {
      keptTestedCount++
    }
    else {
      deleteIds.push(c.id)
    }
  }

  await prisma.$transaction(async (tx) => {
    if (deleteIds.length > 0) {
      await tx.circuit.deleteMany({
        where: { id: { in: deleteIds } },
      })
    }

    if (createdCircuits.length > 0) {
      await tx.circuit.createMany({
        data: createdCircuits,
      })
    }

    for (const u of updatedCircuits) {
      await tx.circuit.update({
        where: { id: u.id },
        data: u.data,
      })
    }

    const logDetails = `${sourceLabel}から差分同期を実行: ${createdCircuits.length}件追加、${updatedCircuits.length}件更新`
      + `${keptTestedCount > 0 ? `、${keptTestedCount}件の試験済回路を保護` : ''}`
      + `${deleteIds.length > 0 ? `、${deleteIds.length}件の未試験削除回路を除去` : ''}`

    await tx.operationLog.create({
      data: {
        siteId,
        worker: workerName,
        action: 'Excel差分再同期',
        targetBan: '全体',
        targetKairo: '差分同期',
        details: logDetails,
      },
    })

    if (filePath) {
      await tx.siteSettings.upsert({
        where: { siteId },
        create: {
          siteId,
          excelPath: filePath,
        },
        update: {
          excelPath: filePath,
        },
      })
    }
  })

  return {
    success: true,
    count: parsedCircuits.length,
    createdCount: createdCircuits.length,
    updatedCount: updatedCircuits.length,
    keptCount: keptTestedCount,
    deletedCount: deleteIds.length,
  }
}

export function applyCircuitToRow(
  row: ExcelJS.Row,
  c: Circuit,
  colMap: CircuitColumnMap = DEFAULT_CIRCUIT_COLUMN_MAP,
) {
  // Phase 1 書戻し
  if (c.p1ConfirmedAt && c.p1Kakunin && c.p1Mashishime) {
    setCellStringWithNewlines(row.getCell(colMap.p1Worker), c.p1Worker || '確認済')
  }
  if (c.p1Remarks) {
    setCellStringWithNewlines(row.getCell(colMap.p1Remarks), c.p1Remarks)
  }

  // Phase 2 書戻し
  if (c.p2ConfirmedAt || c.p2IsComplete) {
    // R相
    if (c.p2RStatus === '良好') {
      row.getCell(colMap.zetsuenR).value = c.keiTo === '幹線' ? 500 : 100
    }
    else if (c.zetsuenR !== null && c.zetsuenR !== undefined) {
      row.getCell(colMap.zetsuenR).value = c.zetsuenR
    }

    // S相
    if (c.p2SStatus === '良好') {
      row.getCell(colMap.zetsuenS).value = c.keiTo === '幹線' ? 500 : 100
    }
    else if (c.zetsuenS !== null && c.zetsuenS !== undefined) {
      row.getCell(colMap.zetsuenS).value = c.zetsuenS
    }

    // T相
    if (c.p2TStatus === '良好') {
      row.getCell(colMap.zetsuenT).value = c.keiTo === '幹線' ? 500 : 100
    }
    else if (c.zetsuenT !== null && c.zetsuenT !== undefined) {
      row.getCell(colMap.zetsuenT).value = c.zetsuenT
    }

    if (c.p2Worker) {
      setCellStringWithNewlines(row.getCell(colMap.p2Worker), c.p2Worker)
    }
    if (c.p2Remarks) {
      setCellStringWithNewlines(row.getCell(colMap.p2Remarks), c.p2Remarks)
    }
  }

  // Phase 3 書戻し
  if (c.p3ConfirmedAt) {
    if (c.denatsuRs !== null && c.denatsuRs !== undefined) {
      row.getCell(colMap.denatsuRs).value = c.denatsuRs
    }
    if (c.denatsuSt !== null && c.denatsuSt !== undefined) {
      row.getCell(colMap.denatsuSt).value = c.denatsuSt
    }
    if (c.denatsuRt !== null && c.denatsuRt !== undefined) {
      row.getCell(colMap.denatsuRt).value = c.denatsuRt
    }
    if (c.kensou) {
      setCellStringWithNewlines(row.getCell(colMap.kensou), c.kensou)
    }
    if (c.p3Worker) {
      setCellStringWithNewlines(row.getCell(colMap.p3Worker), c.p3Worker)
    }
    if (c.p3Remarks) {
      setCellStringWithNewlines(row.getCell(colMap.p3Remarks), c.p3Remarks)
    }
  }

  // Web側で編集された基本情報（回路番号・回路名称・ケーブル等）がある場合の書戻し
  if (c.p1ModifiedFields && c.p1ModifiedFields !== '[]') {
    if (c.kairoBangou) setCellStringWithNewlines(row.getCell(colMap.kairoBangou), c.kairoBangou)
    if (c.kairoMeisho) setCellStringWithNewlines(row.getCell(colMap.kairoMeisho), c.kairoMeisho)
    if (c.cableList) setCellStringWithNewlines(row.getCell(colMap.cableList), c.cableList)
    if (c.haisenJousuu) setCellStringWithNewlines(row.getCell(colMap.haisenJousuu), c.haisenJousuu)
    if (c.setsuchiList) setCellStringWithNewlines(row.getCell(colMap.setsuchiList), c.setsuchiList)
  }
}

/**
 * 回路データおよび最新試験結果を含むExcelファイルのバイナリバッファを生成する
 */
export async function generateCircuitsExcelBuffer(
  siteId: string,
  baseFilePath?: string | null,
): Promise<{ buffer: Buffer, count: number }> {
  const circuits = await prisma.circuit.findMany({
    where: { siteId },
    orderBy: [
      { excelRow: 'asc' },
      { createdAt: 'asc' },
    ],
  })

  const workbook = new ExcelJS.Workbook()
  const cleanPath = baseFilePath && typeof baseFilePath === 'string' && baseFilePath.trim()
    ? validateSafeExcelPath(baseFilePath)
    : ''
  const hasBaseFile = cleanPath && fs.existsSync(cleanPath)

  if (!hasBaseFile) {
    throw new Error('現場設定にExcelファイルが登録されていないか、ファイルが見つかりません')
  }

  await workbook.xlsx.readFile(cleanPath)
  const sheet = workbook.getWorksheet('回路ﾘｽﾄ') || workbook.worksheets[0]

  if (!sheet) {
    throw new Error('ワークブックにシートが見つかりません')
  }

  const { colMap, dataStartRowNumber } = detectCircuitColumns(sheet)

  const circuitByKey = new Map<string, Circuit[]>()

  for (const c of circuits) {
    const key = makeCircuitKey(c.keiTo, c.banMeisho, c.kairoBangou, c.kairoMeisho)
    const list = circuitByKey.get(key) || []

    list.push(c)
    circuitByKey.set(key, list)
  }

  let updatedCount = 0

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber < dataStartRowNumber) return

    const banMeisho = getCellString(row, colMap.banMeisho)
    const kairoMeisho = getCellString(row, colMap.kairoMeisho)
    const kairoBangou = getCellString(row, colMap.kairoBangou)
    const kansenRaw = row.getCell(colMap.keiTo).value
    const keiTo = isKansen(kansenRaw)

    if (!banMeisho && !kairoMeisho && !kairoBangou) return

    const key = makeCircuitKey(keiTo, banMeisho, kairoBangou, kairoMeisho)
    const candidates = circuitByKey.get(key)
    const c = candidates && candidates.length > 0 ? candidates.shift()! : null

    if (c) {
      applyCircuitToRow(row, c, colMap)
      updatedCount++
    }
  })

  const uint8 = await workbook.xlsx.writeBuffer()

  return {
    buffer: Buffer.from(uint8),
    count: updatedCount,
  }
}

/**
 * Web上の最新試験結果をExcelファイルに書き戻す（エクスポート）
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
      details: `Excel(${filePath})へ${count}件の最新試験結果を書き戻しました`,
    },
  })

  return {
    success: true,
    count,
    filePath,
  }
}
