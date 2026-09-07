import { createError, defineEventHandler, readBody } from 'h3'

import { requireAdminUser } from '../../utils/auth'
import { generateRandomPassword, hashPassword } from '../../utils/password'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const body = await readBody(event)

  if (!body.loginId || !body.firstName || !body.lastName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'ログインID、姓、名は必須項目です。',
    })
  }

  // ログインID重複チェック
  const existingUser = await prisma.user.findUnique({
    where: { loginId: body.loginId.trim() },
  })

  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'このログインIDは既に使用されています。別のIDを指定してください。',
    })
  }

  // パスワードが指定されていない場合は安全なランダム初期パスワードを生成
  const rawPassword = body.password ? String(body.password) : generateRandomPassword(10)
  const isGenerated = !body.password
  const initialPassword = isGenerated ? rawPassword : undefined

  const siteConnections = (body.assignedSiteIds || []).map((id: string) => ({ id }))

  const newUser = await prisma.user.create({
    data: {
      loginId: body.loginId.trim(),
      password: hashPassword(rawPassword),
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
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
