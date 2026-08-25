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

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
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

  it("initializes editable public portfolio records without adding invented metrics", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await expect(caller.portfolio.admin.initialize()).resolves.toEqual({ initialized: true });
    const [settings, caseStudies] = await Promise.all([
      caller.portfolio.admin.settings.get(),
      caller.portfolio.admin.caseStudies.list(),
    ]);
    expect(settings.linkedinUrl).toBe("https://in.linkedin.com/in/sanivirani");
    expect(settings.githubUrl).toBe("https://github.com/");
    expect(caseStudies.map((item) => item.title)).toEqual(expect.arrayContaining(["Awaken Jewels", "Oraza", "Digiplexo Pvt. Ltd."]));
    expect(caseStudies.every((item) => item.metrics.length === 0)).toBe(true);
    await expect(caller.portfolio.admin.settings.update(settings)).resolves.toEqual(settings);
    const publicSite = await caller.portfolio.public.site();
    expect(publicSite.settings).toEqual(settings);
    expect(publicSite.caseStudies).toHaveLength(3);
  });
});
