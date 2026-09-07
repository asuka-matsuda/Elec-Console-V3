import { createError, defineEventHandler, getQuery, getRouterParam } from 'h3'

import { requireSiteAccess } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireSiteAccess(event)

  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createError({
      statusCode: 400,
      message: '現場IDが指定されていません',
    })
  }

  const query = getQuery(event)
  const limit = query.limit ? parseInt(String(query.limit), 10) : 100
  const worker = query.worker ? String(query.worker) : undefined
  const action = query.action ? String(query.action) : undefined
  const targetBan = query.targetBan ? String(query.targetBan) : undefined

  const where: Record<string, unknown> = { siteId }

  if (worker && worker !== 'ALL') {
    where.worker = worker
  }

  if (action && action !== 'ALL') {
    where.action = action
  }

  if (targetBan && targetBan !== 'ALL') {
    where.targetBan = targetBan
  }

  // 現場全体のログから選択肢を取得
  const allLogs = await prisma.operationLog.findMany({
    where: { siteId },
    select: {
      worker: true,
      action: true,
      targetBan: true,
    },
  })

  const workers = Array.from(new Set(allLogs.map(l => l.worker).filter(Boolean)))
  const actions = Array.from(new Set(allLogs.map(l => l.action).filter(Boolean)))
  const targetBans = Array.from(new Set(allLogs.map(l => l.targetBan).filter(Boolean)))

  const logs = await prisma.operationLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: limit,
  })

  return {
    logs,
    availableWorkers: workers,
    availableActions: actions,
    availableTargetBans: targetBans,
    total: logs.length,
  }
})
