import { defineEventHandler, getRouterParam } from "h3";
import { prisma } from "../../../utils/prisma";
import { hashPassword } from "../../../utils/password";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) return { success: false };

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { success: false };

  await prisma.user.update({
    where: { id },
    data: {
      password: hashPassword(user.loginId),
      requirePasswordReset: true
    }
  });

  return { success: true };
});