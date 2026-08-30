import { defineEventHandler } from "h3";
import { prisma } from "../utils/prisma";

export default defineEventHandler(async () => {
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 10
  });

  const history = await prisma.history.findMany({
    orderBy: { createdAt: "desc" },
    take: 10
  });

  return { announcements, history };
});
