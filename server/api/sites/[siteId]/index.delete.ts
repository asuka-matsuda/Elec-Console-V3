import { defineEventHandler, getRouterParam } from "h3";
import { prisma } from "../../../utils/prisma";
import { requireAdminUser } from "../../../utils/auth";

export default defineEventHandler(async (event) => {
  await requireAdminUser(event);
  const siteId = getRouterParam(event, "siteId");
  if (!siteId) return { success: false };

  await prisma.site.delete({ where: { id: siteId } });
  return { success: true };
});
