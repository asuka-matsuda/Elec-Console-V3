import { defineEventHandler, readBody } from "h3";
import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const newSite = await prisma.site.create({
    data: {
      name: body.name,
      status: body.status || "planning"
    }
  });
  return newSite;
});