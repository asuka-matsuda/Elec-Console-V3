import { defineEventHandler, readBody, getRouterParam } from "h3";
import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  
  if (!id) return null;

  const updatedSite = await prisma.site.update({
    where: { id },
    data: {
      name: body.name,
      status: body.status,
      disabledAt: body.disabledAt ? new Date(body.disabledAt) : null
    }
  });

  return updatedSite;
});