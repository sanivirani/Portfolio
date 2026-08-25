import { describe, expect, it } from "vitest";
import { hasCorePortfolioSections, portfolioContent } from "./portfolio";

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
});
