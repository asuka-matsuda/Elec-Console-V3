import { defineEventHandler, readBody, getRouterParam } from "h3";
import { prisma } from "../../../utils/prisma";
import { requireAdminUser } from "../../../utils/auth";

export default defineEventHandler(async (event) => {
  await requireAdminUser(event);
  const siteId = getRouterParam(event, "siteId");
  const body = await readBody(event);
  
  if (!siteId) return null;

  const siteData = body.site || body;

  const updatedSite = await prisma.site.update({
    where: { id: siteId },
    data: {
      name: siteData.name,
      status: siteData.status,
      disabledAt: siteData.disabledAt !== undefined
        ? (siteData.disabledAt ? new Date(siteData.disabledAt) : null)
        : undefined
    }
  });

  const settings = await prisma.siteSettings.findUnique({
    where: { siteId }
  });

  return { site: updatedSite, settings };
});
