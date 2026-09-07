import { createError, defineEventHandler, getRequestIP, readBody, setCookie } from 'h3'

import { generateAuthToken } from '../../utils/auth'
import { hashPassword, needsRehash, verifyPassword } from '../../utils/password'
import { prisma } from '../../utils/prisma'
import { checkRateLimit, clearRateLimit, recordFailedAttempt } from '../../utils/rateLimit'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { loginId, password } = body

  if (!loginId || !password || typeof loginId !== 'string' || typeof password !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'ログインIDとパスワードを入力してください。',
    })
  }

  const clientIp = getRequestIP(event, { xForwardedFor: true }) || '127.0.0.1'
  const rateLimitKey = `login:${clientIp}:${loginId.trim()}`

  // レートリミット（ブルートフォース保護）のチェック
  const rateLimitStatus = checkRateLimit(rateLimitKey)

  if (rateLimitStatus.isBlocked) {
    const remainingMinutes = Math.ceil(rateLimitStatus.remainingMs / 60000)

    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: `ログイン試行回数が上限を超えました。安全のため約${remainingMinutes}分後に再度お試しください。`,
    })
  }

  const user = await prisma.user.findUnique({
    where: { loginId: loginId.trim() },
    include: { assignedSites: true },
  })

  // ユーザーが存在しない場合
  if (!user) {
    recordFailedAttempt(rateLimitKey)
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'ログインIDまたはパスワードが違います。',
    })
  }

  // アカウント無効化チェック
  if (!user.isActive) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Account is inactive',
      message: 'このアカウントは無効化されています。管理者にお問い合わせください。',
    })
  }

  // パスワード検証（タイミングセーフ）
  const isValid = verifyPassword(password, user.password)

  if (!isValid) {
    recordFailedAttempt(rateLimitKey)
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'ログインIDまたはパスワードが違います。',
    })
  }

  // 認証成功: レートリミットカウントをクリア
  clearRateLimit(rateLimitKey)

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
  const { password: _dbPassword, assignedSites: _assignedSites, ...restUser } = user
  const safeUser = { ...restUser, assignedSiteIds }

  return {
    success: true,
    token,
    user: safeUser,
    mustChangePassword: user.requirePasswordReset,
    serverTime: new Date().toISOString(),
  }
})
