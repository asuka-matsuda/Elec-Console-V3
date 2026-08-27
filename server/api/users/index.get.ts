import { defineEventHandler } from "h3";
import { prisma } from "../../utils/prisma";

export default defineEventHandler(async () => {
  const users = await prisma.user.findMany({
    include: { assignedSites: true }
  });
  
  return users.map(user => {
    const assignedSiteIds = user.assignedSites.map(s => s.id);
    const { password, assignedSites, ...restUser } = user;
  const safeUser = { ...restUser, assignedSiteIds };
    return safeUser;
  });
});