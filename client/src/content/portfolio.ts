import {
  defaultSiteSettings,
  hasCorePortfolioSections,
  portfolioContent,
} from "../../../shared/portfolioDefaults";

export { defaultSiteSettings, hasCorePortfolioSections, portfolioContent };
export type { WorkItem } from "../../../shared/portfolioDefaults";

export const portfolioNavigation = [
  ["HOME", "#top"],
  ["WORK", "#work"],
  ["ABOUT", "#principle"],
  ["SERVICES", "#services"],
  ["EXPERIENCE", "#experience"],
  ["CONTACT", "#contact"],
] as const;

export const portfolioStats = [
  { value: "04", label: ["CORE", "DISCIPLINES"] },
  { value: "03", label: ["CONNECTED", "FOCUS AREAS"] },
  { value: "05", label: ["CAREER", "STAGES"] },
  { value: "01", label: ["INTEGRATED", "APPROACH"] },
] as const;

export const editorialProjectCards = [
  { visual: "jewelry", category: "ECOMMERCE" },
  { visual: "type", category: "WEBSITE DEVELOPMENT" },
  { visual: "mobile", category: "GROWTH SYSTEM" },
  { visual: "monogram", category: "INDEPENDENT WORK" },
] as const;
