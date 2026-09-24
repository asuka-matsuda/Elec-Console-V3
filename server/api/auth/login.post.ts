/**
 * ログイン認証 API
 * POST /api/auth/login
 *
 * @description ユーザーID・パスワードによる認証を行い、セッショントークンを発行します。二重レートリミット保護を備えます。
 * @permission パブリック（未認証可）
 */

import { defineEventHandler, getRequestIP, readBody, setCookie } from 'h3'

import { ErrorCode } from '#shared/types/errors'

import { generateAuthToken } from '../../utils/auth'
import { createAppError } from '../../utils/error'
import { hashPassword, needsRehash, verifyPassword } from '../../utils/password'
import { prisma } from '../../utils/prisma'
import { checkRateLimit, clearRateLimit, recordFailedAttempt } from '../../utils/rateLimit'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { loginId, password } = body

  if (!loginId || !password || typeof loginId !== 'string' || typeof password !== 'string') {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: 'ログインIDとパスワードを入力してください。',
    })
  }

  const clientIp = getRequestIP(event, { xForwardedFor: true }) || '127.0.0.1'
  const ipKey = `login:ip:${clientIp}`
  const accountKey = `login:account:${loginId.trim()}`

  // レートリミット（ブルートフォース保護）の二重チェック
  // 1. IP単位の過剰失敗チェック (15分に15回)
  const ipLimitStatus = checkRateLimit(ipKey, 15)

  if (ipLimitStatus.isBlocked) {
    const remainingMinutes = Math.ceil(ipLimitStatus.remainingMs / 60000)

    throw createAppError({
      code: ErrorCode.SYS_RATE_LIMITED,
      message: `この接続元からのログイン試行が制限されています。安全のため約${remainingMinutes}分後に再度お試しください。`,
      details: { remainingMinutes },
    })
  }

  // 2. アカウント単位の連続失敗チェック (5回)
  const accountLimitStatus = checkRateLimit(accountKey, 5)

  if (accountLimitStatus.isBlocked) {
    const remainingMinutes = Math.ceil(accountLimitStatus.remainingMs / 60000)

    throw createAppError({
      code: ErrorCode.SYS_RATE_LIMITED,
      message: `該当アカウントのログイン試行回数が上限を超えました。安全のため約${remainingMinutes}分後に再度お試しください。`,
      details: { remainingMinutes },
    })
  }

  const user = await prisma.user.findUnique({
    where: { loginId: loginId.trim() },
    include: { assignedSites: true, siteAssignments: true },
  })

  // ユーザーが存在しない場合
  if (!user) {
    recordFailedAttempt(ipKey, 15)
    recordFailedAttempt(accountKey, 5)
    throw createAppError({
      code: ErrorCode.AUTH_INVALID_CREDENTIALS,
      message: 'ログインIDまたはパスワードが違います。',
    })
  }

  // アカウント無効化チェック
  if (!user.isActive) {
    throw createAppError({
      code: ErrorCode.AUTH_ACCOUNT_INACTIVE,
      message: 'このアカウントは無効化されています。管理者にお問い合わせください。',
    })
  }

  // パスワード検証（タイミングセーフ）
  const isValid = verifyPassword(password, user.password)

  if (!isValid) {
    recordFailedAttempt(ipKey, 15)
    recordFailedAttempt(accountKey, 5)
    throw createAppError({
      code: ErrorCode.AUTH_INVALID_CREDENTIALS,
      message: 'ログインIDまたはパスワードが違います。',
    })
  }

  // 認証成功: レートリミットカウントをクリア
  clearRateLimit(accountKey)
  clearRateLimit(ipKey)

  // 旧ハッシュ（10000回）の場合は新形式（100000回）へ自動アップグレード移行
  const updateData: { lastLoginAt: Date, password?: string } = {
    lastLoginAt: new Date(),
  }

  if (needsRehash(user.password)) {
    updateData.password = hashPassword(password)
  }

  await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  })

  // 暗号署名付きセッショントークンの発行
  const token = generateAuthToken(user)

  // クッキーにも安全な属性を付与して保存
  setCookie(event, 'auth_token', token, {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
  })

  const assignedSiteIds = user.assignedSites.map(s => s.id)
  const siteAssignments = user.assignedSites.map((s) => {
    const match = user.siteAssignments.find(sa => sa.siteId === s.id)

    return {
      siteId: s.id,
      role: match?.role || user.role || 'worker',
    }
  })
  const { password: _dbPassword, assignedSites: _assignedSites, siteAssignments: _sa, ...restUser } = user
  const safeUser = { ...restUser, assignedSiteIds, siteAssignments }

  return {
    success: true,
    token,
    user: safeUser,
    mustChangePassword: user.requirePasswordReset,
    serverTime: new Date().toISOString(),
  }
})
