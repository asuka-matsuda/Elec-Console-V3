import { defineEventHandler, readBody, createError } from "h3";
import { verifyPassword, hashPassword } from "../../utils/password";
import { prisma } from "../../utils/prisma";
import { requireAuthUser } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const authUser = await requireAuthUser(event);
  const { currentPassword, newPassword } = await readBody(event);

  if (!newPassword) {
    throw createError({ statusCode: 400, statusMessage: "Invalid input" });
  }

  const user = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }

  // 初回パスワードリセット時（currentPassword がない場合）以外の通常変更時は現在パスワードを検証
  if (currentPassword && !verifyPassword(currentPassword as string, user.password)) {
    throw createError({ statusCode: 401, statusMessage: "現在のパスワードが間違っています。" });
  }

  const hashedPassword = hashPassword(newPassword as string);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      requirePasswordReset: false
    }
  });

  return { success: true };
});