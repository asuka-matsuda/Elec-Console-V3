import type { User } from '~/types/auth';
import { defineEventHandler, getRouterParam, createError } from 'h3';
import fs from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  
  const dbPath = path.resolve(process.cwd(), 'server/data/users.json');
  let users = [];
  if (fs.existsSync(dbPath)) {
    users = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  }

  const newUsers = users.filter((u: User & { password?: string }) => u.id !== id);
  if (newUsers.length === users.length) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' });
  }

  fs.writeFileSync(dbPath, JSON.stringify(newUsers, null, 2), 'utf-8');
  return { success: true };
});
