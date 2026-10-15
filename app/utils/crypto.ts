/**
 * クライアント側暗号化・パスワード検証ユーティリティ (Web Crypto API)
 *
 * オフライン環境における安全なクレデンシャル照合を提供します。
 * 外部ライブラリに依存せず、ブラウザ標準の Web Crypto API (PBKDF2-HMAC-SHA256) を使用します。
 */

const DEFAULT_ITERATIONS = 10000
const KEY_LENGTH_BITS = 256

/**
 * ランダムソルト（16進数文字列）を生成
 */
export function generateSalt(length = 16): string {
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    throw new Error('暗号学的に安全な乱数生成器 (crypto.getRandomValues) が利用できません')
  }

  const bytes = new Uint8Array(length)

  crypto.getRandomValues(bytes)

  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * HTTP LAN（非セキュアコンテキスト）環境でも安全に動作する UUID v4 生成ヘルパー
 */
export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)

    crypto.getRandomValues(bytes)
    bytes[6] = ((bytes[6] ?? 0) & 0x0F) | 0x40
    bytes[8] = ((bytes[8] ?? 0) & 0x3F) | 0x80

    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
  }

  throw new Error('Web Crypto API (crypto.getRandomValues) が利用できません')
}

/**
 * 16進数文字列を Uint8Array に変換
 */
function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.trim()

  if (!cleanHex || cleanHex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(cleanHex)) {
    throw new Error('無効な16進数ソルト文字列です')
  }

  const bytes = new Uint8Array(cleanHex.length / 2)

  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16)
  }

  return bytes
}

/**
 * ArrayBuffer を 16進数文字列に変換
 */
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)

  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * パスワードとソルトから PBKDF2-HMAC-SHA256 ハッシュを導出
 */
export async function hashPasswordClient(
  password: string,
  saltHex: string,
  iterations = DEFAULT_ITERATIONS,
): Promise<string> {
  const subtle = typeof crypto !== 'undefined' ? crypto.subtle : null

  if (!subtle) {
    throw new Error('非HTTPS環境のためオフラインパスワード照合（Web Crypto API）を利用できません。オンライン状態でログインしてください。')
  }

  const enc = new TextEncoder()
  const keyMaterial = await subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  )

  const saltBytes = hexToBytes(saltHex)

  const derivedBits = await subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes as unknown as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH_BITS,
  )

  return bufferToHex(derivedBits)
}

/**
 * 入力されたパスワードが保存されたハッシュと一致するか検証 (オフライン照合)
 */
export async function verifyPasswordClient(
  password: string,
  saltHex: string,
  storedHashHex: string,
  iterations = DEFAULT_ITERATIONS,
): Promise<boolean> {
  const subtle = typeof crypto !== 'undefined' ? crypto.subtle : null

  if (!subtle) {
    throw new Error('非HTTPS環境のためオフライン認証（Web Crypto API）を利用できません。ネットワークに接続してログインしてください。')
  }

  const computedHash = await hashPasswordClient(password, saltHex, iterations)

  return computedHash.toLowerCase() === storedHashHex.toLowerCase()
}
