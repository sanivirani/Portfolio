export type WorkItem = {
  title: string;
  label: string;
  industry: string;
  scope: string[];
  summary: string;
  focus: string;
  tone: "violet" | "lime" | "sand";
};

export const portfolioContent = {
  name: "Sani Virani",
  positioning: "Shopify Developer · Performance Marketer · Growth Analyst",
  hero: "I build digital stores, drive traffic, and analyze what happens next.",
  supportingLine:
    "A connected approach to Shopify development, paid acquisition, data, and conversion improvement.",
  editorial: {
    siteLabel: "PORTFOLIO",
    navHome: "HOME",
    navWork: "WORK",
    navAbout: "ABOUT",
    navServices: "SERVICES",
    navExperience: "EXPERIENCE",
    navContact: "CONTACT",
    menuLabel: "MENU",
    availabilityLineOne: "AVAILABLE FOR",
    availabilityLineTwo: "FREELANCE PROJECTS",
    heroKicker: "DIGITAL COMMERCE, CONNECTED",
    heroTitleLineOne: "CREATIVE",
    heroTitleLineTwo: "GROWTH",
    heroScript: "by design",
    heroCta: "VIEW MY WORK",
    portraitUrl: "/manus-storage/editorial-portrait_84d1e18b.jpeg",
    portraitAlt: "Black-and-white editorial portrait",
    credibilityHeadline: "BUILD\nWITH INTENT.\nCREATE MOMENTUM.",
    stats: [
      { value: "04", labelLineOne: "CORE", labelLineTwo: "DISCIPLINES" },
      { value: "03", labelLineOne: "CONNECTED", labelLineTwo: "FOCUS AREAS" },
      { value: "05", labelLineOne: "CAREER", labelLineTwo: "STAGES" },
      { value: "01", labelLineOne: "INTEGRATED", labelLineTwo: "APPROACH" },
    ],
    workLabel: "SELECTED\nPROJECTS",
    workCta: "EXPLORE A PROJECT",
    workNote: "Project descriptions reflect the supplied portfolio record; outcomes are discussed from verified project data only.",
    filterLabel: "FILTER BY",
    filterAllLabel: "ALL WORK",
    filterRolePrefix: "ROLE ·",
    filterEmptyMessage: "No project matches this combination. Remove a filter or choose All Work to explore the full portfolio.",
    servicesLabel: "WHAT\nI DO",
    experienceTitle: "EXPERIENCE\n& PRACTICE",
    collaborationsLabel: "SELECTED COLLABORATIONS",
    contactHeadline: "LET’S\nBUILD\nTOGETHER",
    contactAvailability: "I’M CURRENTLY AVAILABLE\nFOR SELECTED PROJECTS",
    contactFallbackLabel: "Connect on LinkedIn",
    contactLocationLabel: "Worldwide / Remote",
    linkedinDisplayLabel: "linkedin.com/in/sanivirani",
    githubDisplayLabel: "github.com",
    resumeLabel: "DOWNLOAD RESUME",
    copyEmailLabel: "COPY EMAIL",
    emailUnavailableLabel: "EMAIL UNAVAILABLE",
    emailCopiedLabel: "EMAIL COPIED",
    emailCopiedMessage: "Email address copied to clipboard.",
    thanksLabel: "Thank you",
    footerTagline: "SHOPIFY · PERFORMANCE · GROWTH",
    studioLabel: "CONTENT STUDIO",
  },
  sections: {
    expertiseHeading: "One partner across the work that moves ecommerce forward.",
    expertiseIntro: "The strongest digital experiences are not isolated pages or campaigns. They are systems where each decision informs the next.",
    statement: "The goal isn’t simply to make a store look good. It’s to make every point in the customer journey work together.",
    workHeading: "Projects built with the entire customer journey in view.",
    workIntro: "A selection of engagements across jewelry, ecommerce, development, and growth execution. Every detail shown is grounded in the supplied portfolio record.",
    journeyHeading: "Experience built across the full ecommerce ecosystem.",
    journeyIntro: "From Shopify foundations to cross-functional campaign and analytics work, Sani’s path has been shaped by understanding how the parts relate.",
    approachHeading: "Clear priorities, well-made execution, and a feedback loop that keeps learning.",
    contactHeading: "Have a store, campaign, or growth question worth exploring?",
  },
  pillars: [
    { number: "01", title: "Build", eyebrow: "Shopify & ecommerce development", description: "High-intent storefront experiences designed around the customer journey, product clarity, and operational scale.", tags: ["Shopify", "Liquid", "Storefront UX"] },
    { number: "02", title: "Acquire", eyebrow: "Performance marketing", description: "Paid acquisition systems that bring the right audience to a page built to meet their expectations.", tags: ["Meta Ads", "Google Ads", "Creative testing"] },
    { number: "03", title: "Analyze", eyebrow: "Measurement & funnel insight", description: "A practical view of the signals behind traffic, behavior, conversion, and campaign performance.", tags: ["Analytics", "KPIs", "Customer behavior"] },
    { number: "04", title: "Optimize", eyebrow: "Conversion improvement", description: "Focused iteration across landing pages, product experiences, campaigns, and the moments between them.", tags: ["CRO", "Landing pages", "User journeys"] },
  ],
  work: [
    { title: "Awaken Jewels", label: "Jewelry · Ecommerce", industry: "Lab-grown diamond jewelry", scope: ["Shopify", "Ecommerce"], summary: "A jewelry-led digital experience shaped around product discovery, trust, and a considered customer journey.", focus: "Storefront experience & conversion path", tone: "violet" },
    { title: "Oraza", label: "Website development · Ongoing", industry: "Ecommerce", scope: ["Development", "Shopify"], summary: "An ongoing website development engagement with the structure to support iteration as the business evolves.", focus: "Website foundation & ongoing improvement", tone: "lime" },
    { title: "Digiplexo Pvt. Ltd.", label: "Shopify developer + performance marketer", industry: "Digital growth", scope: ["Performance Marketing", "Analytics"], summary: "A cross-functional role connecting Shopify execution with paid acquisition and marketing performance analysis.", focus: "Acquisition, measurement & ecommerce execution", tone: "sand" },
  ] satisfies WorkItem[],
  journey: [
    { period: "Early career", company: "Infynno Solutions", role: "Internship", track: "Foundation" },
    { period: "Growth", company: "Jewelry Brand", role: "Business development associate", track: "Jewelry" },
    { period: "Commerce", company: "Codes Dot Solutions", role: "Shopify intern", track: "Shopify" },
    { period: "Integrated", company: "Digiplexo Pvt. Ltd.", role: "Shopify developer + performance marketer", track: "Growth" },
    { period: "Independent", company: "Freelance", role: "Independent digital projects", track: "Projects" },
  ],
  process: [
    ["01", "Find the friction", "Clarify the business goal, audience context, and the moments where momentum is lost."],
    ["02", "Design the move", "Connect the right storefront, campaign, content, and measurement priorities into one plan."],
    ["03", "Ship with intent", "Build and launch the highest-leverage work with an eye on detail and iteration."],
    ["04", "Learn and improve", "Use performance signals to decide what to refine next, rather than guessing."],
  ],
  stack: ["Shopify", "Liquid", "HTML / CSS", "JavaScript", "Meta Ads", "Google Ads", "Analytics", "CRO"],
};

export const defaultSiteSettings = {
  contactEmail: "",
  linkedinUrl: "https://in.linkedin.com/in/sanivirani",
  githubUrl: "https://github.com/",
  contactIntro: "Share a concise brief, the business context, and what you want to improve.",
};

export function hasCorePortfolioSections() {
  return portfolioContent.pillars.length === 4 && portfolioContent.work.length >= 3;
}
