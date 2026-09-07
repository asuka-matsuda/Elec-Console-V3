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

function applyCircuitToRow(row: ExcelJS.Row, c: Circuit) {
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

  let updatedCount = 0

  if (hasBaseFile) {
    await workbook.xlsx.readFile(cleanPath)
    const sheet = workbook.getWorksheet('回路ﾘｽﾄ') || workbook.worksheets[0]

    if (!sheet) {
      throw new Error('ワークブックにシートが見つかりません')
    }

    const circuitByKey = new Map<string, Circuit[]>()

    for (const c of circuits) {
      const key = makeCircuitKey(c.keiTo, c.banMeisho, c.kairoBangou, c.kairoMeisho)
      const list = circuitByKey.get(key) || []

      list.push(c)
      circuitByKey.set(key, list)
    }

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
        applyCircuitToRow(row, c)
        updatedCount++
      }
    })
  }
  else {
    // テンプレートファイルがない場合、新規ワークシート「回路ﾘｽﾄ」を生成
    const sheet = workbook.addWorksheet('回路ﾘｽﾄ')

    // ヘッダー行の構築 (行4に見出し)
    const headerRow = sheet.getRow(4)

    headerRow.getCell(5).value = '盤名称'
    headerRow.getCell(6).value = '盤種別'
    headerRow.getCell(7).value = '配電方式'
    headerRow.getCell(9).value = '相種別'
    headerRow.getCell(10).value = '遮断器種別'
    headerRow.getCell(11).value = '遮断器容量'
    headerRow.getCell(12).value = '回路記号'
    headerRow.getCell(13).value = '回路番号'
    headerRow.getCell(14).value = '回路名称'
    headerRow.getCell(15).value = 'ケーブル'
    headerRow.getCell(16).value = '配線条数'
    headerRow.getCell(17).value = '接地有無'
    headerRow.getCell(18).value = '接地種別'
    headerRow.getCell(22).value = '幹線/二次側'
    headerRow.getCell(24).value = 'P1確認者'
    headerRow.getCell(25).value = 'P1備考'
    headerRow.getCell(26).value = 'P2(R)'
    headerRow.getCell(27).value = 'P2(S)'
    headerRow.getCell(28).value = 'P2(T)'
    headerRow.getCell(29).value = 'P2測定者'
    headerRow.getCell(30).value = 'P2備考'
    headerRow.getCell(31).value = 'P3(RS)'
    headerRow.getCell(32).value = 'P3(ST)'
    headerRow.getCell(33).value = 'P3(RT)'
    headerRow.getCell(34).value = '検相'
    headerRow.getCell(35).value = 'P3測定者'
    headerRow.getCell(36).value = 'P3備考'

    let currentRowNum = 5

    for (const c of circuits) {
      const row = sheet.getRow(currentRowNum)

      row.getCell(5).value = c.banMeisho
      row.getCell(6).value = c.banShubetsu
      row.getCell(7).value = c.haidenHoushiki
      row.getCell(9).value = c.souShubetsu
      row.getCell(10).value = c.shadankiShubetsu
      row.getCell(11).value = c.shadankiYouryou
      row.getCell(12).value = c.kairoKigou
      row.getCell(13).value = c.kairoBangou
      row.getCell(14).value = c.kairoMeisho
      row.getCell(15).value = c.cableList
      row.getCell(16).value = c.haisenJousuu
      row.getCell(17).value = c.setsuchiUmu
      row.getCell(18).value = c.setsuchiList
      row.getCell(22).value = c.keiTo

      applyCircuitToRow(row, c)
      currentRowNum++
      updatedCount++
    }
  }

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
