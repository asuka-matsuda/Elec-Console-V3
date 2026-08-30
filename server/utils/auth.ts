import type { H3Event } from "h3";
import { getHeader, getCookie, createError } from "h3";
import { prisma } from "./prisma";

export interface SafeUser {
  id: string;
  loginId: string;
  firstName: string;
  lastName: string;
  firstNameKana: string | null;
  lastNameKana: string | null;
  role: string;
  requirePasswordReset: boolean;
  email: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  assignedSiteIds: string[];
}

/**
 * リクエストの Authorization ヘッダーまたは Cookie から認証トークンを抽出し、
 * 該当するユーザー情報を返します（未認証時は null を返す）。
 */
export async function getAuthUser(event: H3Event): Promise<SafeUser | null> {
  const authHeader = getHeader(event, "Authorization");
  const cookieToken = getCookie(event, "auth_token");

  let token = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.replace("Bearer ", "");
  } else if (cookieToken) {
    token = cookieToken;
  }

  if (!token || !token.startsWith("token_")) {
    return null;
  }

  const loginId = token.replace("token_", "");
  const user = await prisma.user.findUnique({
    where: { loginId },
    include: { assignedSites: true }
  });

  if (!user || !user.isActive) {
    return null;
  }

  const assignedSiteIds = user.assignedSites.map((s) => s.id);
  const { password: _dbPassword, assignedSites: _assignedSites, ...restUser } = user;
  return { ...restUser, assignedSiteIds };
}

/**
 * ログイン認証必須ガード。未認証の場合は 401 Unauthorized を throw します。
 */
export async function requireAuthUser(event: H3Event): Promise<SafeUser> {
  const user = await getAuthUser(event);
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "認証が必要です。再度ログインしてください。"
    });
  }
  return user;
}

/**
 * 管理者権限必須ガード。未認証時は 401、非管理者の場合は 403 Forbidden を throw します。
 */
export async function requireAdminUser(event: H3Event): Promise<SafeUser> {
  const user = await requireAuthUser(event);
  if (user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      message: "管理者権限が必要です。"
    });
  }
  return user;
}
