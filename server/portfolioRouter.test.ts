import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAnonymousContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createAdminContext(id = 1): TrpcContext {
  return {
    user: {
      id,
      openId: "portfolio-owner",
      email: "owner@example.com",
      name: "Sani Virani",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("portfolio admin router", () => {
  it("rejects anonymous requests to the portfolio control center", async () => {
    const caller = appRouter.createCaller(createAnonymousContext());
    await expect(caller.portfolio.admin.overview()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects an unverified admin before any CMS initialization can change content", async () => {
    const caller = appRouter.createCaller(createAdminContext(987654));
    await expect(caller.portfolio.admin.initialize()).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("initializes editable public portfolio records without adding invented metrics", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await caller.ownerVerification.verifyPin({ pin: process.env.ADMIN_OWNER_PIN!, phone: process.env.ADMIN_OWNER_PHONE! });
    await expect(caller.portfolio.admin.initialize()).resolves.toEqual({ initialized: true });
    const [settings, caseStudies] = await Promise.all([
      caller.portfolio.admin.settings.get(),
      caller.portfolio.admin.caseStudies.list(),
    ]);
    expect(settings.linkedinUrl).toBe("https://in.linkedin.com/in/sanivirani");
    expect(settings.githubUrl).toBe("https://github.com/");
    expect(caseStudies.map((item) => item.title)).toEqual(expect.arrayContaining(["Awaken Jewels", "Oraza", "Digiplexo Pvt. Ltd."]));
    expect(caseStudies.every((item) => item.metrics.length === 0)).toBe(true);
    expect(caseStudies.every((item) => !item.role)).toBe(true);
    await expect(caller.portfolio.admin.settings.update(settings)).resolves.toEqual(settings);
    const publicSite = await caller.portfolio.public.site();
    expect(publicSite.settings).toEqual(settings);
    expect(publicSite.caseStudies).toHaveLength(3);
  });

  it("saves editorial labels, credibility stats, and timeline entries through the verified content workflow", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await caller.ownerVerification.verifyPin({ pin: process.env.ADMIN_OWNER_PIN!, phone: process.env.ADMIN_OWNER_PHONE! });
    await caller.portfolio.admin.initialize();
    const content = await caller.portfolio.admin.content.get();
    const nextContent = {
      ...content,
      editorial: {
        ...content.editorial,
        heroKicker: "COMMERCE, WITH INTENT",
        stats: content.editorial.stats.map((stat, index) => index === 0 ? { ...stat, value: "07" } : stat),
      },
      journey: content.journey.map((entry, index) => index === 0 ? { ...entry, track: "Studio" } : entry),
    };

    try {
      await expect(caller.portfolio.admin.content.update(nextContent)).resolves.toEqual(nextContent);
      const publicSite = await caller.portfolio.public.site();

      expect(publicSite.content.editorial.heroKicker).toBe("COMMERCE, WITH INTENT");
      expect(publicSite.content.editorial.stats[0]?.value).toBe("07");
      expect(publicSite.content.journey[0]?.track).toBe("Studio");
    } finally {
      await caller.portfolio.admin.content.update(content);
    }
  });

  it("accepts the configured application-managed owner PIN through the verification endpoint", async () => {
    const pin = process.env.ADMIN_OWNER_PIN;
    const phone = process.env.ADMIN_OWNER_PHONE;
    expect(pin).toBeTruthy();
    expect(phone).toBeTruthy();
    const caller = appRouter.createCaller(createAdminContext());
    await expect(caller.ownerVerification.verifyPin({ pin: pin!, phone: phone! })).resolves.toMatchObject({ verified: true, expiresAt: expect.any(Date) });
  });
});
