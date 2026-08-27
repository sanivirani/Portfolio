import { describe, expect, it } from "vitest";
import { buildGitHubAuthorizationUrl, githubCallbackUrl, matchesGitHubAdminLogin, requestOrigin } from "./_core/oauth";

describe("GitHub OAuth configuration", () => {
  it("constructs an authorization-code request with only the required profile scope", () => {
    const url = new URL(buildGitHubAuthorizationUrl({
      clientId: "client-id",
      redirectUri: "https://portfolio.example.com/api/oauth/callback",
      state: "state-value",
    }));

    expect(url.origin).toBe("https://github.com");
    expect(url.pathname).toBe("/login/oauth/authorize");
    expect(url.searchParams.get("client_id")).toBe("client-id");
    expect(url.searchParams.get("redirect_uri")).toBe("https://portfolio.example.com/api/oauth/callback");
    expect(url.searchParams.get("state")).toBe("state-value");
    expect(url.searchParams.get("scope")).toBe("read:user");
    expect(url.searchParams.get("allow_signup")).toBe("false");
  });

  it("creates the expected Vercel callback and compares the owner login without case sensitivity", () => {
    expect(githubCallbackUrl("https://portfolio-henna-nu-35.vercel.app")).toBe(
      "https://portfolio-henna-nu-35.vercel.app/api/oauth/callback",
    );
    expect(matchesGitHubAdminLogin("SaniVirani", "sanivirani")).toBe(true);
    expect(matchesGitHubAdminLogin("another-account", "sanivirani")).toBe(false);
  });

  it("uses the forwarded public origin supplied by a hosting proxy", () => {
    const origin = requestOrigin({
      protocol: "http",
      headers: {
        "x-forwarded-proto": "https",
        "x-forwarded-host": "sanivfolio-jxuzqthb.manus.space, internal-host",
      },
      get: () => "internal-host",
    } as never);

    expect(origin).toBe("https://sanivfolio-jxuzqthb.manus.space");
  });
});
