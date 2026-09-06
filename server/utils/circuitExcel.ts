import fs from 'node:fs'

import type { Prisma } from '@prisma/client'
import ExcelJS from 'exceljs'

import { prisma } from './prisma'

export interface ImportCircuitResult {
  success: boolean
  count: number
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

export async function importCircuitsFromExcel(
  siteId: string,
  filePath: string,
  workerName: string = 'システム管理者',
): Promise<ImportCircuitResult> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Excelファイルが見つかりません: ${filePath}`)
  }

  const workbook = new ExcelJS.Workbook()

  await workbook.xlsx.readFile(filePath)

  const sheet = workbook.getWorksheet('回路ﾘｽﾄ') || workbook.worksheets[0]

  if (!sheet) {
    throw new Error('ワークブックにシートが見つかりません')
  }

  const circuitsToCreate: Prisma.CircuitCreateManyInput[] = []

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

    circuitsToCreate.push({
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

  // トランザクションで既存回路削除 & 新規登録
  await prisma.$transaction([
    prisma.circuit.deleteMany({ where: { siteId } }),
    prisma.circuit.createMany({ data: circuitsToCreate }),
    prisma.operationLog.create({
      data: {
        siteId,
        worker: workerName,
        action: 'Excel取込',
        targetBan: '全体',
        targetKairo: '一括取込',
        details: `Excel(${filePath})から${circuitsToCreate.length}件の回路情報を取り込みました`,
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
    count: circuitsToCreate.length,
  }
}
