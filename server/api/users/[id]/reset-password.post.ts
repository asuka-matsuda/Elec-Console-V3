import { defineEventHandler, createError } from 'h3';
import fs from 'fs';
import path from 'path';
import { hashPassword, generateRandomPassword } from '../../../utils/password';

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request' });
  }

  const dbPath = path.resolve(process.cwd(), 'server/data/users.json');
  if (!fs.existsSync(dbPath)) {
    throw createError({ statusCode: 500, statusMessage: 'Database not found' });
  }

  const users = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  const user = users.find((u: any) => u.id === id);

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' });
  }

  // ランダムな初期パスワードの生成とハッシュ化
  const generatedPassword = generateRandomPassword();
  
  user.password = hashPassword(generatedPassword);
  user.requirePasswordReset = true; // 初回ログイン時のパスワード変更を再度要求する

  fs.writeFileSync(dbPath, JSON.stringify(users, null, 2), 'utf-8');

  // 管理者へ1度だけ表示するために平文を返す
  return { success: true, initialPassword: generatedPassword };
});
