import { defineEventHandler, readBody, getRouterParam } from "h3";
import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  
  if (!id) return null;
  
  const siteConnections = (body.assignedSiteIds || []).map((sid: string) => ({ id: sid }));

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      loginId: body.loginId,
      firstName: body.firstName,
      lastName: body.lastName,
      firstNameKana: body.firstNameKana,
      lastNameKana: body.lastNameKana,
      role: body.role,
      email: body.email,
      isActive: body.isActive,
      assignedSites: { set: siteConnections } // Override relations
    },
    include: { assignedSites: true }
  });

  const assignedSiteIds = updatedUser.assignedSites.map(s => s.id);
  const { password, assignedSites, ...restUser } = updatedUser;
  const safeUser = { ...restUser, assignedSiteIds };
  
  return safeUser;
});