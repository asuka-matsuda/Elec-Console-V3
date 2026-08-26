import { defineEventHandler, readBody, createError } from 'h3';
import { verifyPassword } from '../../utils/password';
import fs from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { loginId, password } = body;

  if (!loginId || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request' });
  }

  const dbPath = path.resolve(process.cwd(), 'server/data/users.json');
  let users = [];
  if (fs.existsSync(dbPath)) {
    users = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  }

  const user = users.find((u: any) => u.loginId === loginId);

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  if (!user.isActive) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: Account is inactive' });
  }

  if (!verifyPassword(password as string, user.password)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  user.lastLoginAt = new Date().toISOString();
  fs.writeFileSync(dbPath, JSON.stringify(users, null, 2), 'utf-8');

  const safeUser = { ...user };
  delete safeUser.password;

  return {
    success: true,
    token: `token_${user.loginId}`,
    user: safeUser,
    mustChangePassword: user.requirePasswordReset
  };
});
