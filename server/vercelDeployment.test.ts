import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Vercel deployment configuration", () => {
  it("builds the client output, retains API function routing, and keeps SPA deep links available", async () => {
    const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));

    expect(config.buildCommand).toBe("pnpm build:client");
    expect(config.outputDirectory).toBe("dist/public");
    expect(config.functions["api/[...path].ts"].maxDuration).toBe(30);
    expect(config.rewrites).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: "/(.*)", destination: "/index.html" }),
      expect.objectContaining({ source: "/manus-storage/:path*" }),
    ]));
  });

  it("documents the external database, OAuth callback, and required production variables", async () => {
    const guide = await readFile(new URL("../VERCEL_DEPLOYMENT.md", import.meta.url), "utf8");

    expect(guide).toContain("DATABASE_URL");
    expect(guide).toContain("JWT_SECRET");
    expect(guide).toContain("/api/oauth/callback");
    expect(guide).toContain("Manus Forge storage");
  });
});
