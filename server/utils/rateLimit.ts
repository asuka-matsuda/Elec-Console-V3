/**
 * メモリベースのレートリミッター（ログイン試行制限・ブルートフォース防御）
 */

interface RateLimitRecord {
  count: number
  firstAttemptAt: number
  blockedUntil: number | null
}

const loginAttempts = new Map<string, RateLimitRecord>()

// 設定値
const MAX_ATTEMPTS = 5 // 5回連続失敗でロック
const WINDOW_MS = 15 * 60 * 1000 // 15分ウィンドウ
const BLOCK_DURATION_MS = 15 * 60 * 1000 // 15分ブロック

/**
 * キー（IPまたはIP+ログインID）の試行制限状況をチェック
 */
export function checkRateLimit(key: string): { isBlocked: boolean, remainingMs: number, attemptsLeft: number } {
  const now = Date.now()
  const record = loginAttempts.get(key)

  if (!record) {
    return { isBlocked: false, remainingMs: 0, attemptsLeft: MAX_ATTEMPTS }
  }

  // ブロック中の場合
  if (record.blockedUntil && record.blockedUntil > now) {
    return {
      isBlocked: true,
      remainingMs: record.blockedUntil - now,
      attemptsLeft: 0,
    }
  }

  // ウィンドウ時間を経過していればリセット
  if (now - record.firstAttemptAt > WINDOW_MS) {
    loginAttempts.delete(key)

    return { isBlocked: false, remainingMs: 0, attemptsLeft: MAX_ATTEMPTS }
  }

  return {
    isBlocked: false,
    remainingMs: 0,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - record.count),
  }
}

/**
 * 失敗試行を記録し、制限超過時はブロック
 */
export function recordFailedAttempt(key: string): { isBlocked: boolean, remainingMs: number } {
  const now = Date.now()
  const record = loginAttempts.get(key)

  if (!record || (now - record.firstAttemptAt > WINDOW_MS && !record.blockedUntil)) {
    loginAttempts.set(key, {
      count: 1,
      firstAttemptAt: now,
      blockedUntil: null,
    })

    return { isBlocked: false, remainingMs: 0 }
  }

  record.count += 1

  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS

    return { isBlocked: true, remainingMs: BLOCK_DURATION_MS }
  }

  return { isBlocked: false, remainingMs: 0 }
}

/**
 * ログイン成功時に記録をクリア
 */
export function clearRateLimit(key: string): void {
  loginAttempts.delete(key)
}

/**
 * テスト用・定期クリーンアップ用
 */
export function resetAllRateLimits(): void {
  loginAttempts.clear()
}
