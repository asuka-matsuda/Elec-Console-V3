import type { User } from '~/types/auth';
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3';
import fs from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  
  const dbPath = path.resolve(process.cwd(), 'server/data/users.json');
  let users = [];
  if (fs.existsSync(dbPath)) {
    users = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  }

  const userIndex = users.findIndex((u: User & { password?: string }) => u.id === id);
  if (userIndex === -1) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' });
  }

  users[userIndex] = { ...users[userIndex], ...body };
  fs.writeFileSync(dbPath, JSON.stringify(users, null, 2), 'utf-8');

  const safeUser = { ...users[userIndex] };
  delete safeUser.password;
  return safeUser;
});
