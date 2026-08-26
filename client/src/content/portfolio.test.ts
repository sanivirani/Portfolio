import { describe, expect, it } from "vitest";
import {
  defaultSiteSettings,
  editorialProjectCards,
  getProjectCategories,
  getProjectFilters,
  hasCorePortfolioSections,
  portfolioContent,
  portfolioNavigation,
  portfolioResume,
  portfolioStats,
  projectMatchesFilters,
} from "./portfolio";

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

  it("keeps every portfolio navigation item bound to a same-page destination", () => {
    expect(portfolioNavigation.map(([, href]) => href)).toEqual([
      "#top", "#work", "#principle", "#services", "#experience", "#contact",
    ]);
  });

  it("uses evidence-based credibility markers and four editorial project slots", () => {
    expect(portfolioStats.map((stat) => stat.value)).toEqual(["04", "03", "05", "01"]);
    expect(editorialProjectCards).toHaveLength(4);
  });

  it("provides a stable managed-download configuration for the portfolio PDF", () => {
    expect(portfolioResume).toEqual({
      url: "/manus-storage/sani-virani-portfolio_ae25af02.pdf",
      filename: "Sani-Virani-Portfolio.pdf",
    });
  });

  it("derives usable technology and role filters from the supplied project scopes", () => {
    expect(getProjectCategories(portfolioContent.work)).toEqual([
      "Shopify", "Ecommerce", "Development", "Performance Marketing", "Analytics",
    ]);
  });

  it("matches work against combined technology and role filters", () => {
    const work = [
      { scope: ["Shopify", "Ecommerce"], role: "Shopify Developer + Performance Marketer" },
      { scope: ["Analytics"], role: "Growth Analyst" },
    ];
    expect(getProjectFilters(work)).toEqual([
      { key: "technology:Shopify", label: "Shopify", kind: "Technology" },
      { key: "technology:Ecommerce", label: "Ecommerce", kind: "Technology" },
      { key: "technology:Analytics", label: "Analytics", kind: "Technology" },
      { key: "role:Shopify Developer", label: "Shopify Developer", kind: "Role" },
      { key: "role:Performance Marketer", label: "Performance Marketer", kind: "Role" },
      { key: "role:Growth Analyst", label: "Growth Analyst", kind: "Role" },
    ]);
    expect(projectMatchesFilters(work[0], ["technology:Shopify", "role:Performance Marketer"])).toBe(true);
    expect(projectMatchesFilters(work[0], ["technology:Analytics"])).toBe(false);
  });

  it("makes the supplied LinkedIn and GitHub links available to the managed contact area", () => {
    expect(defaultSiteSettings.linkedinUrl).toBe("https://in.linkedin.com/in/sanivirani");
    expect(defaultSiteSettings.githubUrl).toBe("https://github.com/");
    expect(defaultSiteSettings.contactEmail).toBe("");
  });
});
