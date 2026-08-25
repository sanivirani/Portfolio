import { describe, expect, it } from "vitest";
import { defaultSiteSettings, hasCorePortfolioSections, portfolioContent } from "./portfolio";

describe("portfolio homepage content", () => {
  it("keeps the four-part growth loop intact", () => {
    expect(portfolioContent.pillars.map((pillar) => pillar.title)).toEqual([
      "Build",
      "Acquire",
      "Analyze",
      "Optimize",
    ]);
    expect(hasCorePortfolioSections()).toBe(true);
  });

  it("uses supplied project names without inventing outcome metrics", () => {
    expect(portfolioContent.work.map((item) => item.title)).toEqual([
      "Awaken Jewels",
      "Oraza",
      "Digiplexo Pvt. Ltd.",
    ]);
    expect(JSON.stringify(portfolioContent.work)).not.toMatch(/ROAS|revenue|%|orders/i);
  });

  it("makes the supplied LinkedIn and GitHub links available to the managed contact area", () => {
    expect(defaultSiteSettings.linkedinUrl).toBe("https://in.linkedin.com/in/sanivirani");
    expect(defaultSiteSettings.githubUrl).toBe("https://github.com/");
    expect(defaultSiteSettings.contactEmail).toBe("");
  });
});
