import { defineEventHandler } from "h3";
import { prisma } from "../../utils/prisma";
import { requireAuthUser } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  await requireAuthUser(event);

  const sites = await prisma.site.findMany({
    include: {
      users: true,
      settings: true
    }
  });
  const siteSettings = await prisma.siteSettings.findMany();
  return { sites, siteSettings };
});
