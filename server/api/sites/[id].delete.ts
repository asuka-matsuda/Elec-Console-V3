import { defineEventHandler, getRouterParam } from "h3";
import { prisma } from "../../utils/prisma";
import { requireAdminUser } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  await requireAdminUser(event);
  const id = getRouterParam(event, "id");
  if (!id) return { success: false };

  await prisma.site.delete({ where: { id } });
  return { success: true };
});