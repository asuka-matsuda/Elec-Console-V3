import { defineEventHandler, readBody, getCookie, createError } from 'h3';
import fs from 'fs';
import path from 'path';
import { hashPassword } from '../../utils/password';

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token');
  if (!token || !token.startsWith('token_')) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const loginId = token.replace('token_', '');
  const { newPassword } = await readBody(event);

  if (!newPassword || newPassword.length < 4) {
    throw createError({ statusCode: 400, statusMessage: '新しいパスワードが短すぎます' });
  }

  const dbPath = path.resolve(process.cwd(), 'server/data/users.json');
  if (!fs.existsSync(dbPath)) {
    throw createError({ statusCode: 500, statusMessage: 'Database not found' });
  }

  const users = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  const user = users.find((u: any) => u.loginId === loginId);

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'User not found' });
  }

  // パスワードを更新し、リセット要求フラグを解除
  user.password = hashPassword(newPassword);
  user.requirePasswordReset = false;

  fs.writeFileSync(dbPath, JSON.stringify(users, null, 2), 'utf-8');

  return { success: true };
});
