import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'

import { requireAuthUser } from '../../../../utils/auth'
import { exportCircuitsToExcel } from '../../../../utils/circuitExcel'
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
  let targetPath = body?.filePath?.trim().replace(/^["']+|["']+$/g, '').trim()

  if (!targetPath) {
    const settings = await prisma.siteSettings.findUnique({
      where: { siteId },
    })

    targetPath = settings?.excelPath?.trim().replace(/^["']+|["']+$/g, '').trim()
  }

  if (!targetPath) {
    throw createError({
      statusCode: 400,
      message: 'Excel連携ファイル保存先が設定されていません。現場設定にてExcelファイルの絶対パスを指定・保存してください。',
    })
  }

  try {
    const workerName = `${user.lastName} ${user.firstName}`.trim() || user.loginId
    const result = await exportCircuitsToExcel(siteId, targetPath, workerName)

    return {
      success: true,
      count: result.count,
      filePath: targetPath,
    }
  }
  catch (error: unknown) {
    const err = error as Error

    console.error('Failed to export circuits to Excel:', err)

    throw createError({
      statusCode: 500,
      message: err.message || 'Excelファイルへの書き戻しに失敗しました',
    })
  }
})
