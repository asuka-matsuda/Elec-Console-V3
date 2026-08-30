import { defineEventHandler, readBody, getRouterParam } from "h3";
import { prisma } from "../../utils/prisma";
import { requireAdminUser } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  await requireAdminUser(event);
  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  
  if (!id) return null;

  const siteData = body.site || body;

  const updatedSite = await prisma.site.update({
    where: { id },
    data: {
      name: siteData.name,
      status: siteData.status,
      disabledAt: siteData.disabledAt !== undefined
        ? (siteData.disabledAt ? new Date(siteData.disabledAt) : null)
        : undefined
    }
  });

  const settings = await prisma.siteSettings.findUnique({
    where: { siteId: id }
  });

  return { site: updatedSite, settings };
});