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
const MAX_CACHE_ENTRIES = 5000 // メモリ枯渇・DoS防止用の上限エントリ数
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000 // 5分ごとのクリーンアップ

let lastCleanupAt = Date.now()

/**
 * 期限切れレコードのクリーンアップ（メモリ枯渇・DoS対策）
 */
export function cleanupExpiredRateLimits(now = Date.now()): number {
  let cleanedCount = 0

  for (const [key, record] of loginAttempts.entries()) {
    const isWindowExpired = now - record.firstAttemptAt > WINDOW_MS
    const isBlockExpired = !record.blockedUntil || record.blockedUntil <= now

    if (isWindowExpired && isBlockExpired) {
      loginAttempts.delete(key)
      cleanedCount++
    }
  }

  // 万一大量キーで Map 上限を超えている場合は古いものから強制破棄
  if (loginAttempts.size > MAX_CACHE_ENTRIES) {
    const excess = loginAttempts.size - MAX_CACHE_ENTRIES
    let removed = 0

    for (const key of loginAttempts.keys()) {
      if (removed >= excess) break
      loginAttempts.delete(key)
      removed++
    }
  }

  return cleanedCount
}

function maybeCleanup(now = Date.now()): void {
  if (now - lastCleanupAt > CLEANUP_INTERVAL_MS || loginAttempts.size >= MAX_CACHE_ENTRIES) {
    cleanupExpiredRateLimits(now)
    lastCleanupAt = now
  }
}

/**
 * キー（IPまたはIP+ログインID）の試行制限状況をチェック
 */
export function checkRateLimit(
  key: string,
  maxAttempts = MAX_ATTEMPTS,
): { isBlocked: boolean, remainingMs: number, attemptsLeft: number } {
  const now = Date.now()

  maybeCleanup(now)

  const record = loginAttempts.get(key)

  if (!record) {
    return { isBlocked: false, remainingMs: 0, attemptsLeft: maxAttempts }
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

    return { isBlocked: false, remainingMs: 0, attemptsLeft: maxAttempts }
  }

  return {
    isBlocked: false,
    remainingMs: 0,
    attemptsLeft: Math.max(0, maxAttempts - record.count),
  }
}

/**
 * 失敗試行を記録し、制限超過時はブロック
 */
export function recordFailedAttempt(
  key: string,
  maxAttempts = MAX_ATTEMPTS,
  blockDurationMs = BLOCK_DURATION_MS,
): { isBlocked: boolean, remainingMs: number } {
  const now = Date.now()

  maybeCleanup(now)

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

  if (record.count >= maxAttempts) {
    record.blockedUntil = now + blockDurationMs

    return { isBlocked: true, remainingMs: blockDurationMs }
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
