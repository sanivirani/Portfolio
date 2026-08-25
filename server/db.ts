import { asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  caseStudies,
  CaseStudy,
  InsertUser,
  portfolioMedia,
  PortfolioMedia,
  portfolioSettings,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export function parseJson<T>(value: string, fallback: T): T {
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

export function isDuplicateEntry(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ER_DUP_ENTRY";
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  (["name", "email", "loginMethod"] as const).forEach((field) => {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  });
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : undefined);
  if (values.role) updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const db = await getDb();
  if (!db) return fallback;
  const result = await db.select().from(portfolioSettings).where(eq(portfolioSettings.key, key)).limit(1);
  return result[0] ? parseJson(result[0].value, fallback) : fallback;
}

export async function getAllSettings() {
  const db = await getDb();
  return db ? db.select().from(portfolioSettings) : [];
}

export async function setSetting(key: string, value: unknown) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");
  await db.insert(portfolioSettings).values({ key, value: JSON.stringify(value) }).onDuplicateKeyUpdate({ set: { value: JSON.stringify(value) } });
}

export async function getCaseStudies(status?: "draft" | "published") {
  const db = await getDb();
  if (!db) return [] as CaseStudy[];
  const query = db.select().from(caseStudies).orderBy(asc(caseStudies.sortOrder), asc(caseStudies.id));
  return status ? query.where(eq(caseStudies.status, status)) : query;
}

type CaseStudyValues = Omit<typeof caseStudies.$inferInsert, "id" | "createdAt" | "updatedAt">;

export async function createCaseStudy(values: CaseStudyValues) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");
  const result = await db.insert(caseStudies).values(values);
  return Number(result[0].insertId);
}

export async function updateCaseStudy(id: number, values: CaseStudyValues) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");
  const result = await db.update(caseStudies).set(values).where(eq(caseStudies.id, id));
  return result[0].affectedRows > 0;
}

export async function removeCaseStudy(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");
  await db.delete(caseStudies).where(eq(caseStudies.id, id));
}

export async function getMedia() {
  const db = await getDb();
  return db ? db.select().from(portfolioMedia).orderBy(asc(portfolioMedia.createdAt)) : [] as PortfolioMedia[];
}

type MediaValues = Omit<typeof portfolioMedia.$inferInsert, "id" | "createdAt" | "updatedAt">;

export async function createMedia(values: MediaValues) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");
  const result = await db.insert(portfolioMedia).values(values);
  return Number(result[0].insertId);
}

export async function updateMedia(id: number, values: Pick<MediaValues, "altText" | "caption">) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");
  await db.update(portfolioMedia).set(values).where(eq(portfolioMedia.id, id));
}

export async function removeMedia(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");
  await db.delete(portfolioMedia).where(eq(portfolioMedia.id, id));
}
