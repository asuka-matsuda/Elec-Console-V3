import crypto from 'node:crypto'

import {
  createError,
  defineEventHandler,
  getCookie,
  getQuery,
  getRequestURL,
  removeResponseHeader,
  sendRedirect,
  setCookie,
  setHeader,
} from 'h3'

import { verifyAuthToken } from '../utils/auth'

/**
 * ゲートキートークンの取得（環境変数または初期デフォルト値）
 */
function getGateToken(): string | null {
  const token = process.env.ACCESS_GATE_TOKEN

  if (token && token !== 'none' && token !== 'disabled' && token !== 'off' && token !== '') {
    return token
  }

  return null
}

/**
 * 通行証Cookieの署名検証用ハッシュ生成
 */
function generateGateSignature(secretToken: string): string {
  return crypto.createHmac('sha256', secretToken).update('elec_console_gate_granted').digest('hex')
}

// 静的アセット・ログインエンドポイントなど、ゲートキー不要でアクセスを許可すべきパス
const WHITELIST_PATHS = [
  '/login',
  '/api/auth/login',
  '/_nuxt',
  '/__nuxt',
  '/manifest.webmanifest',
  '/sw.js',
  '/workbox-',
  '/icons/',
  '/images/',
  '/favicon.ico',
  '/robots.txt',
  '/theme-init.js',
]

export default defineEventHandler(async (event) => {
  // 1. レスポンスヘッダーからサーバー識別情報を徹底除去
  removeResponseHeader(event, 'x-powered-by')
  removeResponseHeader(event, 'server')
  setHeader(event, 'X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet')

  const url = getRequestURL(event)
  const pathname = url.pathname

  // 2. Path Traversal（..）やヌルバイト（%00）などの危険なリクエストを即座に遮断
  if (
    pathname.includes('..')
    || pathname.includes('%2e%2e')
    || pathname.includes('\0')
    || pathname.includes('%00')
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Invalid request path',
    })
  }

  // 3. シークレットURL・ゲートキーパー機構（URLを知らない人・Botの完全ステルス化）
  const requiredGateToken = getGateToken()

  // ゲートトークンが無効化（空文字等）されている場合はスキップ
  if (!requiredGateToken) {
    return
  }

  // 静的リソース（PWAマニフェスト、アイコン等）は許可
  const isWhitelisted = WHITELIST_PATHS.some(p => pathname.startsWith(p))

  if (isWhitelisted) {
    return
  }

  const expectedGateSignature = generateGateSignature(requiredGateToken)
  const query = getQuery(event)
  const gateParam = (query.gate || query.access_key || query.k) as string | undefined

  // パターンA: 秘密のキー付きURLを踏んでアクセスした場合（例: /?gate=XXXX）
  if (gateParam && typeof gateParam === 'string') {
    // タイミング攻撃防止比較
    const bufA = Buffer.from(gateParam)
    const bufB = Buffer.from(requiredGateToken)

    const isMatch = bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)

    if (isMatch) {
      // 通行証Cookie（180日間有効、HttpOnly、SameSite=Lax）を発行
      setCookie(event, 'elec_gate_pass', expectedGateSignature, {
        path: '/',
        maxAge: 60 * 60 * 24 * 180, // 180日
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      })

      // クエリパラメータを取り除いたURLへ綺麗にリダイレクト
      const cleanUrl = new URL(url.toString())

      cleanUrl.searchParams.delete('gate')
      cleanUrl.searchParams.delete('access_key')
      cleanUrl.searchParams.delete('k')

      const redirectPath = cleanUrl.pathname + (cleanUrl.search ? cleanUrl.search : '')

      return sendRedirect(event, redirectPath || '/', 302)
    }
  }

  // パターンB: 既に通行証Cookieを持っている端末
  const gateCookie = getCookie(event, 'elec_gate_pass')

  if (gateCookie && gateCookie === expectedGateSignature) {
    return
  }

  // パターンC: 既にログインセッショントークンを正当に持っている場合
  const authToken = getCookie(event, 'auth_token')

  if (authToken && verifyAuthToken(authToken)) {
    return
  }

  // パターンD: ゲートキー未所持・未承認アクセス
  // サイトの存在自体を隠蔽するため「404 Not Found」を返却し、Botや外部の探索を完全に無駄骨にさせる
  throw createError({
    statusCode: 404,
    statusMessage: 'Not Found',
    message: 'The requested resource was not found.',
  })
})
