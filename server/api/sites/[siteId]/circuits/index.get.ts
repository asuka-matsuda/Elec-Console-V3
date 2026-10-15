/**
 * 現場回路一覧取得 API
 * GET /api/sites/:siteId/circuits
 *
 * @description 指定現場の全試験回路データおよび各フェーズの測定・確定状態を取得します。
 * @permission 現場アクセス権限
 */

import { defineEventHandler, getQuery, getRouterParam } from 'h3'

import { ErrorCode } from '#shared/types/errors'

import { requireSiteAccess } from '../../../../utils/auth'
import { createAppError } from '../../../../utils/error'
import { EXAM_LOGIC } from '../../../../utils/examLogic'
import { parseExcludedCircuits } from '../../../../utils/jsonFields'
import { prisma } from '../../../../utils/prisma'
import { isCircuitExcluded } from '../../../../utils/stats'

export default defineEventHandler(async (event) => {
  await requireSiteAccess(event)

  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: '現場IDが指定されていません',
    })
  }

  const query = getQuery(event)
  const banShubetsu = query.banShubetsu ? String(query.banShubetsu) : undefined
  const banMeisho = query.banMeisho ? String(query.banMeisho) : undefined
  const rawKeiTo = query.keiTo || query.kei_to
  const keiTo = rawKeiTo ? String(rawKeiTo) : undefined

  // 現場設定から除外キーワードを取得
  const settings = await prisma.siteSettings.findUnique({
    where: { siteId },
  })

  const excludedKeywords = parseExcludedCircuits(settings?.excludedCircuits)

  // 現場全体のパネル選択肢を取得
  const allSiteCircuits = await prisma.circuit.findMany({
    where: { siteId },
    select: {
      banShubetsu: true,
      banMeisho: true,
      keiTo: true,
      kairoMeisho: true,
      p3ConfirmedAt: true,
      p3IsComplete: true,
    },
    orderBy: [
      { banShubetsu: 'asc' },
      { banMeisho: 'asc' },
      { excelRow: 'asc' },
    ],
  })

  // 重複排除したパネル選択肢
  const panelMap = new Map<string, { banShubetsu: string, banMeisho: string }>()

  for (const c of allSiteCircuits) {
    const key = `${c.banShubetsu}___${c.banMeisho}`

    if (!panelMap.has(key)) {
      panelMap.set(key, {
        banShubetsu: c.banShubetsu,
        banMeisho: c.banMeisho,
      })
    }
  }

  const panelOptions = Array.from(panelMap.values())

  // 同一盤名称の幹線がPhase 3まで完了しているかをチェック
  const panelsWithIncompleteKansen: string[] = []
  const trunkCircuits = allSiteCircuits.filter(c => c.keiTo === '幹線')
  const incompleteSet = new Set<string>()

  for (const t of trunkCircuits) {
    if (isCircuitExcluded(t.kairoMeisho, excludedKeywords)) continue

    if (!EXAM_LOGIC.PHASE3.isComplete(t)) {
      incompleteSet.add(t.banMeisho)
      // OP-1(1) などの枝番付き幹線の場合、ベースとなる盤名 OP-1 も未完了対象に含める
      const baseBan = t.banMeisho.replace(/\([^)]*\)/g, '').trim()

      if (baseBan) {
        incompleteSet.add(baseBan)
      }
    }
  }

  panelsWithIncompleteKansen.push(...incompleteSet)

  // 絞り込み条件の構築
  const where: Record<string, unknown> = { siteId }

  if (banShubetsu && banShubetsu !== 'ALL') {
    where.banShubetsu = banShubetsu
  }

  if (banMeisho && banMeisho !== 'ALL') {
    where.banMeisho = banMeisho
  }

  if (keiTo && keiTo !== 'ALL') {
    where.keiTo = keiTo
  }

  const rawCircuits = await prisma.circuit.findMany({
    where,
    orderBy: [
      { excelRow: 'asc' },
      { createdAt: 'asc' },
    ],
  })

  // 除外フラグの付与
  const circuits = rawCircuits.map(c => ({
    ...c,
    isExcluded: isCircuitExcluded(c.kairoMeisho, excludedKeywords),
  }))

  return {
    circuits,
    panelOptions,
    panelsWithIncompleteKansen,
    total: circuits.length,
  }
})
