import crypto from 'crypto'
import fs from 'fs'
import type { H3Event } from 'h3'
import { createError, getCookie, getHeader, getRouterParam } from 'h3'
import path from 'path'

import { prisma } from './prisma'

export interface SafeUser {
  id: string
  loginId: string
  firstName: string
  lastName: string
  firstNameKana: string | null
  lastNameKana: string | null
  role: string
  requirePasswordReset: boolean
  email: string | null
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
  assignedSiteIds: string[]
}

export interface TokenPayload {
  uid: string
  loginId: string
  role: string
  iat: number
  exp: number
}

// サーバー秘密鍵の取得または生成（永続化ファイル or メモリ）
let cachedSecret: string | null = null

export function getAuthSecret(): string {
  if (process.env.AUTH_SECRET) {
    return process.env.AUTH_SECRET
  }

  if (cachedSecret) {
    return cachedSecret
  }

  const secretFilePath = path.resolve(process.cwd(), '.data', 'auth_secret')

  try {
    if (fs.existsSync(secretFilePath)) {
      const content = fs.readFileSync(secretFilePath, 'utf8').trim()

      if (content.length >= 32) {
        cachedSecret = content

        return cachedSecret
      }
    }

    // 新規シークレット生成
    const newSecret = crypto.randomBytes(32).toString('hex')
    const dir = path.dirname(secretFilePath)

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(secretFilePath, newSecret, { mode: 0o600 })
    cachedSecret = newSecret

    return cachedSecret
  }
  catch {
    // ファイルシステムに書き込めない環境でのフォールバック
    if (!cachedSecret) {
      cachedSecret = crypto.randomBytes(32).toString('hex')
    }

    return cachedSecret
  }
}

/**
 * 暗号署名付きセッショントークンを生成する (HMAC-SHA256)
 * 有効期限: 7日間
 */
export function generateAuthToken(
  user: { id: string, loginId: string, role: string },
  expiresInSeconds = 7 * 24 * 60 * 60,
): string {
  const now = Math.floor(Date.now() / 1000)
  const payload: TokenPayload = {
    uid: user.id,
    loginId: user.loginId,
    role: user.role,
    iat: now,
    exp: now + expiresInSeconds,
  }

  const secret = getAuthSecret()
  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(payloadEncoded).digest('base64url')

  return `${payloadEncoded}.${signature}`
}

/**
 * 暗号署名付きトークンの検証
 */
export function verifyAuthToken(token: string): TokenPayload | null {
  if (!token || typeof token !== 'string') return null

  const parts = token.split('.')

  if (parts.length !== 2) return null

  const [payloadEncoded, signature] = parts

  if (!payloadEncoded || !signature) return null

  try {
    const secret = getAuthSecret()
    const expectedSig = crypto.createHmac('sha256', secret).update(payloadEncoded).digest('base64url')

    const bufA = Buffer.from(signature)
    const bufB = Buffer.from(expectedSig)

    if (bufA.length !== bufB.length) return null
    if (!crypto.timingSafeEqual(bufA, bufB)) return null

    const payloadJson = Buffer.from(payloadEncoded, 'base64url').toString('utf8')
    const payload = JSON.parse(payloadJson) as TokenPayload

    // 有効期限の確認
    if (!payload.exp || payload.exp * 1000 <= Date.now()) {
      return null
    }

    return payload
  }
  catch {
    return null
  }
}

/**
 * リクエストの Authorization ヘッダーまたは Cookie から認証トークンを抽出し、
 * 該当するユーザー情報を返します（未認証時・改ざん検知時は null を返す）。
 */
export async function getAuthUser(event: H3Event): Promise<SafeUser | null> {
  const authHeader = getHeader(event, 'Authorization')
  const cookieToken = getCookie(event, 'auth_token')

  let token = ''

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.replace('Bearer ', '')
  }
  else if (cookieToken) {
    token = cookieToken
  }

  if (!token) {
    return null
  }

  const verified = verifyAuthToken(token)

  if (!verified) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: verified.uid },
    include: { assignedSites: true },
  })

  if (!user || !user.isActive || user.loginId !== verified.loginId) {
    return null
  }

  const assignedSiteIds = user.assignedSites.map(s => s.id)
  const { password: _dbPassword, assignedSites: _assignedSites, ...restUser } = user

  return { ...restUser, assignedSiteIds }
}

/**
 * ログイン認証必須ガード。未認証の場合は 401 Unauthorized を throw します。
 */
export async function requireAuthUser(event: H3Event): Promise<SafeUser> {
  const user = await getAuthUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: '認証が必要です。再度ログインしてください。',
    })
  }

  return user
}

/**
 * 管理者権限必須ガード。未認証時は 401、非管理者の場合は 403 Forbidden を throw します。
 */
export async function requireAdminUser(event: H3Event): Promise<SafeUser> {
  const user = await requireAuthUser(event)

  if (user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: '管理者権限が必要です。',
    })
  }

  return user
}

/**
 * 全現場アクセス権限を持つスーパーユーザー（master / 松田飛鳥氏）か判定
 */
export function isSuperUser(user: SafeUser): boolean {
  return user.loginId === 'master'
}

/**
 * 特定の現場へのアクセス権限を有しているか判定
 * 全現場アクセスは master アカウントのみに限定され、一般 admin を含む他ユーザーは assignedSiteIds に従う
 */
export function canAccessSite(user: SafeUser, siteId: string): boolean {
  if (isSuperUser(user)) {
    return true
  }

  return user.assignedSiteIds.includes(siteId)
}

/**
 * 現場アクセス認可ガード (BOLA / IDOR 防御)
 * ユーザーが該当現場にアクセス可能であることを検証し、権限外の場合は 403 Forbidden を throw
 */
export async function requireSiteAccess(event: H3Event, siteId?: string): Promise<SafeUser> {
  const user = await requireAuthUser(event)
  const resolvedSiteId = siteId || (getRouterParam(event, 'siteId') as string)

  if (!resolvedSiteId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: '現場IDが指定されていません。',
    })
  }

  if (!canAccessSite(user, resolvedSiteId)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'この現場へのアクセス権限がありません。',
    })
  }

  return user
}
