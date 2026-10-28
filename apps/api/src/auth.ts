import type { NextFunction, Request, Response } from "express";
import { UserRole, UserStatus } from "./generated/prisma/client.js";
import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { prisma } from "./prisma.js";

const COOKIE_NAME = "hbba_session";

type TokenPayload = { sub: string };

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string;
        name: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

export function setSessionCookie(response: Response, userId: string) {
  const token = jwt.sign({ sub: userId } satisfies TokenPayload, config.JWT_SECRET, { expiresIn: "7d" });
  response.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.COOKIE_SECURE,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearSessionCookie(response: Response) {
  response.clearCookie(COOKIE_NAME, { path: "/" });
}

export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  try {
    const token = request.cookies?.[COOKIE_NAME];
    if (!token) return response.status(401).json({ message: "Требуется авторизация" });

    const payload = jwt.verify(token, config.JWT_SECRET) as TokenPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    if (!user || user.status === UserStatus.BLOCKED) {
      clearSessionCookie(response);
      return response.status(401).json({ message: "Сессия недоступна" });
    }

    request.authUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    next();
  } catch {
    clearSessionCookie(response);
    return response.status(401).json({ message: "Сессия истекла" });
  }
}

export function requireAdmin(request: Request, response: Response, next: NextFunction) {
  if (request.authUser?.role !== UserRole.ADMIN) {
    return response.status(403).json({ message: "Недостаточно прав" });
  }
  next();
}
