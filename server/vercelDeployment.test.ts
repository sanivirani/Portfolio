import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { describe, expect, it } from "vitest";
import vercelApi from "../api/[...path]";

describe("Vercel deployment configuration", () => {
  it("builds the client output, retains API function routing, and keeps SPA deep links available", async () => {
    const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));

    expect(config.buildCommand).toBe("pnpm build:client");
    expect(config.outputDirectory).toBe("dist/public");
    expect(config.functions["api/[...path].ts"].maxDuration).toBe(30);
    expect(config.rewrites).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: "/:path((?!api/).*)", destination: "/index.html" }),
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

  it("exposes the Vercel default export as an HTTP application for /api routes", async () => {
    const server = createServer(vercelApi);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

    try {
      const port = (server.address() as AddressInfo).port;
      const response = await fetch(`http://127.0.0.1:${port}/api/oauth/callback`);

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: "code and state are required" });
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });

  it("serves the SPA entry document for a client-side deep link without consuming API paths", async () => {
    const html = await readFile(new URL("../client/index.html", import.meta.url), "utf8");
    const server = createServer((request, response) => {
      if (request.url?.startsWith("/api/")) {
        vercelApi(request, response);
        return;
      }

      response.statusCode = 200;
      response.setHeader("Content-Type", "text/html; charset=utf-8");
      response.end(html);
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

    try {
      const port = (server.address() as AddressInfo).port;
      const response = await fetch(`http://127.0.0.1:${port}/admin`);
      const page = await response.text();

      expect(response.status).toBe(200);
      expect(page).toContain('<div id="root"></div>');
      expect(page).toContain('/src/main.tsx');
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });
});
