import { EXAM_LOGIC } from './examLogic'
import { prisma } from './prisma'

export interface SoudenStats {
  totalPct: number
  totalCircuits: number
  totalActive: number
  totalExcluded: number
  p1Total: number
  p2Total: number
  p3Total: number

  trunkTotal: number
  trunkExcluded: number
  trunkP1: number
  trunkP1Pct: number
  trunkP2: number
  trunkP2Pct: number
  trunkP3: number
  trunkP3Pct: number
  trunkOverallPct: number

  secTotal: number
  secExcluded: number
  secP1: number
  secP1Pct: number
  secP2: number
  secP2Pct: number
  secP3: number
  secP3Pct: number
  secOverallPct: number
}

function calcPct(completed: number, total: number): number {
  if (total <= 0) return 0

  return Math.round((completed / total) * 100)
}

export async function getSoudenStats(siteId: string): Promise<SoudenStats> {
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

  // 現場の全回路を取得
  const circuits = await prisma.circuit.findMany({
    where: { siteId },
    select: {
      id: true,
      keiTo: true,
      kairoMeisho: true,
      p1Kakunin: true,
      p1Mashishime: true,
      p1ConfirmedAt: true,
      p2IsComplete: true,
      p2ConfirmedAt: true,
      p3ConfirmedAt: true,
    },
  })

  let trunkTotal = 0
  let trunkExcluded = 0
  let trunkP1 = 0
  let trunkP2 = 0
  let trunkP3 = 0

  let secTotal = 0
  let secExcluded = 0
  let secP1 = 0
  let secP2 = 0
  let secP3 = 0

  for (const c of circuits) {
    const isTrunk = c.keiTo === '幹線'
    const name = (c.kairoMeisho || '').trim()

    // 除外判定: 回路名称が空、または設定された除外キーワードに部分一致
    const isExcluded = !name || excludedKeywords.some(kw => Boolean(kw && name.includes(kw)))

    if (isTrunk) {
      if (isExcluded) {
        trunkExcluded++
      }
      else {
        trunkTotal++
        if (EXAM_LOGIC.PHASE1.isComplete(c)) trunkP1++
        if (EXAM_LOGIC.PHASE2.isComplete(c)) trunkP2++
        if (EXAM_LOGIC.PHASE3.isComplete(c)) trunkP3++
      }
    }
    else {
      if (isExcluded) {
        secExcluded++
      }
      else {
        secTotal++
        if (EXAM_LOGIC.PHASE1.isComplete(c)) secP1++
        if (EXAM_LOGIC.PHASE2.isComplete(c)) secP2++
        if (EXAM_LOGIC.PHASE3.isComplete(c)) secP3++
      }
    }
  }

  const totalActive = trunkTotal + secTotal
  const totalExcluded = trunkExcluded + secExcluded
  const p1Total = trunkP1 + secP1
  const p2Total = trunkP2 + secP2
  const p3Total = trunkP3 + secP3

  const totalDenominator = totalActive * 3
  const totalCompleted = p1Total + p2Total + p3Total
  const totalPct = calcPct(totalCompleted, totalDenominator)

  const trunkOverallPct = calcPct(trunkP1 + trunkP2 + trunkP3, trunkTotal * 3)
  const secOverallPct = calcPct(secP1 + secP2 + secP3, secTotal * 3)

  return {
    totalPct,
    totalCircuits: circuits.length,
    totalActive,
    totalExcluded,
    p1Total,
    p2Total,
    p3Total,

    trunkTotal,
    trunkExcluded,
    trunkP1,
    trunkP1Pct: calcPct(trunkP1, trunkTotal),
    trunkP2,
    trunkP2Pct: calcPct(trunkP2, trunkTotal),
    trunkP3,
    trunkP3Pct: calcPct(trunkP3, trunkTotal),
    trunkOverallPct,

    secTotal,
    secExcluded,
    secP1,
    secP1Pct: calcPct(secP1, secTotal),
    secP2,
    secP2Pct: calcPct(secP2, secTotal),
    secP3,
    secP3Pct: calcPct(secP3, secTotal),
    secOverallPct,
  }
}
