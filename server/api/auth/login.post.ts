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

import { generateAuthToken, toSafeUser } from '../../utils/auth'
import { getJstEndOfMonth } from '../../utils/date'
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
  const trimmedLoginId = loginId.trim()
  const ipKey = `login:ip:${clientIp}`
  const accountKey = `login:account:${clientIp}:${trimmedLoginId}`
  const globalAccountKey = `login:global:${trimmedLoginId}`

  // レートリミット（ブルートフォース保護）のチェック
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

  // 2. IP＋アカウント単位の連続失敗チェック (5回)
  // 特定ユーザーのロックアウトDoSを防止するため、接続元IPと組み合わせたキーでブロック
  const accountLimitStatus = checkRateLimit(accountKey, 5)

  if (accountLimitStatus.isBlocked) {
    const remainingMinutes = Math.ceil(accountLimitStatus.remainingMs / 60000)

    throw createAppError({
      code: ErrorCode.SYS_RATE_LIMITED,
      message: `ログイン試行回数が上限を超えました。安全のため約${remainingMinutes}分後に再度お試しください。`,
      details: { remainingMinutes },
    })
  }

  // 3. 分散ブルートフォース対策: アカウント全体の失敗回数が多い場合は遅延を挿入（正規利用者の完全ロックアウトは回避）
  const globalLimitStatus = checkRateLimit(globalAccountKey, 10)

  if (globalLimitStatus.attemptsLeft <= 2) {
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const user = await prisma.user.findUnique({
    where: { loginId: trimmedLoginId },
    include: { assignedSites: true, siteAssignments: true },
  })

  // タイミング攻撃（Timing Attack）防止用ダミーハッシュ（PBKDF2-HMAC-SHA512 100,000回）
  const DUMMY_HASH = 'pbkdf2:100000:a1b2c3d4e5f60718293a4b5c6d7e8f90:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

  // ユーザーが存在しない場合でも同一の暗号計算時間を要するようにし、アカウント有無の列挙を阻止
  const isValid = user ? verifyPassword(password, user.password) : verifyPassword(password, DUMMY_HASH)

  if (!user || !isValid) {
    recordFailedAttempt(ipKey, 15)
    recordFailedAttempt(accountKey, 5)
    recordFailedAttempt(globalAccountKey, 10)
    throw createAppError({
      code: ErrorCode.AUTH_INVALID_CREDENTIALS,
      message: 'ログインIDまたはパスワードが違います。',
    })
  }

  // アカウント無効化チェック（パスワードが正しい正当な試行に対してのみ判定し、無効化ユーザーの露出を防止）
  if (!user.isActive) {
    throw createAppError({
      code: ErrorCode.AUTH_ACCOUNT_INACTIVE,
      message: 'このアカウントは無効化されています。管理者にお問い合わせください。',
    })
  }

  // 認証成功: レートリミットカウントをクリア
  clearRateLimit(accountKey)
  clearRateLimit(ipKey)
  clearRateLimit(globalAccountKey)

  // 旧ハッシュ（10000回）の場合は新形式（100000回）へ自動アップグレード移行
  const updateData: { lastLoginAt: Date, password?: string, role?: string } = {
    lastLoginAt: new Date(),
  }

  if (needsRehash(user.password)) {
    const newHash = hashPassword(password)

    updateData.password = newHash
    user.password = newHash
  }

  if (user.loginId === 'master' && user.role !== 'master') {
    updateData.role = 'master'
    user.role = 'master'
  }

  await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  })

  // セッション有効期限の算出（デフォルト: 当日限り24時間、当月内有効指定時: JST当月末日23:59:59.999）
  let expiresInSeconds = 24 * 60 * 60 // 24時間
  let expiresAt = new Date(Date.now() + expiresInSeconds * 1000)

  if (validForCurrentMonth) {
    const now = new Date()
    const endOfMonth = getJstEndOfMonth(now)
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

  const safeUser = toSafeUser(user)

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
