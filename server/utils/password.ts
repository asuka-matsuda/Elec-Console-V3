import crypto from 'crypto'

const DEFAULT_ITERATIONS = 100000
const KEY_LENGTH = 64
const DIGEST = 'sha512'

/**
 * パスワードを安全にハッシュ化する (PBKDF2-HMAC-SHA512)
 * フォーマット: pbkdf2:iterations:salt:hash
 */
export function hashPassword(password: string, iterations = DEFAULT_ITERATIONS): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST).toString('hex')

  return `pbkdf2:${iterations}:${salt}:${hash}`
}

/**
 * 入力されたパスワードがハッシュと一致するか検証する (タイミング攻撃耐性あり)
 * レガシー形式 (salt:hash / 10000回) と 新形式 (pbkdf2:iterations:salt:hash) の双方を安全に検証可能
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false

  try {
    let iterations = 10000
    let salt = ''
    let originalHash = ''

    if (storedHash.startsWith('pbkdf2:')) {
      const parts = storedHash.split(':')

      if (parts.length !== 4 || !parts[1] || !parts[2] || !parts[3]) return false
      iterations = parseInt(parts[1], 10)
      salt = parts[2]
      originalHash = parts[3]
    }
    else {
      // レガシー形式: salt:hash
      const parts = storedHash.split(':')

      if (parts.length !== 2 || !parts[0] || !parts[1]) return false
      salt = parts[0]
      originalHash = parts[1]
      iterations = 10000
    }

    if (!salt || !originalHash || isNaN(iterations) || iterations <= 0) return false

    const hash = crypto.pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST).toString('hex')

    const bufA = Buffer.from(hash, 'hex')
    const bufB = Buffer.from(originalHash, 'hex')

    if (bufA.length !== bufB.length) return false

    return crypto.timingSafeEqual(bufA, bufB)
  }
  catch {
    return false
  }
}

/**
 * 旧来の低イテレーションハッシュかどうか判定し、アップグレードが必要か確認する
 */
export function needsRehash(storedHash: string): boolean {
  if (!storedHash || !storedHash.startsWith('pbkdf2:')) return true
  const parts = storedHash.split(':')

  if (parts.length !== 4 || !parts[1]) return true
  const iterations = parseInt(parts[1], 10)

  return isNaN(iterations) || iterations < DEFAULT_ITERATIONS
}

/**
 * 推測されにくい強固なランダム一時パスワードを生成する (デフォルト10文字)
 */
export function generateRandomPassword(length = 10): string {
  // まぎらわしい文字 (l, 1, I, O, 0) を除外した英数字
  const charset = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let password = ''

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length)

    password += charset[randomIndex]
  }

  return password
}
