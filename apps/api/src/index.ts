import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import multer from "multer";
import pdf from "pdf-parse/lib/pdf-parse.js";
import bcrypt from "bcryptjs";
import { Prisma, UserRole, UserStatus } from "./generated/prisma/client.js";
import { z, ZodError } from "zod";
import { config } from "./config.js";
import { prisma } from "./prisma.js";
import { clearSessionCookie, requireAdmin, requireAuth, setSessionCookie } from "./auth.js";
import {
  analyzeSymptoms,
  ConsistencyError,
  RED_FLAG_DEFINITIONS,
  ZONE_DEFINITIONS,
  type AnalysisInput,
} from "./expert-engine.js";

const app = express();
const asyncRoute = (
  handler: (request: Request, response: Response, next: NextFunction) => Promise<unknown>,
) => (request: Request, response: Response, next: NextFunction) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: config.WEB_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

const credentialsSchema = z.object({
  email: z.string().email("Введите корректный email").transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8, "Пароль должен содержать не менее 8 символов").max(128),
});

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", service: "HBBA API", version: "2.0.0" });
});

app.post("/api/auth/register", asyncRoute(async (request, response) => {
  const body = credentialsSchema.extend({ name: z.string().trim().min(2).max(80) }).parse(request.body);
  const existing = await prisma.user.findUnique({ where: { email: body.email }, select: { id: true } });
  if (existing) return response.status(409).json({ message: "Пользователь с таким email уже зарегистрирован" });

  const user = await prisma.user.create({
    data: { name: body.name, email: body.email, passwordHash: await bcrypt.hash(body.password, 12) },
    select: publicUserSelect,
  });
  setSessionCookie(response, user.id);
  return response.status(201).json({ user });
}));

app.post("/api/auth/login", asyncRoute(async (request, response) => {
  const body = credentialsSchema.parse(request.body);
  const userWithPassword = await prisma.user.findUnique({ where: { email: body.email } });
  if (!userWithPassword || !(await bcrypt.compare(body.password, userWithPassword.passwordHash))) {
    return response.status(401).json({ message: "Неверный email или пароль" });
  }
  if (userWithPassword.status === UserStatus.BLOCKED) {
    return response.status(403).json({ message: "Учетная запись заблокирована администратором" });
  }

  setSessionCookie(response, userWithPassword.id);
  const { passwordHash: _passwordHash, ...user } = userWithPassword;
  return response.json({ user });
}));

app.post("/api/auth/logout", (_request, response) => {
  clearSessionCookie(response);
  response.status(204).send();
});

app.get("/api/auth/me", requireAuth, (request, response) => {
  response.json({ user: request.authUser });
});

const zoneIds = new Set<string>(ZONE_DEFINITIONS.map((zone) => zone.id));
const redFlagIds = new Set<string>(RED_FLAG_DEFINITIONS.map((flag) => flag.id));
const analysisSchema = z.object({
  zones: z.array(z.string().refine((value) => zoneIds.has(value), "Неизвестная зона")).min(1, "Выберите хотя бы одну зону").max(9),
  symptoms: z.string().trim().min(10, "Опишите симптомы подробнее — минимум 10 символов").max(5000),
  redFlags: z.array(z.string().refine((value) => redFlagIds.has(value), "Неизвестный красный флаг")).max(6).default([]),
  attachmentText: z.string().trim().max(20000).optional(),
});

app.post("/api/analyses", requireAuth, asyncRoute(async (request, response) => {
  const body = analysisSchema.parse(request.body) as AnalysisInput;
  const result = analyzeSymptoms(body);
  const analysis = await prisma.analysis.create({
    data: {
      userId: request.authUser!.id,
      zones: body.zones,
      symptoms: body.symptoms,
      redFlags: body.redFlags,
      attachmentText: body.attachmentText || null,
      specialist: result.specialist,
      urgency: result.urgency,
      riskLevel: result.riskLevel,
      result: result as unknown as Prisma.InputJsonValue,
    },
  });
  return response.status(201).json({ analysis: { ...analysis, result } });
}));

app.get("/api/analyses", requireAuth, asyncRoute(async (request, response) => {
  const analyses = await prisma.analysis.findMany({
    where: request.authUser!.role === UserRole.ADMIN && request.query.scope === "all"
      ? undefined
      : { userId: request.authUser!.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      zones: true,
      symptoms: true,
      redFlags: true,
      specialist: true,
      urgency: true,
      riskLevel: true,
      result: true,
      createdAt: true,
    },
  });
  response.json({ analyses });
}));

app.get("/api/analyses/:id", requireAuth, asyncRoute(async (request, response) => {
  const analysisId = z.string().uuid().parse(request.params.id);
  const analysis = await prisma.analysis.findFirst({
    where: {
      id: analysisId,
      ...(request.authUser!.role === UserRole.ADMIN ? {} : { userId: request.authUser!.id }),
    },
  });
  if (!analysis) return response.status(404).json({ message: "Анализ не найден" });
  return response.json({ analysis });
}));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    const supported = file.mimetype === "application/pdf" || file.mimetype.startsWith("text/");
    if (supported) callback(null, true);
    else callback(new Error("Поддерживаются только PDF и TXT"));
  },
});

app.post("/api/files/extract", requireAuth, upload.single("file"), asyncRoute(async (request, response) => {
  if (!request.file) return response.status(400).json({ message: "Файл не выбран" });
  const text = request.file.mimetype === "application/pdf"
    ? (await pdf(request.file.buffer)).text
    : request.file.buffer.toString("utf8");
  return response.json({
    filename: request.file.originalname,
    text: text.replace(/\u0000/g, "").trim().slice(0, 20000),
    truncated: text.length > 20000,
  });
}));

app.get("/api/admin/overview", requireAuth, requireAdmin, asyncRoute(async (_request, response) => {
  const [users, activeClients, analyses, riskGroups, recent] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: UserRole.CLIENT, status: UserStatus.ACTIVE } }),
    prisma.analysis.count(),
    prisma.analysis.groupBy({ by: ["riskLevel"], _count: { _all: true } }),
    prisma.analysis.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        symptoms: true,
        specialist: true,
        riskLevel: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ]);
  const byRisk = Object.fromEntries(riskGroups.map((group) => [group.riskLevel, group._count._all]));
  response.json({ stats: { users, activeClients, analyses, byRisk }, recent });
}));

app.get("/api/admin/users", requireAuth, requireAdmin, asyncRoute(async (_request, response) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { ...publicUserSelect, _count: { select: { analyses: true } } },
  });
  response.json({ users });
}));

app.patch("/api/admin/users/:id/status", requireAuth, requireAdmin, asyncRoute(async (request, response) => {
  const userId = z.string().uuid().parse(request.params.id);
  const { status } = z.object({ status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED]) }).parse(request.body);
  if (userId === request.authUser!.id && status === UserStatus.BLOCKED) {
    return response.status(400).json({ message: "Нельзя заблокировать собственную учетную запись" });
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: { status },
    select: publicUserSelect,
  });
  await prisma.auditLog.create({
    data: { actorId: request.authUser!.id, action: "USER_STATUS_CHANGED", targetId: user.id, metadata: { status } },
  });
  return response.json({ user });
}));

app.use((_request, response) => response.status(404).json({ message: "Маршрут не найден" }));

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    return response.status(400).json({ message: error.issues[0]?.message ?? "Проверьте введенные данные", issues: error.issues });
  }
  if (error instanceof ConsistencyError) {
    return response.status(422).json({ message: error.message, details: error.details });
  }
  if (error instanceof multer.MulterError) {
    return response.status(400).json({ message: error.code === "LIMIT_FILE_SIZE" ? "Размер файла не должен превышать 5 МБ" : error.message });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return response.status(404).json({ message: "Запись не найдена" });
  }
  console.error(error);
  return response.status(500).json({ message: error instanceof Error ? error.message : "Внутренняя ошибка сервера" });
});

app.listen(config.PORT, () => {
  console.log(`HBBA API is listening on http://localhost:${config.PORT}`);
});

export { app };
