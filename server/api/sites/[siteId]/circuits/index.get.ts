import { createError, defineEventHandler, getQuery, getRouterParam } from 'h3'

import { requireAuthUser } from '../../../../utils/auth'
import { EXAM_LOGIC } from '../../../../utils/examLogic'
import { prisma } from '../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireAuthUser(event)

  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createError({
      statusCode: 400,
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

  let excludedKeywords: string[] = []

  if (settings?.excludedCircuits) {
    try {
      excludedKeywords = JSON.parse(settings.excludedCircuits)
    }
    catch {
      excludedKeywords = []
    }
  }

  // 現場全体のパネル選択肢を取得
  const allSiteCircuits = await prisma.circuit.findMany({
    where: { siteId },
    select: {
      banShubetsu: true,
      banMeisho: true,
      keiTo: true,
      kairoMeisho: true,
      p3ConfirmedAt: true,
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

  // 二次側アクセス時、同一盤名称の幹線がPhase 3まで完了しているかをチェック
  const panelsWithIncompleteKansen: string[] = []

  if (keiTo === '二次側') {
    const trunkCircuits = allSiteCircuits.filter(c => c.keiTo === '幹線')
    const incompleteSet = new Set<string>()

    for (const t of trunkCircuits) {
      const name = (t.kairoMeisho || '').trim()
      const isExcluded = !name || excludedKeywords.some(kw => kw && name.includes(kw))

      if (isExcluded) continue

      if (!EXAM_LOGIC.PHASE3.isComplete(t)) {
        incompleteSet.add(t.banMeisho)
      }
    }

    panelsWithIncompleteKansen.push(...incompleteSet)
  }

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
  const circuits = rawCircuits.map((c) => {
    const name = (c.kairoMeisho || '').trim()
    const isExcluded = !name || excludedKeywords.some(kw => kw && name.includes(kw))

    return {
      ...c,
      isExcluded,
    }
  })

  return {
    circuits,
    panelOptions,
    panelsWithIncompleteKansen,
    phase2ThresholdMegOhm: settings?.phase2ThresholdMegOhm ?? 1.0,
    total: circuits.length,
  }
})
