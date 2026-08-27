import { defineEventHandler, getHeader } from "h3";
import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, "Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { success: false };
  }

  const token = authHeader.replace("Bearer ", "");
  if (!token.startsWith("token_")) {
    return { success: false };
  }

  const loginId = token.replace("token_", "");
  const user = await prisma.user.findUnique({
    where: { loginId },
    include: { assignedSites: true }
  });

  if (!user || !user.isActive) {
    return { success: false };
  }

  const assignedSiteIds = user.assignedSites.map(s => s.id);
  const { password, assignedSites, ...restUser } = user;
  const safeUser = { ...restUser, assignedSiteIds };

  return { success: true, user: safeUser };
});