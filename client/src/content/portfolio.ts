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

export const portfolioResume = {
  url: "/manus-storage/sani-virani-portfolio_ae25af02.pdf",
  filename: "Sani-Virani-Portfolio.pdf",
} as const;

type FilterableWork = { scope: readonly string[]; role?: string | null };

export type ProjectFilter = {
  key: string;
  label: string;
  kind: "Technology" | "Role";
};

export function getProjectCategories(work: readonly FilterableWork[]) {
  return Array.from(new Set(work.flatMap((project) => project.scope).filter(Boolean)));
}

function getRoleLabels(role?: string | null) {
  return (role ?? "")
    .split(/[+·/]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function getProjectFilters(work: readonly FilterableWork[]): ProjectFilter[] {
  const technologies = getProjectCategories(work).map((label) => ({
    key: `technology:${label}`,
    label,
    kind: "Technology" as const,
  }));
  const roles = Array.from(new Set(work.flatMap((project) => getRoleLabels(project.role)))).map((label) => ({
    key: `role:${label}`,
    label,
    kind: "Role" as const,
  }));

  return [...technologies, ...roles];
}

export function projectMatchesFilters(project: FilterableWork, selectedFilters: readonly string[]) {
  return selectedFilters.every((filterKey) => {
    const [kind, ...labelParts] = filterKey.split(":");
    const label = labelParts.join(":");
    return kind === "technology"
      ? project.scope.includes(label)
      : getRoleLabels(project.role).includes(label);
  });
}

export const editorialProjectCards = [
  { visual: "jewelry", category: "ECOMMERCE" },
  { visual: "type", category: "WEBSITE DEVELOPMENT" },
  { visual: "mobile", category: "GROWTH SYSTEM" },
  { visual: "monogram", category: "INDEPENDENT WORK" },
] as const;
