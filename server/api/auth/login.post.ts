/**
 * ログイン認証 API
 * POST /api/auth/login
 *
 * @description ユーザーID・パスワードによる認証を行い、セッショントークンを発行します。二重レートリミット保護を備えます。
 * @permission パブリック（未認証可）
 */

import { defineEventHandler, getRequestIP, setCookie } from 'h3'
import { z } from 'zod'

import { ErrorCode } from '#shared/types/errors'

import { generateAuthToken } from '../../utils/auth'
import { createAppError } from '../../utils/error'
import { hashPassword, needsRehash, verifyPassword } from '../../utils/password'
import { prisma } from '../../utils/prisma'
import { checkRateLimit, clearRateLimit, recordFailedAttempt } from '../../utils/rateLimit'
import { validateRequestBody } from '../../utils/validation'

const LoginBodySchema = z.object({
  loginId: z.string().min(1, 'ログインIDとパスワードを入力してください。'),
  password: z.string().min(1, 'ログインIDとパスワードを入力してください。'),
  validForCurrentMonth: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const { loginId, password, validForCurrentMonth } = await validateRequestBody(event, LoginBodySchema)

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

  // セッション有効期限の算出（デフォルト: 当日限り24時間、当月内有効指定時: 当月末日23:59:59）
  let expiresInSeconds = 24 * 60 * 60 // 24時間
  let expiresAt = new Date(Date.now() + expiresInSeconds * 1000)

  if (validForCurrentMonth) {
    const now = new Date()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    const remainingSeconds = Math.floor((endOfMonth.getTime() - now.getTime()) / 1000)

    expiresInSeconds = Math.max(60, remainingSeconds)
    expiresAt = endOfMonth
  }

  // 暗号署名付きセッショントークンの発行
  const token = generateAuthToken(user, expiresInSeconds)

  // クッキーにも安全な属性を付与して保存
  setCookie(event, 'auth_token', token, {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: expiresInSeconds,
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
    expiresAt: expiresAt.toISOString(),
    expiresInSeconds,
  }
})
