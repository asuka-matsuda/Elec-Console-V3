import type { User } from "~/types/auth";
import { defineEventHandler, readBody, createError } from "h3";
import { verifyPassword } from "../../utils/password";
import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { loginId, password } = body;

  if (!loginId || !password) {
    throw createError({ statusCode: 400, statusMessage: "Bad Request" });
  }

  const user = await prisma.user.findUnique({
    where: { loginId },
    include: { assignedSites: true }
  });

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  if (!user.isActive) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden: Account is inactive" });
  }

  if (!verifyPassword(password as string, user.password)) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  await prisma.user.update({
    where: { loginId: user.loginId },
    data: { lastLoginAt: new Date() }
  });

  const assignedSiteIds = user.assignedSites.map(s => s.id);
  const { password, assignedSites, ...restUser } = user;
  const safeUser = { ...restUser, assignedSiteIds };

  return {
    success: true,
    token: `token_${user.loginId}`,
    user: safeUser,
    mustChangePassword: user.requirePasswordReset
  };
});