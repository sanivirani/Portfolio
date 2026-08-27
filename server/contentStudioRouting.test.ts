import { describe, expect, it } from "vitest";
import {
  CONTENT_STUDIO_PRODUCTION_ORIGIN,
  contentStudioHrefForOrigin,
  contentStudioLoginHrefForOrigin,
} from "../shared/contentStudioRouting";

describe("Content Studio host routing", () => {
  it("hands Manus preview admin links to the Vercel Production deployment", () => {
    expect(contentStudioHrefForOrigin("https://sanivfolio-jxuzqthb.manus.space")).toBe(
      `${CONTENT_STUDIO_PRODUCTION_ORIGIN}/admin`,
    );
    expect(contentStudioLoginHrefForOrigin("https://3000-project.manus.computer")).toBe(
      `${CONTENT_STUDIO_PRODUCTION_ORIGIN}/api/oauth/github`,
    );
  });

  it("keeps Vercel and non-Manus deployments on same-origin admin routes", () => {
    expect(contentStudioHrefForOrigin(CONTENT_STUDIO_PRODUCTION_ORIGIN)).toBe("/admin");
    expect(contentStudioLoginHrefForOrigin("https://preview.example.com")).toBe("/api/oauth/github");
  });
});
