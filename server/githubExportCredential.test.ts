import { describe, expect, it } from "vitest";

describe("GitHub portfolio export credential", () => {
  it("can read the confirmed repository and reports push permission", async () => {
    const token = process.env.GITHUB_PORTFOLIO_PUSH_TOKEN;

    expect(token, "GITHUB_PORTFOLIO_PUSH_TOKEN must be configured").toBeTruthy();

    const response = await fetch("https://api.github.com/repos/sanivirani/Portfolio", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    expect(response.ok, `GitHub repository check failed with ${response.status}`).toBe(true);
    const repository = await response.json() as { permissions?: { push?: boolean } };
    expect(repository.permissions?.push, "Token must have Contents write access to sanivirani/Portfolio").toBe(true);
  });
});
