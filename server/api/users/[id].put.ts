import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'

import { requireAdminUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const authUser = await requireAdminUser(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'ユーザーIDが指定されていません。',
    })
  }

  const targetUser = await prisma.user.findUnique({ where: { id } })

  if (!targetUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'ユーザーが見つかりません。',
    })
  }

  // master アカウントの保護（ログインIDの変更、無効化、一般作業員への降格を禁止）
  if (targetUser.loginId === 'master') {
    if (body.loginId && body.loginId !== 'master') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'マスター管理者のログインIDを変更することはできません。',
      })
    }
    if (body.isActive === false) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'マスター管理者を無効化することはできません。',
      })
    }
    if (body.role && body.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'マスター管理者の権限を降格することはできません。',
      })
    }
  }

  // 自身のアカウントの無効化・降格の禁止
  if (targetUser.id === authUser.id) {
    if (body.isActive === false) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: '自分自身のアカウントを無効化することはできません。',
      })
    }
    if (body.role && body.role !== 'admin') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
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
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
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
      throw createError({
        statusCode: 409,
        statusMessage: 'Conflict',
        message: '指定されたログインIDは既に使用されています。',
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
