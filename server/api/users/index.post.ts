import { defineEventHandler, readBody } from "h3";
import { prisma } from "../../utils/prisma";
import { hashPassword } from "../../utils/password";
import { requireAdminUser } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  await requireAdminUser(event);
  const body = await readBody(event);
  
  const siteConnections = (body.assignedSiteIds || []).map((id: string) => ({ id }));
  
  const newUser = await prisma.user.create({
    data: {
      loginId: body.loginId,
      password: hashPassword(body.password || body.loginId), // Default password is loginId if not provided
      firstName: body.firstName,
      lastName: body.lastName,
      firstNameKana: body.firstNameKana,
      lastNameKana: body.lastNameKana,
      role: body.role || "worker",
      requirePasswordReset: body.requirePasswordReset ?? true,
      email: body.email,
      isActive: body.isActive ?? true,
      assignedSites: { connect: siteConnections }
    },
    include: { assignedSites: true }
  });
  
  const assignedSiteIds = newUser.assignedSites.map((s) => s.id);
  const { password: _dbPassword, assignedSites: _assignedSites, ...restUser } = newUser;
  return { ...restUser, assignedSiteIds };
});
