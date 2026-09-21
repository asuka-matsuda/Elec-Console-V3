import { defineEventHandler, getRouterParam, readBody } from 'h3'

import { ErrorCode } from '#shared/types/errors'

import { requireAdminUser } from '../../utils/auth'
import { createAppError } from '../../utils/error'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const authUser = await requireAdminUser(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: 'ユーザーIDが指定されていません。',
    })
  }

  const targetUser = await prisma.user.findUnique({ where: { id } })

  if (!targetUser) {
    throw createAppError({
      code: ErrorCode.USER_NOT_FOUND,
      message: 'ユーザーが見つかりません。',
    })
  }

  // master アカウントの保護（ログインIDの変更、無効化、一般作業者への降格を禁止）
  if (targetUser.loginId === 'master') {
    if (body.loginId && body.loginId !== 'master') {
      throw createAppError({
        code: ErrorCode.USER_MASTER_PROTECTED,
        message: 'マスター管理者のログインIDを変更することはできません。',
      })
    }
    if (body.isActive === false) {
      throw createAppError({
        code: ErrorCode.USER_MASTER_PROTECTED,
        message: 'マスター管理者を無効化することはできません。',
      })
    }
    if (body.role && body.role !== 'admin') {
      throw createAppError({
        code: ErrorCode.USER_MASTER_PROTECTED,
        message: 'マスター管理者の権限を降格することはできません。',
      })
    }
  }

  // 自身のアカウントの無効化・降格の禁止
  if (targetUser.id === authUser.id) {
    if (body.isActive === false) {
      throw createAppError({
        code: ErrorCode.USER_SELF_DEMOTION_DENIED,
        message: '自分自身のアカウントを無効化することはできません。',
      })
    }
    if (body.role && body.role !== 'admin') {
      throw createAppError({
        code: ErrorCode.USER_SELF_DEMOTION_DENIED,
        message: '自分自身の管理者権限を剥奪することはできません。',
      })
    }
  }

  // 最後の有効な管理者の無効化・降格の禁止
  if (targetUser.role === 'admin' && (body.isActive === false || (body.role && body.role !== 'admin'))) {
    const adminCount = await prisma.user.count({
      where: { role: 'admin', isActive: true },
    })

    if (adminCount <= 1) {
      throw createAppError({
        code: ErrorCode.USER_LAST_ADMIN_DENIED,
        message: 'システム内に有効な管理者が1人のみのため、無効化または降格できません。',
      })
    }
  }

  // loginId 変更時の重複チェック
  if (body.loginId && body.loginId !== targetUser.loginId) {
    const existing = await prisma.user.findUnique({
      where: { loginId: body.loginId },
    })

    if (existing) {
      throw createAppError({
        code: ErrorCode.USER_LOGIN_ID_DUPLICATE,
        message: '指定されたログインIDは既に使用されています。',
        details: { field: 'loginId', value: body.loginId },
      })
    }
  }

  const siteConnections = (body.assignedSiteIds || []).map((sid: string) => ({ id: sid }))

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      loginId: body.loginId,
      firstName: body.firstName,
      lastName: body.lastName,
      firstNameKana: body.firstNameKana,
      lastNameKana: body.lastNameKana,
      role: body.role,
      email: body.email,
      isActive: body.isActive,
      assignedSites: { set: siteConnections }, // Override relations
    },
    include: { assignedSites: true },
  })

  const assignedSiteIds = updatedUser.assignedSites.map(s => s.id)
  const { password: _dbPassword, assignedSites: _assignedSites, ...restUser } = updatedUser

  return { ...restUser, assignedSiteIds }
})
