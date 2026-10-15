/**
 * ユーザー新規登録 API
 * POST /api/users
 *
 * @description 新規ユーザーアカウントを作成し、初期パスワードおよび担当現場を割り当てます。
 * @permission マスター管理者限定
 */

import { defineEventHandler, readBody } from 'h3'

import { ErrorCode } from '#shared/types/errors'

import { requireMasterUser, toSafeUser } from '../../utils/auth'
import { createAppError } from '../../utils/error'
import { generateRandomPassword, hashPassword } from '../../utils/password'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireMasterUser(event)
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

  // パスワードが指定されている場合は8文字以上を要求し、未指定時は安全なランダム初期パスワードを生成
  if (body.password !== undefined && body.password !== null && String(body.password).length > 0 && String(body.password).length < 8) {
    throw createAppError({
      code: ErrorCode.AUTH_PASSWORD_POLICY_VIOLATION,
      message: '初期パスワードを指定する場合は8文字以上で設定してください。',
    })
  }

  const rawPassword = body.password ? String(body.password) : generateRandomPassword(10)
  const isGenerated = !body.password
  const initialPassword = isGenerated ? rawPassword : undefined

  const validSiteRoles = new Set(['admin', 'worker', 'viewer'])
  const siteAssignmentsInput: { siteId: string, role: string }[] = body.siteAssignments
    || (body.assignedSiteIds || []).map((id: string) => ({ siteId: id, role: 'worker' }))

  for (const sa of siteAssignmentsInput) {
    if (!sa.siteId || (sa.role && !validSiteRoles.has(sa.role))) {
      throw createAppError({
        code: ErrorCode.SYS_VALIDATION_FAILED,
        message: '現場の割り当てロールが不正です。',
      })
    }
  }

  const siteConnections = siteAssignmentsInput.map(sa => ({ id: sa.siteId }))

  const newUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        loginId,
        password: hashPassword(rawPassword),
        firstName,
        lastName,
        firstNameKana: body.firstNameKana?.trim() || null,
        lastNameKana: body.lastNameKana?.trim() || null,
        role: loginId === 'master' ? 'master' : 'worker',
        requirePasswordReset: body.requirePasswordReset ?? true,
        email: body.email?.trim() || null,
        isActive: body.isActive ?? true,
        assignedSites: { connect: siteConnections },
      },
      include: { assignedSites: true },
    })

    if (siteAssignmentsInput.length > 0) {
      await tx.userOnSite.createMany({
        data: siteAssignmentsInput.map(sa => ({
          userId: user.id,
          siteId: sa.siteId,
          role: sa.role || 'worker',
        })),
      })
    }

    return tx.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { assignedSites: true, siteAssignments: true },
    })
  })

  return {
    ...toSafeUser(newUser),
    initialPassword,
  }
})
