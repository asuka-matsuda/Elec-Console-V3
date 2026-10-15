/**
 * ユーザー情報更新 API
 * PUT /api/users/:id
 *
 * @description ユーザーの表示名、権限ロール、有効/無効フラグ、担当現場割り当てを更新します。
 * @permission マスター管理者限定
 */

import { defineEventHandler, getRouterParam, readBody } from 'h3'

import { ErrorCode } from '#shared/types/errors'

import { requireMasterUser, toSafeUser } from '../../utils/auth'
import { createAppError } from '../../utils/error'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const authUser = await requireMasterUser(event)
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
    if (body.role && body.role !== 'master' && body.role !== 'admin') {
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
    if (body.role && body.role !== 'master' && body.role !== 'admin') {
      throw createAppError({
        code: ErrorCode.USER_SELF_DEMOTION_DENIED,
        message: '自分自身の管理者権限を剥奪することはできません。',
      })
    }
  }

  // ログインIDは1人1ID不変のため作成後の変更を禁止
  if (body.loginId && body.loginId.trim() !== targetUser.loginId) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: 'ログインIDは作成後に変更できません。',
      details: { field: 'loginId', value: body.loginId },
    })
  }

  const validSiteRoles = new Set(['admin', 'worker', 'viewer'])
  const siteAssignmentsInput: { siteId: string, role: string }[] | undefined = body.siteAssignments !== undefined
    ? body.siteAssignments
    : body.assignedSiteIds !== undefined
      ? (body.assignedSiteIds || []).map((sid: string) => ({ siteId: sid, role: 'worker' }))
      : undefined

  if (siteAssignmentsInput) {
    for (const sa of siteAssignmentsInput) {
      if (!sa.siteId || (sa.role && !validSiteRoles.has(sa.role))) {
        throw createAppError({
          code: ErrorCode.SYS_VALIDATION_FAILED,
          message: '現場の割り当てロールが不正です。',
        })
      }
    }
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    if (siteAssignmentsInput !== undefined) {
      await tx.userOnSite.deleteMany({ where: { userId: id } })

      if (siteAssignmentsInput.length > 0) {
        await tx.userOnSite.createMany({
          data: siteAssignmentsInput.map(sa => ({
            userId: id,
            siteId: sa.siteId,
            role: sa.role || 'worker',
          })),
        })
      }
    }

    return tx.user.update({
      where: { id },
      data: {
        firstName: body.firstName !== undefined ? String(body.firstName).trim() : undefined,
        lastName: body.lastName !== undefined ? String(body.lastName).trim() : undefined,
        firstNameKana: body.firstNameKana !== undefined ? (body.firstNameKana?.trim() || null) : undefined,
        lastNameKana: body.lastNameKana !== undefined ? (body.lastNameKana?.trim() || null) : undefined,
        role: targetUser.loginId === 'master' ? 'master' : 'worker',
        email: body.email !== undefined ? (body.email?.trim() || null) : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
        requirePasswordReset: body.requirePasswordReset !== undefined ? Boolean(body.requirePasswordReset) : undefined,
        ...(siteAssignmentsInput !== undefined
          ? { assignedSites: { set: siteAssignmentsInput.map(sa => ({ id: sa.siteId })) } }
          : {}),
      },
      include: { assignedSites: true, siteAssignments: true },
    })
  })

  return toSafeUser(updatedUser)
})
