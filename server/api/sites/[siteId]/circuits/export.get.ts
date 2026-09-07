import { createError, defineEventHandler, getRouterParam, setHeader } from 'h3'

import { requireSiteAccess } from '../../../../utils/auth'
import { generateCircuitsExcelBuffer } from '../../../../utils/circuitExcel'
import { prisma } from '../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireSiteAccess(event)

  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createError({
      statusCode: 400,
      message: '現場IDが指定されていません',
    })
  }

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: { settings: true },
  })

  if (!site) {
    throw createError({
      statusCode: 404,
      message: '指定された現場が見つかりません',
    })
  }

  try {
    const { buffer, count } = await generateCircuitsExcelBuffer(siteId, site.settings?.excelPath)

    const workerName = `${user.lastName} ${user.firstName}`.trim() || user.loginId

    await prisma.operationLog.create({
      data: {
        siteId,
        worker: workerName,
        action: 'Excel帳票DL',
        targetBan: '全体',
        targetKairo: '帳票ダウンロード',
        details: `ブラウザから最新試験結果(${count}件)入りExcel帳票をダウンロードしました`,
      },
    })

    const safeSiteName = (site.name || 'site').replace(/[\\/:*?"<>|]/g, '_')
    const filename = encodeURIComponent(`${safeSiteName}_回路試験結果.xlsx`)

    setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    setHeader(event, 'Content-Disposition', `attachment; filename*=UTF-8''${filename}`)

    return buffer
  }
  catch (error: unknown) {
    const err = error as Error

    console.error('Failed to generate Excel download buffer:', err)

    throw createError({
      statusCode: 500,
      message: err.message || 'Excel帳票の生成に失敗しました',
    })
  }
})
