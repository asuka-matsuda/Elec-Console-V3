import { defineEventHandler } from 'h3';
import fs from 'fs';
import path from 'path';

export default defineEventHandler((event) => {
  const dbPath = path.resolve(process.cwd(), 'server/data/users.json');
  let users = [];
  if (fs.existsSync(dbPath)) {
    users = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  }
  
  // セキュリティのためパスワードは除去して返す
  return users.map((u: any) => {
    const safeUser = { ...u };
    delete safeUser.password;
    return safeUser;
  });
});
