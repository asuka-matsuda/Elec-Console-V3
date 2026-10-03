/**
 * サーバー側 リモコン回路抽出エンジン
 *
 * @description 現場設定の原本Excel（またはDB回路台帳）から負荷アドレス一覧を抽出し、
 * 伝送系統ごとの256スロット（0-1〜63-4）形式の RemoteCircuitItem[] を構築します。
 */
import fs from 'node:fs'

import ExcelJS from 'exceljs'

import type { RawRemoteRow, RemoteCircuitItem } from '#shared/types/remoteControl'
import { cellValueToString, normalizeText } from '#shared/utils/excelNormalize'

import { prisma } from '../prisma'
import { resolveExistingExcelPath } from './safePath'

/**
 * 原本Excelバッファから伝送系統ごとに 0-1〜63-4 の256スロットを抽出
 */
async function extractRemoteCircuitsFromExcelBuffer(
  buffer: Buffer | Uint8Array,
  siteId: string = '',
): Promise<RemoteCircuitItem[]> {
  const workbook = new ExcelJS.Workbook()

  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer)

  let sheet = workbook.worksheets.find(s => /回路|盤|台帳|List/i.test(s.name))

  if (!sheet) {
    sheet = workbook.worksheets[0]
  }
  if (!sheet) return []

  const HEADER_TARGETS = [
    '伝送系統', '伝送',
    '負荷アドレス', '負荷ｱﾄﾞﾚｽ', 'アドレス', 'ｱﾄﾞﾚｽ',
    '盤名称', '分電盤名称', '盤名',
    '回路記号',
    '回路番号', '回路no',
    '回路名称', '回路名', '負荷名称',
    'リレー番号', 'ﾘﾚｰ番号', '機器番号',
  ]
  const targetNorms = new Set(HEADER_TARGETS.map(normalizeText))

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
        if (targetNorms.has(normalizeText(val))) {
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
  let densoKeiToCol = -1
  let fukaAddressCol = -1
  let banMeishoCol = -1
  let kairoKigouCol = -1
  let kairoBangouCol = -1
  let kairoMeishoCol = -1
  let relayNumberCol = -1

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const norm = normalizeText(cellValueToString(cell.value))

    if (/伝送系統|伝送/.test(norm) && densoKeiToCol === -1) {
      densoKeiToCol = colNumber
    }
    else if (/負荷アドレス|負荷ｱﾄﾞﾚｽ|アドレス|ｱﾄﾞﾚｽ/.test(norm) && fukaAddressCol === -1) {
      fukaAddressCol = colNumber
    }
    else if (/盤名称|分電盤名称|盤名/.test(norm) && banMeishoCol === -1) {
      banMeishoCol = colNumber
    }
    else if (/回路記号/.test(norm) && kairoKigouCol === -1) {
      kairoKigouCol = colNumber
    }
    else if (/回路番号|回路no/.test(norm) && kairoBangouCol === -1) {
      kairoBangouCol = colNumber
    }
    else if (/負荷名称|回路名称|回路名/.test(norm) && kairoMeishoCol === -1) {
      kairoMeishoCol = colNumber
    }
    else if (/リレー番号|ﾘﾚｰ番号|機器番号/.test(norm) && relayNumberCol === -1) {
      relayNumberCol = colNumber
    }
  })

  if (fukaAddressCol === -1) {
    return []
  }

  const circuitMap = new Map<string, RawRemoteRow>()
  const densoSet = new Set<string>()
  const dataStartRow = headerRowIndex + 1

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < dataStartRow) return

    const addrRaw = cellValueToString(row.getCell(fukaAddressCol).value).trim()
    const addr = normalizeText(addrRaw)

    if (!addr || addr === '-' || addr === '0-0') return

    const rawDenso = densoKeiToCol !== -1 ? cellValueToString(row.getCell(densoKeiToCol).value).trim() : ''
    const denso = rawDenso || '1'

    densoSet.add(denso)

    const ban = banMeishoCol !== -1 ? cellValueToString(row.getCell(banMeishoCol).value).trim() : ''
    const kigou = kairoKigouCol !== -1 ? cellValueToString(row.getCell(kairoKigouCol).value).trim() : ''
    const no = kairoBangouCol !== -1 ? cellValueToString(row.getCell(kairoBangouCol).value).trim() : ''
    const name = kairoMeishoCol !== -1 ? cellValueToString(row.getCell(kairoMeishoCol).value).trim() : ''
    const relay = relayNumberCol !== -1 ? cellValueToString(row.getCell(relayNumberCol).value).trim() : ''

    const key = `${denso}:${addr}`

    circuitMap.set(key, {
      banMeisho: ban || '-',
      kairoKigou: kigou || null,
      kairoBangou: no || '-',
      kairoMeisho: name || '空き',
      relayNumber: relay || undefined,
    })
  })

  const densoList = densoSet.size > 0 ? Array.from(densoSet).sort() : ['1']
  const circuits: RemoteCircuitItem[] = []

  for (const denso of densoList) {
    for (let ch = 0; ch <= 63; ch++) {
      for (let sub = 1; sub <= 4; sub++) {
        const addr = `${ch}-${sub}`
        const key = `${denso}:${normalizeText(addr)}`
        const matched = circuitMap.get(key)

        circuits.push({
          id: `rc-${denso}-${addr}`,
          siteId,
          uniqueKey: densoList.length > 1 ? `${denso}:${addr}` : addr,
          densoKeiTo: denso,
          fukaAddress: addr,
          banMeisho: matched ? matched.banMeisho : '-',
          kairoKigou: matched ? matched.kairoKigou : null,
          kairoBangou: matched ? matched.kairoBangou : '-',
          kairoMeisho: matched ? matched.kairoMeisho : '空き',
          relayNumber: matched?.relayNumber,
          isVacant: !matched,
        })
      }
    }
  }

  return circuits
}

/**
 * 現場のリモコン回路スロット一覧を取得する（原本Excel優先、DBフォールバック）
 */
export async function loadSiteRemoteCircuits(siteId: string, rawExcelPath?: string | null): Promise<RemoteCircuitItem[]> {
  // 1. 原本Excelからの抽出を試行
  if (rawExcelPath) {
    try {
      const safePath = resolveExistingExcelPath(rawExcelPath)

      if (fs.existsSync(safePath)) {
        const buffer = await fs.promises.readFile(safePath)
        const extracted = await extractRemoteCircuitsFromExcelBuffer(buffer, siteId)

        if (extracted.length > 0) {
          return extracted
        }
      }
    }
    catch (e) {
      console.warn('[RemoteControl] Failed to extract from Excel, falling back to DB:', e)
    }
  }

  // 2. DBのCircuitテーブルからフォールバック抽出
  try {
    const dbCircuits = await prisma.circuit.findMany({
      where: { siteId },
      select: {
        id: true,
        banMeisho: true,
        kairoKigou: true,
        kairoBangou: true,
        kairoMeisho: true,
      },
      orderBy: { excelRow: 'asc' },
    })

    if (dbCircuits.length > 0) {
      // 負荷アドレスまたはリレー番号（例: 1-R1, 2-R5, または 1-1）を含む回路を収集
      const circuitMap = new Map<string, typeof dbCircuits[0]>()

      for (const c of dbCircuits) {
        if (!c.kairoBangou) continue

        // 1-R1 や 2-R4 のパターンからアドレス（チャンネル-サブ）を推測、または直接アドレス表記
        const matchDirect = c.kairoBangou.match(/^(\d{1,2})-(\d)$/)

        if (matchDirect) {
          const addr = `${matchDirect[1]}-${matchDirect[2]}`

          circuitMap.set(addr, c)
          continue
        }

        const matchRelay = c.kairoBangou.match(/R(\d+)/i)

        if (matchRelay && matchRelay[1]) {
          const relayNum = parseInt(matchRelay[1], 10)

          if (!isNaN(relayNum) && relayNum >= 1 && relayNum <= 256) {
            // リレー番号 1〜256 を 1-1〜64-4 へ変換 (ch = floor((num-1)/4)+1, sub = ((num-1)%4)+1)
            const ch = Math.floor((relayNum - 1) / 4) + 1
            const sub = ((relayNum - 1) % 4) + 1
            const addr = `${ch}-${sub}`

            circuitMap.set(addr, c)
          }
        }
      }

      if (circuitMap.size > 0) {
        const circuits: RemoteCircuitItem[] = []

        for (let ch = 0; ch <= 63; ch++) {
          for (let sub = 1; sub <= 4; sub++) {
            const addr = `${ch}-${sub}`
            const matched = circuitMap.get(addr)

            circuits.push({
              id: matched ? matched.id : `rc-fallback-1-${addr}`,
              siteId,
              uniqueKey: addr,
              densoKeiTo: '1',
              fukaAddress: addr,
              banMeisho: matched ? matched.banMeisho : '-',
              kairoKigou: matched ? matched.kairoKigou : null,
              kairoBangou: (matched && matched.kairoBangou) ? matched.kairoBangou : '-',
              kairoMeisho: matched ? (matched.kairoMeisho || '空き') : '空き',
              isVacant: !matched,
            })
          }
        }

        return circuits
      }
    }
  }
  catch (e) {
    console.warn('[RemoteControl] Failed to fallback to DB circuits:', e)
  }

  // 3. どちらも無い場合はデフォルト256空きスロット
  const fallbackCircuits: RemoteCircuitItem[] = []

  for (let ch = 0; ch <= 63; ch++) {
    for (let sub = 1; sub <= 4; sub++) {
      const addr = `${ch}-${sub}`

      fallbackCircuits.push({
        id: `rc-empty-1-${addr}`,
        siteId,
        uniqueKey: addr,
        densoKeiTo: '1',
        fukaAddress: addr,
        banMeisho: '-',
        kairoKigou: null,
        kairoBangou: '-',
        kairoMeisho: '空き',
        isVacant: true,
      })
    }
  }

  return fallbackCircuits
}
