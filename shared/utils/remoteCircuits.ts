/**
 * 遠隔制御回路（Remote Circuits）Excel 抽出・構築共通ユーティリティ (SSoT)
 * クライアント・サーバー双方で同一のデータ構築・アドレスマッピングロジックを提供します。
 */
import type { RemoteCircuitItem } from '#shared/types/remoteControl'

import {
  cellValueToString,
  detectHeaderRowIndex,
  type MinimalWorksheet,
  normalizeHeaderName,
} from './excelNormalize'

const REMOTE_HEADER_TARGETS = [
  '伝送系統',
  '伝送',
  '負荷アドレス',
  '負荷ｱﾄﾞﾚｽ',
  'アドレス',
  'ｱﾄﾞﾚｽ',
  '盤名称',
  '分電盤名称',
  '盤名',
  '回路記号',
  '回路番号',
  '回路no',
  '回路名称',
  '回路名',
  '負荷名称',
  'リレー番号',
  'ﾘﾚｰ番号',
  '機器番号',
] as const

interface RawRemoteRow {
  banMeisho: string
  kairoKigou?: string | null
  kairoBangou: string
  kairoMeisho: string
  relayNumber?: string
}

/**
 * ワークシートから遠隔制御回路スロット一覧（系統あたり 0-1〜63-4 の256スロット）を抽出・構築
 */
export function extractRemoteCircuitsFromWorksheet(
  sheet: MinimalWorksheet,
  siteId: string = '',
): RemoteCircuitItem[] {
  const headerRowIndex = detectHeaderRowIndex(sheet, REMOTE_HEADER_TARGETS, { exactMatch: true })
  const headerRow = sheet.getRow(headerRowIndex)

  let densoKeiToCol = -1
  let fukaAddressCol = -1
  let banMeishoCol = -1
  let kairoKigouCol = -1
  let kairoBangouCol = -1
  let kairoMeishoCol = -1
  let relayNumberCol = -1

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const norm = normalizeHeaderName(cellValueToString(cell.value))

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

  if (sheet.eachRow) {
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber < dataStartRow) return

      const addrRaw = cellValueToString(row.getCell(fukaAddressCol).value).trim()
      const addr = normalizeHeaderName(addrRaw)

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
  }

  // 伝送系統ごとに 0-1 〜 63-4 の 256 スロットを用意
  const densoList = densoSet.size > 0 ? Array.from(densoSet).sort() : ['1']
  const circuits: RemoteCircuitItem[] = []

  for (const denso of densoList) {
    for (let ch = 0; ch <= 63; ch++) {
      for (let sub = 1; sub <= 4; sub++) {
        const addr = `${ch}-${sub}`
        const key = `${denso}:${normalizeHeaderName(addr)}`
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
