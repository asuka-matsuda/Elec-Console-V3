import { defineEventHandler, getRouterParam } from "h3";
import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) return { success: false };

  await prisma.user.delete({ where: { id } });
  return { success: true };
});