/**
 * 現場新規登録 API
 * POST /api/sites
 *
 * @description 新規現場を作成・登録します。
 * @permission システム管理者限定
 */

import { defineEventHandler, readBody } from 'h3'

import { ErrorCode } from '#shared/types/errors'

import { requireMasterUser } from '../../utils/auth'
import { createAppError } from '../../utils/error'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireMasterUser(event)
  const body = await readBody(event)

  const id = typeof body?.id === 'string' ? body.id.trim() : ''
  const name = typeof body?.name === 'string' ? body.name.trim() : ''

  if (!id) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: '現場IDを入力してください。',
    })
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: '現場IDは半角英数字、ハイフン（-）、アンダースコア（_）のみ使用できます。',
    })
  }

  if (!name) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: '現場名を入力してください。',
    })
  }

  const existing = await prisma.site.findUnique({
    where: { id },
  })

  if (existing) {
    throw createAppError({
      code: ErrorCode.DB_UNIQUE_VIOLATION,
      message: `現場ID「${id}」は既に使用されています。別のIDを指定してください。`,
    })
  }

  const { newSite, settings } = await prisma.$transaction(async (tx) => {
    const createdSite = await tx.site.create({
      data: {
        id,
        name,
        status: body.status || 'planning',
      },
      include: {
        users: {
          select: {
            id: true,
            loginId: true,
            firstName: true,
            lastName: true,
            firstNameKana: true,
            lastNameKana: true,
            role: true,
            isActive: true,
          },
        },
      },
    })

    const createdSettings = await tx.siteSettings.create({
      data: {
        siteId: createdSite.id,
        enablePhase3: true,
      },
    })

    return { newSite: createdSite, settings: createdSettings }
  })

  return { site: newSite, settings }
})
