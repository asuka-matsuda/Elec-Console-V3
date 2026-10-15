/**
 * 現場削除 API
 * DELETE /api/sites/:siteId
 *
 * @description 指定された現場および関連データ（設定、カレンダー、回路、操作ログ等）を完全に削除します。
 * @permission システム管理者限定
 */

import fs from 'node:fs'
import path from 'node:path'

import { defineEventHandler, getRouterParam } from 'h3'

import { ErrorCode } from '#shared/types/errors'

import { requireMasterUser } from '../../../utils/auth'
import { createAppError } from '../../../utils/error'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireMasterUser(event)

  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: '現場IDが指定されていません。',
    })
  }

  const existing = await prisma.site.findUnique({
    where: { id: siteId },
  })

  if (!existing) {
    throw createAppError({
      code: ErrorCode.SITE_NOT_FOUND,
      message: '削除対象の現場が見つかりません。',
    })
  }

  // 関連データをトランザクション内で明示的・確実にカスケード削除
  await prisma.$transaction(async (tx) => {
    await tx.todo.deleteMany({ where: { siteId } })
    await tx.userOnSite.deleteMany({ where: { siteId } })
    await tx.circuit.deleteMany({ where: { siteId } })
    await tx.operationLog.deleteMany({ where: { siteId } })
    await tx.event.deleteMany({ where: { siteId } })
    await tx.siteSettings.deleteMany({ where: { siteId } })
    await tx.calendarSettings.deleteMany({ where: { siteId } })

    await tx.site.delete({
      where: { id: siteId },
    })
  })

  // ディスク上の現場用Excelテンプレートディレクトリも削除
  const templateDir = path.resolve(process.cwd(), '.data', 'templates', siteId)

  if (fs.existsSync(templateDir)) {
    fs.rmSync(templateDir, { recursive: true, force: true })
  }

  return { success: true }
})
