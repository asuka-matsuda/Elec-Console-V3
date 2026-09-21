import { defineEventHandler, readBody } from 'h3'

import { ErrorCode } from '#shared/types/errors'

import { requireAdminUser } from '../../utils/auth'
import { createAppError } from '../../utils/error'
import { generateRandomPassword, hashPassword } from '../../utils/password'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const body = await readBody(event)

  const loginId = (body.loginId || body.id)?.trim()
  const firstName = body.firstName?.trim()
  const lastName = body.lastName?.trim()

  if (!loginId || !firstName || !lastName) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: 'ログインID、姓、名は必須項目です。',
      details: {
        missingFields: [
          !loginId && 'loginId',
          !lastName && 'lastName',
          !firstName && 'firstName',
        ].filter(Boolean),
      },
    })
  }

  // ログインID重複チェック
  const existingUser = await prisma.user.findUnique({
    where: { loginId },
  })

  if (existingUser) {
    throw createAppError({
      code: ErrorCode.USER_LOGIN_ID_DUPLICATE,
      message: 'このログインIDは既に使用されています。別のIDを指定してください。',
      details: { field: 'loginId', value: loginId },
    })
  }

  // パスワードが指定されていない場合は安全なランダム初期パスワードを生成
  const rawPassword = body.password ? String(body.password) : generateRandomPassword(10)
  const isGenerated = !body.password
  const initialPassword = isGenerated ? rawPassword : undefined

  const siteConnections = (body.assignedSiteIds || []).map((id: string) => ({ id }))

  const newUser = await prisma.user.create({
    data: {
      loginId,
      password: hashPassword(rawPassword),
      firstName,
      lastName,
      firstNameKana: body.firstNameKana?.trim() || null,
      lastNameKana: body.lastNameKana?.trim() || null,
      role: body.role || 'worker',
      requirePasswordReset: body.requirePasswordReset ?? true,
      email: body.email?.trim() || null,
      isActive: body.isActive ?? true,
      assignedSites: { connect: siteConnections },
    },
    include: { assignedSites: true },
  })

  const assignedSiteIds = newUser.assignedSites.map(s => s.id)
  const { password: _dbPassword, assignedSites: _assignedSites, ...restUser } = newUser

  return {
    ...restUser,
    assignedSiteIds,
    initialPassword,
  }
})
