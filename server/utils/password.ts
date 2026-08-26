import crypto from 'crypto';

/**
 * パスワードをハッシュ化する (pbkdf2)
 * フォーマット: salt:hash
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * 入力されたパスワードがハッシュと一致するか検証する
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password) return false;
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  if (!salt || !originalHash) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

/**
 * ランダムな初期パスワードを生成する (英数字8文字)
 */
export function generateRandomPassword(length = 8): string {
  const charset = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // まぎらわしい文字(l, 1, I, O, 0)を除外
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  return password;
}
