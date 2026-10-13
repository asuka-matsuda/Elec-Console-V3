/**
 * サーバー側 リモコン回路抽出エンジン
 *
 * @description 現場設定の原本Excel（またはDB回路台帳）から負荷アドレス一覧を抽出し、
 * 伝送系統ごとの256スロット（0-1〜63-4）形式の RemoteCircuitItem[] を構築します。
 */
import fs from 'node:fs'

import ExcelJS from 'exceljs'

import type { RemoteCircuitItem } from '#shared/types/remoteControl'
import { findPreferredWorksheet } from '#shared/utils/excelNormalize'
import { extractRemoteCircuitsFromWorksheet } from '#shared/utils/remoteCircuits'

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

  const sheet = findPreferredWorksheet(workbook)

  if (!sheet) return []

  return extractRemoteCircuitsFromWorksheet(sheet, siteId)
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
