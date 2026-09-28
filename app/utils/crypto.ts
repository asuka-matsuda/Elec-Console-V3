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
  const bytes = new Uint8Array(length)

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
  }
  else {
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }

  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 16進数文字列を Uint8Array に変換
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)

  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16)
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
    throw new Error('Web Crypto API (subtle) is not available')
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
  try {
    const computedHash = await hashPasswordClient(password, saltHex, iterations)

    return computedHash.toLowerCase() === storedHashHex.toLowerCase()
  }
  catch (err) {
    console.error('[WebCrypto] Verification failed', err)

    return false
  }
}
