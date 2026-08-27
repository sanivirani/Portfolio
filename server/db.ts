import { MongoClient, MongoServerError, type Db } from "mongodb";
import { ENV } from "./_core/env";

export type PortfolioRole = "user" | "admin";

export type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: PortfolioRole;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

export type InsertUser = Pick<User, "openId"> & Partial<Omit<User, "id" | "openId" | "createdAt" | "updatedAt">>;

export type PortfolioSetting = { key: string; value: unknown; updatedAt: Date };

export type PortfolioMedia = {
  id: number;
  name: string;
  key: string;
  url: string;
  mimeType: string;
  altText: string;
  caption: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CaseStudy = {
  id: number;
  slug: string;
  title: string;
  label: string;
  industry: string;
  role: string | null;
  description: string;
  focus: string;
  tone: "violet" | "lime" | "sand";
  services: string;
  technologies: string;
  metrics: string;
  mediaId: number | null;
  sortOrder: number;
  status: "draft" | "published";
  createdAt: Date;
  updatedAt: Date;
};

export type OwnerVerificationSession = {
  id: number;
  userId: number;
  verifiedAt: Date;
  expiresAt: Date;
  updatedAt: Date;
};

type Counter = { key: string; value: number };
type CaseStudyValues = Omit<CaseStudy, "id" | "createdAt" | "updatedAt">;
type MediaValues = Omit<PortfolioMedia, "id" | "createdAt" | "updatedAt">;
type MongoCache = { client?: MongoClient; promise?: Promise<MongoClient> };

declare global {
  // Cached across warm Vercel function invocations to avoid opening a new connection pool per request.
  // eslint-disable-next-line no-var
  var __saniPortfolioMongoCache: MongoCache | undefined;
}

const mongoCache = globalThis.__saniPortfolioMongoCache ?? (globalThis.__saniPortfolioMongoCache = {});
let indexPromise: Promise<void> | undefined;

const testStore = {
  counters: new Map<string, number>(),
  users: new Map<string, User>(),
  settings: new Map<string, PortfolioSetting>(),
  media: new Map<number, PortfolioMedia>(),
  caseStudies: new Map<number, CaseStudy>(),
  verificationSessions: new Map<number, OwnerVerificationSession>(),
};

function isTestRuntime() {
  return process.env.VITEST === "true" || process.env.NODE_ENV === "test";
}

function databaseName(uri: string) {
  const configured = process.env.MONGODB_DB?.trim();
  if (configured) return configured;
  try {
    const name = new URL(uri).pathname.replace(/^\//, "").split("/")[0];
    return name || "sani_portfolio";
  } catch {
    return "sani_portfolio";
  }
}

export async function getDb(): Promise<Db | null> {
  if (isTestRuntime()) return null;
  const uri = ENV.mongodbUri;
  if (!uri) return null;

  try {
    if (!mongoCache.client) {
      mongoCache.promise ??= new MongoClient(uri, {
        appName: "sani-virani-portfolio",
        maxPoolSize: 5,
        minPoolSize: 0,
        serverSelectionTimeoutMS: 5_000,
      }).connect();
      mongoCache.client = await mongoCache.promise;
    }
    return mongoCache.client.db(databaseName(uri));
  } catch (error) {
    mongoCache.client = undefined;
    mongoCache.promise = undefined;
    console.warn("[MongoDB] Failed to connect:", error);
    return null;
  }
}

async function readyDb() {
  const db = await getDb();
  if (!db) return null;
  indexPromise ??= Promise.all([
    db.collection<User>("users").createIndex({ openId: 1 }, { unique: true }),
    db.collection<PortfolioSetting>("portfolioSettings").createIndex({ key: 1 }, { unique: true }),
    db.collection<PortfolioMedia>("portfolioMedia").createIndex({ id: 1 }, { unique: true }),
    db.collection<PortfolioMedia>("portfolioMedia").createIndex({ key: 1 }, { unique: true }),
    db.collection<CaseStudy>("caseStudies").createIndex({ id: 1 }, { unique: true }),
    db.collection<CaseStudy>("caseStudies").createIndex({ slug: 1 }, { unique: true }),
    db.collection<OwnerVerificationSession>("ownerVerificationSessions").createIndex({ userId: 1 }, { unique: true }),
  ]).then(() => undefined).catch((error) => {
    indexPromise = undefined;
    throw error;
  });
  await indexPromise;
  return db;
}

async function nextMongoId(db: Db, key: string) {
  const result = await db.collection<Counter>("portfolioCounters").findOneAndUpdate(
    { key },
    { $inc: { value: 1 } },
    { upsert: true, returnDocument: "after" },
  );
  if (!result) throw new Error("Unable to allocate a MongoDB document identifier.");
  return result.value;
}

function nextTestId(key: string) {
  const next = (testStore.counters.get(key) ?? 0) + 1;
  testStore.counters.set(key, next);
  return next;
}

function sortCaseStudies(items: CaseStudy[]) {
  return items.sort((left, right) => left.sortOrder - right.sortOrder || left.id - right.id);
}

export function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

export function isDuplicateEntry(error: unknown) {
  return (error instanceof MongoServerError && error.code === 11000)
    || (typeof error === "object" && error !== null && "code" in error && (error as { code?: number }).code === 11000);
}

export function resetPortfolioTestStorage() {
  if (!isTestRuntime()) return;
  testStore.counters.clear();
  testStore.users.clear();
  testStore.settings.clear();
  testStore.media.clear();
  testStore.caseStudies.clear();
  testStore.verificationSessions.clear();
}

export function buildUserUpsertUpdate(user: InsertUser, id: number, now: Date) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const updates: Partial<Pick<User, "name" | "email" | "loginMethod" | "role" | "lastSignedIn" | "updatedAt">> = {
    lastSignedIn: user.lastSignedIn ?? now,
    updatedAt: now,
  };
  if (user.name !== undefined) updates.name = user.name ?? null;
  if (user.email !== undefined) updates.email = user.email ?? null;
  if (user.loginMethod !== undefined) updates.loginMethod = user.loginMethod ?? null;
  if (user.role) updates.role = user.role;

  // MongoDB rejects an update when a path appears in both `$set` and
  // `$setOnInsert`. Add nullable/default fields only when `$set` does not
  // already carry a caller-provided value for that field.
  const insertDefaults: Partial<User> = {
    id,
    openId: user.openId,
    createdAt: now,
  };
  if (updates.name === undefined) insertDefaults.name = null;
  if (updates.email === undefined) insertDefaults.email = null;
  if (updates.loginMethod === undefined) insertDefaults.loginMethod = null;
  if (updates.role === undefined) {
    insertDefaults.role = user.openId === ENV.ownerOpenId ? "admin" : "user";
  }

  return { updates, mongoUpdate: { $set: updates, $setOnInsert: insertDefaults } };
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const now = new Date();

  if (isTestRuntime()) {
    const id = nextTestId("users");
    const { updates } = buildUserUpsertUpdate(user, id, now);
    const existing = testStore.users.get(user.openId);
    testStore.users.set(user.openId, {
      id: existing?.id ?? nextTestId("users"),
      openId: user.openId,
      name: existing?.name ?? null,
      email: existing?.email ?? null,
      loginMethod: existing?.loginMethod ?? null,
      role: user.role ?? existing?.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user"),
      createdAt: existing?.createdAt ?? now,
      lastSignedIn: user.lastSignedIn ?? now,
      updatedAt: now,
      ...updates,
    });
    return;
  }

  const db = await readyDb();
  if (!db) return;
  const mongoId = await nextMongoId(db, "users");
  const update = buildUserUpsertUpdate(user, mongoId, now);
  await db.collection<User>("users").updateOne(
    { openId: user.openId },
    update.mongoUpdate,
    { upsert: true },
  );
}

export async function getUserByOpenId(openId: string) {
  if (isTestRuntime()) return testStore.users.get(openId);
  const db = await readyDb();
  if (!db) return undefined;
  return (await db.collection<User>("users").findOne({ openId }, { projection: { _id: 0 } })) ?? undefined;
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  if (isTestRuntime()) return (testStore.settings.get(key)?.value as T | undefined) ?? fallback;
  const db = await readyDb();
  if (!db) return fallback;
  const setting = await db.collection<PortfolioSetting>("portfolioSettings").findOne({ key }, { projection: { _id: 0 } });
  return (setting?.value as T | undefined) ?? fallback;
}

export async function getAllSettings() {
  if (isTestRuntime()) return Array.from(testStore.settings.values());
  const db = await readyDb();
  return db ? db.collection<PortfolioSetting>("portfolioSettings").find({}, { projection: { _id: 0 } }).toArray() : [];
}

export async function setSetting(key: string, value: unknown) {
  const now = new Date();
  if (isTestRuntime()) {
    testStore.settings.set(key, { key, value, updatedAt: now });
    return;
  }
  const db = await readyDb();
  if (!db) throw new Error("MongoDB is not available.");
  await db.collection<PortfolioSetting>("portfolioSettings").updateOne({ key }, { $set: { value, updatedAt: now }, $setOnInsert: { key } }, { upsert: true });
}

export async function getCaseStudies(status?: "draft" | "published") {
  if (isTestRuntime()) return sortCaseStudies(Array.from(testStore.caseStudies.values()).filter((item) => !status || item.status === status));
  const db = await readyDb();
  if (!db) return [] as CaseStudy[];
  return db.collection<CaseStudy>("caseStudies").find(status ? { status } : {}, { projection: { _id: 0 } }).sort({ sortOrder: 1, id: 1 }).toArray();
}

export async function createCaseStudy(values: CaseStudyValues) {
  const now = new Date();
  if (isTestRuntime()) {
    if (Array.from(testStore.caseStudies.values()).some((item) => item.slug === values.slug)) throw { code: 11000 };
    const id = nextTestId("caseStudies");
    testStore.caseStudies.set(id, { id, ...values, createdAt: now, updatedAt: now });
    return id;
  }
  const db = await readyDb();
  if (!db) throw new Error("MongoDB is not available.");
  const id = await nextMongoId(db, "caseStudies");
  await db.collection<CaseStudy>("caseStudies").insertOne({ id, ...values, createdAt: now, updatedAt: now });
  return id;
}

export async function updateCaseStudy(id: number, values: CaseStudyValues) {
  const now = new Date();
  if (isTestRuntime()) {
    const existing = testStore.caseStudies.get(id);
    if (!existing) return false;
    if (Array.from(testStore.caseStudies.values()).some((item) => item.id !== id && item.slug === values.slug)) throw { code: 11000 };
    testStore.caseStudies.set(id, { ...existing, ...values, updatedAt: now });
    return true;
  }
  const db = await readyDb();
  if (!db) throw new Error("MongoDB is not available.");
  return (await db.collection<CaseStudy>("caseStudies").updateOne({ id }, { $set: { ...values, updatedAt: now } })).matchedCount > 0;
}

export async function removeCaseStudy(id: number) {
  if (isTestRuntime()) { testStore.caseStudies.delete(id); return; }
  const db = await readyDb();
  if (!db) throw new Error("MongoDB is not available.");
  await db.collection<CaseStudy>("caseStudies").deleteOne({ id });
}

export async function getMedia() {
  if (isTestRuntime()) return Array.from(testStore.media.values()).sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  const db = await readyDb();
  return db ? db.collection<PortfolioMedia>("portfolioMedia").find({}, { projection: { _id: 0 } }).sort({ createdAt: 1 }).toArray() : [] as PortfolioMedia[];
}

export async function createMedia(values: MediaValues) {
  const now = new Date();
  if (isTestRuntime()) {
    if (Array.from(testStore.media.values()).some((item) => item.key === values.key)) throw { code: 11000 };
    const id = nextTestId("portfolioMedia");
    testStore.media.set(id, { id, ...values, createdAt: now, updatedAt: now });
    return id;
  }
  const db = await readyDb();
  if (!db) throw new Error("MongoDB is not available.");
  const id = await nextMongoId(db, "portfolioMedia");
  await db.collection<PortfolioMedia>("portfolioMedia").insertOne({ id, ...values, createdAt: now, updatedAt: now });
  return id;
}

export async function updateMedia(id: number, values: Pick<MediaValues, "altText" | "caption">) {
  const now = new Date();
  if (isTestRuntime()) {
    const existing = testStore.media.get(id);
    if (existing) testStore.media.set(id, { ...existing, ...values, updatedAt: now });
    return;
  }
  const db = await readyDb();
  if (!db) throw new Error("MongoDB is not available.");
  await db.collection<PortfolioMedia>("portfolioMedia").updateOne({ id }, { $set: { ...values, updatedAt: now } });
}

export async function removeMedia(id: number) {
  if (isTestRuntime()) { testStore.media.delete(id); return; }
  const db = await readyDb();
  if (!db) throw new Error("MongoDB is not available.");
  await db.collection<PortfolioMedia>("portfolioMedia").deleteOne({ id });
}

export async function getOwnerVerificationSession(userId: number) {
  if (isTestRuntime()) return testStore.verificationSessions.get(userId);
  const db = await readyDb();
  if (!db) return undefined;
  return (await db.collection<OwnerVerificationSession>("ownerVerificationSessions").findOne({ userId }, { projection: { _id: 0 } })) ?? undefined;
}

export async function markOwnerVerified(userId: number, expiresAt: Date) {
  const now = new Date();
  if (isTestRuntime()) {
    const existing = testStore.verificationSessions.get(userId);
    testStore.verificationSessions.set(userId, { id: existing?.id ?? nextTestId("ownerVerificationSessions"), userId, verifiedAt: now, expiresAt, updatedAt: now });
    return;
  }
  const db = await readyDb();
  if (!db) throw new Error("MongoDB is not available.");
  const id = await nextMongoId(db, "ownerVerificationSessions");
  await db.collection<OwnerVerificationSession>("ownerVerificationSessions").updateOne(
    { userId },
    { $set: { verifiedAt: now, expiresAt, updatedAt: now }, $setOnInsert: { id, userId } },
    { upsert: true },
  );
}

export async function clearOwnerVerification(userId: number) {
  if (isTestRuntime()) { testStore.verificationSessions.delete(userId); return; }
  const db = await readyDb();
  if (!db) throw new Error("MongoDB is not available.");
  await db.collection<OwnerVerificationSession>("ownerVerificationSessions").deleteOne({ userId });
}
