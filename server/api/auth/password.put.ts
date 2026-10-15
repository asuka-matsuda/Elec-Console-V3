/**
 * パスワード更新 API
 * PUT /api/auth/password
 *
 * @description ログイン中ユーザー自身のパスワードを更新し、初回ログインフラグ等を解除します。
 * @permission 認証済みユーザー
 */

import { defineEventHandler, getRequestIP, readBody, setCookie } from 'h3'

import { ErrorCode } from '#shared/types/errors'

import { generateAuthToken, requireAuthUser } from '../../utils/auth'
import { createAppError } from '../../utils/error'
import { hashPassword, verifyPassword } from '../../utils/password'
import { prisma } from '../../utils/prisma'
import { checkRateLimit, clearRateLimit, recordFailedAttempt } from '../../utils/rateLimit'

export default defineEventHandler(async (event) => {
  const authUser = await requireAuthUser(event)
  const clientIp = getRequestIP(event, { xForwardedFor: true }) || '127.0.0.1'
  const rateLimitKey = `password_change:${authUser.id}:${clientIp}`

  // ブルートフォース保護（5回連続失敗でロック）
  const limitStatus = checkRateLimit(rateLimitKey, 5)

  if (limitStatus.isBlocked) {
    const remainingMinutes = Math.ceil(limitStatus.remainingMs / 60000)

    throw createAppError({
      code: ErrorCode.SYS_RATE_LIMITED,
      message: `パスワード変更の試行回数が上限を超えました。安全のため約${remainingMinutes}分後に再度お試しください。`,
      details: { remainingMinutes },
    })
  }

  const body = await readBody(event)
  const { currentPassword, newPassword } = body || {}

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    throw createAppError({
      code: ErrorCode.AUTH_PASSWORD_POLICY_VIOLATION,
      message: '新しいパスワードは8文字以上で設定してください。',
    })
  }

  const user = await prisma.user.findUnique({ where: { id: authUser.id } })

  if (!user) {
    throw createAppError({
      code: ErrorCode.USER_NOT_FOUND,
      message: 'ユーザーが見つかりません。',
    })
  }

  // 初回強制リセット（requirePasswordReset === true）以外の通常パスワード変更時は、現在のパスワード入力を必須化して厳格検証
  if (!user.requirePasswordReset) {
    if (!currentPassword || typeof currentPassword !== 'string') {
      throw createAppError({
        code: ErrorCode.SYS_VALIDATION_FAILED,
        message: '現在のパスワードを入力してください。',
      })
    }

    if (!verifyPassword(currentPassword, user.password)) {
      recordFailedAttempt(rateLimitKey, 5)
      throw createAppError({
        code: ErrorCode.AUTH_INVALID_CREDENTIALS,
        message: '現在のパスワードが間違っています。',
      })
    }

    if (currentPassword === newPassword) {
      throw createAppError({
        code: ErrorCode.AUTH_PASSWORD_POLICY_VIOLATION,
        message: '現在のパスワードとは異なるパスワードを設定してください。',
      })
    }
  }

  const hashedPassword = hashPassword(newPassword)

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      requirePasswordReset: false,
    },
  })

  // 新しいパスワードに対応する暗号署名付きセッショントークンを発行（24時間有効期限に統一）
  const expiresInSeconds = 24 * 60 * 60
  const newToken = generateAuthToken(updatedUser, expiresInSeconds)

  setCookie(event, 'auth_token', newToken, {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: expiresInSeconds,
  })

  // 成功時: レートリミットをクリア
  clearRateLimit(rateLimitKey)

  return { success: true, token: newToken }
})
