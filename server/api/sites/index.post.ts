import { defineEventHandler, readBody } from "h3";
import { prisma } from "../../utils/prisma";
import { requireAdminUser } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  await requireAdminUser(event);
  const body = await readBody(event);

  const newSite = await prisma.site.create({
    data: {
      name: body.name,
      status: body.status || "planning"
    }
  });

  const settings = await prisma.siteSettings.create({
    data: {
      siteId: newSite.id,
      phase2ThresholdMegOhm: 1.0,
      enablePhase3: true
    }
  });

  return { site: newSite, settings };
});
