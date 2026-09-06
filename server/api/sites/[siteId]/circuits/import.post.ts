import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'

import { requireAuthUser } from '../../../../utils/auth'
import { importCircuitsFromExcel } from '../../../../utils/circuitExcel'
import { prisma } from '../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)

  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createError({
      statusCode: 400,
      message: '現場IDが指定されていません',
    })
  }

  const body = (await readBody(event).catch(() => null)) as { filePath?: string } | null
  let targetPath = body?.filePath?.trim()

  if (!targetPath) {
    const settings = await prisma.siteSettings.findUnique({
      where: { siteId },
    })

    targetPath = settings?.excelPath || 'C:\\Users\\松田飛鳥\\Desktop\\SMC_データベース.xlsx'
  }

  try {
    const workerName = `${user.lastName} ${user.firstName}`.trim() || user.loginId
    const result = await importCircuitsFromExcel(siteId, targetPath, workerName)

    return {
      success: true,
      count: result.count,
      filePath: targetPath,
    }
  }
  catch (error: unknown) {
    const err = error as Error

    console.error('Failed to import circuits from Excel:', err)

    throw createError({
      statusCode: 500,
      message: err.message || 'Excelファイルの取り込みに失敗しました',
    })
  }
})
