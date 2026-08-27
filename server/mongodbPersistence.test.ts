import * as db from "./db";
import { beforeEach, describe, expect, it } from "vitest";

const baseCaseStudy = {
  slug: "atlas-launch",
  title: "Atlas Launch",
  label: "Ecommerce launch",
  industry: "Retail",
  role: null,
  description: "A case study stored through the MongoDB persistence contract.",
  focus: "Performance",
  tone: "lime" as const,
  services: JSON.stringify(["Strategy"]),
  technologies: JSON.stringify(["Shopify"]),
  metrics: JSON.stringify([]),
  mediaId: null,
  sortOrder: 2,
  status: "published" as const,
};

describe("MongoDB portfolio persistence contract", () => {
  beforeEach(() => db.resetPortfolioTestStorage());

  it("persists editable settings without MySQL JSON serialization", async () => {
    const fallback = { headline: "Fallback" };
    await expect(db.getSetting("siteContent", fallback)).resolves.toEqual(fallback);

    const content = { headline: "Creative Growth", editorial: { siteLabel: "Portfolio" } };
    await db.setSetting("siteContent", content);

    await expect(db.getSetting("siteContent", fallback)).resolves.toEqual(content);
    await expect(db.getAllSettings()).resolves.toEqual([
      expect.objectContaining({ key: "siteContent", value: content, updatedAt: expect.any(Date) }),
    ]);
  });

  it("preserves numeric public identifiers, sorting, and uniqueness for case studies", async () => {
    const secondId = await db.createCaseStudy(baseCaseStudy);
    const firstId = await db.createCaseStudy({ ...baseCaseStudy, slug: "atlas-discovery", title: "Atlas Discovery", sortOrder: 1 });

    expect([secondId, firstId]).toEqual([1, 2]);
    await expect(db.getCaseStudies("published")).resolves.toEqual([
      expect.objectContaining({ id: firstId, slug: "atlas-discovery", sortOrder: 1 }),
      expect.objectContaining({ id: secondId, slug: "atlas-launch", sortOrder: 2 }),
    ]);
    await expect(db.createCaseStudy(baseCaseStudy)).rejects.toMatchObject({ code: 11000 });
    expect(db.isDuplicateEntry({ code: 11000 })).toBe(true);
  });

  it("creates and revokes per-user owner-verification sessions", async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    await db.markOwnerVerified(42, expiresAt);
    await expect(db.getOwnerVerificationSession(42)).resolves.toEqual(expect.objectContaining({
      userId: 42,
      expiresAt,
      verifiedAt: expect.any(Date),
    }));

    await db.clearOwnerVerification(42);
    await expect(db.getOwnerVerificationSession(42)).resolves.toBeUndefined();
  });

  it("persists an explicitly assigned GitHub administrator role", async () => {
    await db.upsertUser({
      openId: "github:103173775",
      name: "Sani Virani",
      loginMethod: "github",
      role: "admin",
    });

    await expect(db.getUserByOpenId("github:103173775")).resolves.toEqual(
      expect.objectContaining({ loginMethod: "github", role: "admin" }),
    );
  });
});
