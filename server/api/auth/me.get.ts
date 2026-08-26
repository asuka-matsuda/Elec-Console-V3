import type { User } from '~/types/auth';
import { defineEventHandler, getCookie, createError } from 'h3';
import fs from 'fs';
import path from 'path';

export default defineEventHandler((event) => {
  const token = getCookie(event, 'auth_token');
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  // token は "token_loginId" の形式で発行されている
  if (!token.startsWith('token_')) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' });
  }

  const loginId = token.replace('token_', '');

  const dbPath = path.resolve(process.cwd(), 'server/data/users.json');
  if (!fs.existsSync(dbPath)) {
    throw createError({ statusCode: 401, statusMessage: 'Database not found' });
  }

  const users = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  const user = users.find((u: User & { password?: string }) => u.loginId === loginId);

  if (!user || !user.isActive) {
    throw createError({ statusCode: 401, statusMessage: 'User not found or inactive' });
  }

  const safeUser = { ...user };
  delete safeUser.password;

  return {
    user: safeUser
  };
});
