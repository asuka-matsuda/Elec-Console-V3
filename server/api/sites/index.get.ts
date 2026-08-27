import { defineEventHandler } from "h3";
import { prisma } from "../../utils/prisma";

export default defineEventHandler(async () => {
  const sites = await prisma.site.findMany();
  return sites;
});