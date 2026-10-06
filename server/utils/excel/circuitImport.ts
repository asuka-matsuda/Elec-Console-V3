/**
 * Excel 回路台帳インポート・スマートマージエンジン
 *
 * Excelファイル（またはバッファ）から回路情報をパースし、
 * 既存の試験結果を保護しながら差分同期（スマートマージ）または完全初期化取込を実行します。
 */

import fs from 'node:fs'

import type { Circuit, Prisma } from '@prisma/client'
import ExcelJS from 'exceljs'

import { prisma } from '../prisma'
import { getCellString, isKansen, parseP2Value } from './cellFormat'
import { detectCircuitColumns, findCircuitSheet, makeCircuitKey } from './circuitMapping'
import { validateSafeExcelPath } from './safePath'

interface ImportCircuitResult {
  success: boolean
  count: number
  createdCount?: number
  updatedCount?: number
  keptCount?: number
  deletedCount?: number
  excludedKeywords?: string[]
  error?: string
}

/**
 * Settingシートの除外ﾘｽﾄ（テーブルまたは列）から除外キーワード配列を自動抽出
 */
export function extractExcludedKeywordsFromWorkbook(workbook: ExcelJS.Workbook): string[] {
  const settingSheet = workbook.worksheets.find((ws) => {
    const n = ws.name.trim().toLowerCase()

    return n === 'setting' || n.includes('設定')
  })

  if (!settingSheet) {
    return []
  }

  const keywords: string[] = []

  // 1. テーブル「除外ﾘｽﾄ」または「除外リスト」から抽出
  const sheetAny = settingSheet as unknown as {
    tables?: Record<string, {
      name?: string
      tableRef?: string
      table?: { name?: string, tableRef?: string }
    }>
  }
  const tables = sheetAny.tables || {}
  const targetTable = Object.values(tables).find((t) => {
    const tName = (t?.name || t?.table?.name || '').trim()

    return tName === '除外ﾘｽﾄ' || tName === '除外リスト'
  })

  if (targetTable) {
    const ref = targetTable.tableRef || targetTable.table?.tableRef

    if (ref) {
      const match = ref.match(/^([A-Z]+)([0-9]+):([A-Z]+)([0-9]+)$/)

      if (match && match[1] && match[2] && match[4]) {
        const col = match[1]
        const startRow = parseInt(match[2], 10)
        const endRow = parseInt(match[4], 10)

        // 1行目は見出し（除外キーワード）なので startRow + 1 から走査
        for (let r = startRow + 1; r <= endRow; r++) {
          const cell = settingSheet.getCell(`${col}${r}`)
          const val = String(cell.value || '').trim()

          if (val) {
            keywords.push(val)
          }
        }
      }
    }
  }

  // 2. テーブル定義がない場合のフォールバック（セル走査）
  if (keywords.length === 0) {
    let headerRow = -1
    let headerCol = -1

    settingSheet.eachRow((row, rowNumber) => {
      if (headerRow !== -1) return
      row.eachCell((cell, colNumber) => {
        const val = String(cell.value || '').trim()

        if (val === '除外キーワード' || val === '除外ﾘｽﾄ' || val === '除外リスト') {
          headerRow = rowNumber
          headerCol = colNumber
        }
      })
    })

    if (headerRow !== -1 && headerCol !== -1) {
      for (let r = headerRow + 1; r <= settingSheet.rowCount; r++) {
        const cell = settingSheet.getRow(r).getCell(headerCol)
        const val = String(cell.value || '').trim()

        if (!val) break
        keywords.push(val)
      }
    }
  }

  return Array.from(new Set(keywords))
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

  const sheet = findCircuitSheet(workbook)

  if (!sheet) {
    throw new Error('ワークブックにシートが見つかりません')
  }

  // ヘッダー行を動的走査して列マップを構築
  const { colMap, dataStartRowNumber } = detectCircuitColumns(sheet)
  const parsedCircuits: Prisma.CircuitCreateManyInput[] = []

  const getColStr = (row: ExcelJS.Row, col?: number): string => (col !== undefined ? getCellString(row, col) : '')
  const getColVal = (row: ExcelJS.Row, col?: number): unknown => (col !== undefined ? row.getCell(col).value : null)

  const parseExcelDate = (val: unknown): Date | null => {
    if (!val) return null
    if (val instanceof Date && !isNaN(val.getTime())) return val
    if (typeof val === 'number') {
      const ms = (val - 25569) * 86400 * 1000
      const d = new Date(ms)

      if (!isNaN(d.getTime())) return d
    }
    if (typeof val === 'string' && val.trim()) {
      const d = new Date(val.trim())

      if (!isNaN(d.getTime())) return d
    }

    return null
  }

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber < dataStartRowNumber) return

    const banMeisho = getColStr(row, colMap.banMeisho)
    const kairoMeisho = getColStr(row, colMap.kairoMeisho)
    const kairoBangou = getColStr(row, colMap.kairoBangou)

    // 盤名称も回路名称も回路番号も無い空行はスキップ
    if (!banMeisho && !kairoMeisho && !kairoBangou) {
      return
    }

    const kansenRaw = getColVal(row, colMap.keiTo)
    const keiTo = isKansen(kansenRaw)

    const rawShubetsu = getColStr(row, colMap.banShubetsu)
    const banShubetsu = rawShubetsu || (keiTo === '幹線' ? '幹線' : 'その他')

    const rRaw = getColVal(row, colMap.zetsuenR)
    const sRaw = getColVal(row, colMap.zetsuenS)
    const tRaw = getColVal(row, colMap.zetsuenT)

    const rData = parseP2Value(rRaw, keiTo)
    const sData = parseP2Value(sRaw, keiTo)
    const tData = parseP2Value(tRaw, keiTo)

    const p1Worker = getColStr(row, colMap.p1Worker) || null
    const p1DateRaw = getColVal(row, colMap.p1ConfirmedAt)
    const p1ConfirmedAt = parseExcelDate(p1DateRaw) || (p1Worker ? new Date() : null)

    const p2Worker = getColStr(row, colMap.p2Worker) || null
    const p2DateRaw = getColVal(row, colMap.p2ConfirmedAt)
    const p2ConfirmedAt = parseExcelDate(p2DateRaw) || (p2Worker ? new Date() : null)

    const p3Worker = getColStr(row, colMap.p3Worker) || null
    const p3DateRaw = getColVal(row, colMap.p3ConfirmedAt)
    const p3ConfirmedAt = parseExcelDate(p3DateRaw) || (p3Worker ? new Date() : null)

    const vRs = parseFloat(getColStr(row, colMap.denatsuRs)) || null
    const vSt = parseFloat(getColStr(row, colMap.denatsuSt)) || null
    const vRt = parseFloat(getColStr(row, colMap.denatsuRt)) || null
    const kensou = getColStr(row, colMap.kensou) || null

    parsedCircuits.push({
      siteId,
      excelRow: rowNumber,
      keiTo,
      banShubetsu,
      banMeisho: banMeisho || '未分類',
      haidenHoushiki: getColStr(row, colMap.haidenHoushiki) || null,
      souShubetsu: getColStr(row, colMap.souShubetsu) || null,
      shadankiShubetsu: getColStr(row, colMap.shadankiShubetsu) || null,
      shadankiYouryou: getColStr(row, colMap.shadankiYouryou) || null,
      kairoKigou: getColStr(row, colMap.kairoKigou) || null,
      kairoBangou: kairoBangou || null,
      kairoMeisho: kairoMeisho || null,
      cableList: getColStr(row, colMap.cableList) || null,
      haisenJousuu: getColStr(row, colMap.haisenJousuu) || null,
      setsuchiUmu: getColStr(row, colMap.setsuchiUmu) || null,
      setsuchiList: getColStr(row, colMap.setsuchiList) || null,

      p1Kakunin: Boolean(p1Worker),
      p1Mashishime: Boolean(p1Worker),
      p1Worker,
      p1ConfirmedAt,
      p1Remarks: getColStr(row, colMap.p1Remarks) || null,
      p1ModifiedFields: '[]',

      zetsuenR: rData.value,
      zetsuenS: sData.value,
      zetsuenT: tData.value,
      p2RStatus: rData.status,
      p2SStatus: sData.status,
      p2TStatus: tData.status,
      p2Worker,
      p2ConfirmedAt,
      p2Remarks: getColStr(row, colMap.p2Remarks) || null,
      p2IsComplete: Boolean(p2Worker),

      denatsuRs: vRs,
      denatsuSt: vSt,
      denatsuRt: vRt,
      kensou,
      p3Worker,
      p3ConfirmedAt,
      p3Remarks: getColStr(row, colMap.p3Remarks) || null,
      p3IsComplete: Boolean(p3Worker),
    })
  })

  // Setting シートの「除外ﾘｽﾄ」テーブルから除外キーワードを自動抽出
  const extractedExcludedKeywords = extractExcludedKeywordsFromWorkbook(workbook)

  const settingsUpdateData: Prisma.SiteSettingsUpdateInput = {}

  if (filePath) settingsUpdateData.excelPath = filePath
  if (extractedExcludedKeywords.length > 0) {
    settingsUpdateData.excludedCircuits = JSON.stringify(extractedExcludedKeywords)
  }

  const settingsCreateData: Prisma.SiteSettingsCreateInput = {
    site: { connect: { id: siteId } },
    excelPath: filePath || null,
    excludedCircuits: extractedExcludedKeywords.length > 0 ? JSON.stringify(extractedExcludedKeywords) : null,
  }

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
          details: `${sourceLabel}から${parsedCircuits.length}件の回路情報を初期化取り込みしました${
            extractedExcludedKeywords.length > 0 ? `（除外キーワード${extractedExcludedKeywords.length}件を自動適用）` : ''
          }`,
        },
      }),
      prisma.siteSettings.upsert({
        where: { siteId },
        create: settingsCreateData,
        update: settingsUpdateData,
      }),
    ])

    return {
      success: true,
      count: parsedCircuits.length,
      createdCount: parsedCircuits.length,
      updatedCount: 0,
      excludedKeywords: extractedExcludedKeywords,
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

    await tx.siteSettings.upsert({
      where: { siteId },
      create: settingsCreateData,
      update: settingsUpdateData,
    })
  })

  return {
    success: true,
    count: parsedCircuits.length,
    createdCount: createdCircuits.length,
    updatedCount: updatedCircuits.length,
    keptCount: keptTestedCount,
    deletedCount: deleteIds.length,
    excludedKeywords: extractedExcludedKeywords,
  }
}
