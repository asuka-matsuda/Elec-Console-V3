import { defineEventHandler, readBody, getHeader, createError } from "h3";
import { verifyPassword, hashPassword } from "../../utils/password";
import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, "Authorization");
  if (!authHeader) throw createError({ statusCode: 401 });
  
  const loginId = authHeader.replace("Bearer token_", "");
  const { currentPassword, newPassword } = await readBody(event);

  if (!currentPassword || !newPassword) {
    throw createError({ statusCode: 400, statusMessage: "Invalid input" });
  }

  const user = await prisma.user.findUnique({ where: { loginId } });

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }

  if (!verifyPassword(currentPassword as string, user.password)) {
    throw createError({ statusCode: 401, statusMessage: "現在のパスワードが間違っています。" });
  }

  const hashedPassword = hashPassword(newPassword as string);

  await prisma.user.update({
    where: { loginId },
    data: {
      password: hashedPassword,
      requirePasswordReset: false
    }
  });

  return { success: true };
});