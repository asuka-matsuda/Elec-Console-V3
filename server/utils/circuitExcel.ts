import fs from 'node:fs'

import type { Circuit, Prisma } from '@prisma/client'
import ExcelJS from 'exceljs'

import { prisma } from './prisma'

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

function getCellString(row: ExcelJS.Row, colNumber: number): string {
  const cell = row.getCell(colNumber)
  const v = cell.value

  if (v === null || v === undefined) return ''

  if (typeof v === 'object') {
    if ('result' in v && v.result !== undefined && v.result !== null) {
      return String(v.result).trim()
    }

    if ('richText' in v && Array.isArray(v.richText)) {
      return v.richText.map(t => t.text).join('').trim()
    }
  }

  return String(v).trim()
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

function makeCircuitKey(
  keiTo: string,
  banMeisho: string,
  kairoBangou: string | null | undefined,
  kairoMeisho: string | null | undefined,
): string {
  return `${keiTo.trim()}::${banMeisho.trim()}::${(kairoBangou || '').trim()}::${(kairoMeisho || '').trim()}`
}

/**
 * Excelファイルから回路情報を取り込む（差分同期 または 初期化取込）
 *
 * mode === 'merge': Webで入力された試験結果（Phase 1〜3）を100%保護し、Excel側の設計情報変更や行追加のみを安全にマージ
 * mode === 'reset': 既存回路を全削除し、Excelからまっさらに作り直す
 */
export async function importCircuitsFromExcel(
  siteId: string,
  rawFilePath: string,
  workerName: string = 'システム管理者',
  mode: 'merge' | 'reset' = 'merge',
): Promise<ImportCircuitResult> {
  const filePath = rawFilePath.trim().replace(/^["']+|["']+$/g, '').trim()

  if (!fs.existsSync(filePath)) {
    throw new Error(`Excelファイルが見つかりません: ${filePath}`)
  }

  const workbook = new ExcelJS.Workbook()

  await workbook.xlsx.readFile(filePath)

  const sheet = workbook.getWorksheet('回路ﾘｽﾄ') || workbook.worksheets[0]

  if (!sheet) {
    throw new Error('ワークブックにシートが見つかりません')
  }

  const parsedCircuits: Prisma.CircuitCreateManyInput[] = []

  // Excelの5行目からデータ開始
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber < 5) return

    const banMeisho = getCellString(row, 5) // Col E
    const kairoMeisho = getCellString(row, 14) // Col N
    const kairoBangou = getCellString(row, 13) // Col M

    // 盤名称も回路名称も回路番号も無い空行はスキップ
    if (!banMeisho && !kairoMeisho && !kairoBangou) {
      return
    }

    const kansenRaw = row.getCell(22).value // Col V
    const keiTo = isKansen(kansenRaw)

    const rawShubetsu = getCellString(row, 6) // Col F
    const banShubetsu = rawShubetsu || (keiTo === '幹線' ? '幹線' : 'その他')

    const rRaw = row.getCell(26).value // Col Z
    const sRaw = row.getCell(27).value // Col AA
    const tRaw = row.getCell(28).value // Col AB

    const rData = parseP2Value(rRaw, keiTo)
    const sData = parseP2Value(sRaw, keiTo)
    const tData = parseP2Value(tRaw, keiTo)

    const p1Worker = getCellString(row, 24) || null // Col X
    const p2Worker = getCellString(row, 29) || null // Col AC
    const p3Worker = getCellString(row, 35) || null // Col AI

    const vRs = parseFloat(getCellString(row, 31)) || null // Col AE
    const vSt = parseFloat(getCellString(row, 32)) || null // Col AF
    const vRt = parseFloat(getCellString(row, 33)) || null // Col AG
    const kensou = getCellString(row, 34) || null // Col AH

    parsedCircuits.push({
      siteId,
      excelRow: rowNumber,
      keiTo,
      banShubetsu,
      banMeisho: banMeisho || '未分類',
      haidenHoushiki: getCellString(row, 7) || null, // Col G
      souShubetsu: getCellString(row, 9) || null, // Col I
      shadankiShubetsu: getCellString(row, 10) || null, // Col J
      shadankiYouryou: getCellString(row, 11) || null, // Col K
      kairoKigou: getCellString(row, 12) || null, // Col L
      kairoBangou: kairoBangou || null,
      kairoMeisho: kairoMeisho || null,
      cableList: getCellString(row, 15) || null, // Col O
      haisenJousuu: getCellString(row, 16) || null, // Col P
      setsuchiUmu: getCellString(row, 17) || null, // Col Q
      setsuchiList: getCellString(row, 18) || null, // Col R

      p1Kakunin: Boolean(p1Worker),
      p1Mashishime: Boolean(p1Worker),
      p1Worker,
      p1ConfirmedAt: p1Worker ? new Date() : null,
      p1Remarks: getCellString(row, 25) || null, // Col Y
      p1ModifiedFields: '[]',

      zetsuenR: rData.value,
      zetsuenS: sData.value,
      zetsuenT: tData.value,
      p2RStatus: rData.status,
      p2SStatus: sData.status,
      p2TStatus: tData.status,
      p2Worker,
      p2ConfirmedAt: p2Worker ? new Date() : null,
      p2Remarks: getCellString(row, 30) || null, // Col AD
      p2IsComplete: Boolean(p2Worker),

      denatsuRs: vRs,
      denatsuSt: vSt,
      denatsuRt: vRt,
      kensou,
      p3Worker,
      p3ConfirmedAt: p3Worker ? new Date() : null,
      p3Remarks: getCellString(row, 36) || null, // Col AJ
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
          details: `Excel(${filePath})から${parsedCircuits.length}件の回路情報を初期化取り込みしました`,
        },
      }),
      prisma.siteSettings.upsert({
        where: { siteId },
        create: {
          siteId,
          excelPath: filePath,
        },
        update: {
          excelPath: filePath,
        },
      }),
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

    const logDetails = `Excel(${filePath})から差分同期を実行: ${createdCircuits.length}件追加、${updatedCircuits.length}件更新`
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
      create: {
        siteId,
        excelPath: filePath,
      },
      update: {
        excelPath: filePath,
      },
    })
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

/**
 * Web上の最新試験結果をExcelファイルに書き戻す（エクスポート）
 */
export async function exportCircuitsToExcel(
  siteId: string,
  rawFilePath: string,
  workerName: string = 'システム管理者',
): Promise<ExportCircuitResult> {
  const filePath = rawFilePath.trim().replace(/^["']+|["']+$/g, '').trim()

  if (!fs.existsSync(filePath)) {
    throw new Error(`Excelファイルが見つかりません: ${filePath}`)
  }

  const workbook = new ExcelJS.Workbook()

  await workbook.xlsx.readFile(filePath)

  const sheet = workbook.getWorksheet('回路ﾘｽﾄ') || workbook.worksheets[0]

  if (!sheet) {
    throw new Error('ワークブックにシートが見つかりません')
  }

  const circuits = await prisma.circuit.findMany({
    where: { siteId },
  })

  // 複合キーによる照合用マップ
  const circuitByKey = new Map<string, Circuit[]>()

  for (const c of circuits) {
    const key = makeCircuitKey(c.keiTo, c.banMeisho, c.kairoBangou, c.kairoMeisho)
    const list = circuitByKey.get(key) || []

    list.push(c)
    circuitByKey.set(key, list)
  }

  let updatedCount = 0

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber < 5) return

    const banMeisho = getCellString(row, 5) // Col E
    const kairoMeisho = getCellString(row, 14) // Col N
    const kairoBangou = getCellString(row, 13) // Col M
    const kansenRaw = row.getCell(22).value // Col V
    const keiTo = isKansen(kansenRaw)

    if (!banMeisho && !kairoMeisho && !kairoBangou) return

    const key = makeCircuitKey(keiTo, banMeisho, kairoBangou, kairoMeisho)
    const candidates = circuitByKey.get(key)
    const c = candidates && candidates.length > 0 ? candidates.shift()! : null

    if (c) {
      // Phase 1 書戻し
      if (c.p1ConfirmedAt && c.p1Kakunin && c.p1Mashishime) {
        row.getCell(24).value = c.p1Worker || '確認済' // Col X
      }
      if (c.p1Remarks) {
        row.getCell(25).value = c.p1Remarks // Col Y
      }

      // Phase 2 書戻し
      if (c.p2ConfirmedAt || c.p2IsComplete) {
        // Col Z (R相)
        if (c.p2RStatus === '良好') {
          row.getCell(26).value = c.keiTo === '幹線' ? 500 : 100
        }
        else if (c.zetsuenR !== null && c.zetsuenR !== undefined) {
          row.getCell(26).value = c.zetsuenR
        }

        // Col AA (S相)
        if (c.p2SStatus === '良好') {
          row.getCell(27).value = c.keiTo === '幹線' ? 500 : 100
        }
        else if (c.zetsuenS !== null && c.zetsuenS !== undefined) {
          row.getCell(27).value = c.zetsuenS
        }

        // Col AB (T相)
        if (c.p2TStatus === '良好') {
          row.getCell(28).value = c.keiTo === '幹線' ? 500 : 100
        }
        else if (c.zetsuenT !== null && c.zetsuenT !== undefined) {
          row.getCell(28).value = c.zetsuenT
        }

        if (c.p2Worker) {
          row.getCell(29).value = c.p2Worker // Col AC
        }
        if (c.p2Remarks) {
          row.getCell(30).value = c.p2Remarks // Col AD
        }
      }

      // Phase 3 書戻し
      if (c.p3ConfirmedAt) {
        if (c.denatsuRs !== null && c.denatsuRs !== undefined) {
          row.getCell(31).value = c.denatsuRs // Col AE
        }
        if (c.denatsuSt !== null && c.denatsuSt !== undefined) {
          row.getCell(32).value = c.denatsuSt // Col AF
        }
        if (c.denatsuRt !== null && c.denatsuRt !== undefined) {
          row.getCell(33).value = c.denatsuRt // Col AG
        }
        if (c.kensou) {
          row.getCell(34).value = c.kensou // Col AH
        }
        if (c.p3Worker) {
          row.getCell(35).value = c.p3Worker // Col AI
        }
        if (c.p3Remarks) {
          row.getCell(36).value = c.p3Remarks // Col AJ
        }
      }

      updatedCount++
    }
  })

  await workbook.xlsx.writeFile(filePath)

  await prisma.operationLog.create({
    data: {
      siteId,
      worker: workerName,
      action: 'Excel書戻し',
      targetBan: '全体',
      targetKairo: '一括書戻し',
      details: `Excel(${filePath})へ${updatedCount}件の最新試験結果を書き戻しました`,
    },
  })

  return {
    success: true,
    count: updatedCount,
    filePath,
  }
}
