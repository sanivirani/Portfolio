import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Box,
  BriefcaseBusiness,
  Check,
  Code2,
  Copy,
  FileDown,
  Globe2,
  Linkedin,
  Mail,
  Menu,
  MousePointer2,
  Sparkles,
  X,
} from "lucide-react";
import {
  defaultSiteSettings,
  editorialProjectCards,
  getProjectFilters,
  portfolioContent,
  portfolioResume,
  portfolioStats,
  projectMatchesFilters,
} from "@/content/portfolio";
import { trpc } from "@/lib/trpc";

const assetUrls = {
  jewelry: "/manus-storage/jewelry-editorial_bb3146ba.jpg",
  mobile: "/manus-storage/app-mockup_a0db00ca.png",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [emailCopied, setEmailCopied] = useState(false);
  const { data: managedSite } = trpc.portfolio.public.site.useQuery();

  useEffect(() => {
    const revealTargets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    revealTargets.forEach((target) => target.classList.add("reveal-ready"));

    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealTargets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -32px" },
    );

    revealTargets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  const content = managedSite?.content ?? {
    ...portfolioContent,
    process: portfolioContent.process.map(([number, title, description]) => ({ number, title, description })),
  };
  const settings = managedSite?.settings ?? defaultSiteSettings;
  const suppliedWork = managedSite?.caseStudies?.length
    ? managedSite.caseStudies.map((item) => ({
        title: item.title,
        label: item.label,
        summary: item.description,
        focus: item.focus,
        scope: item.services,
        role: item.role,
      }))
    : portfolioContent.work.map((item) => ({
        ...item,
        role: item.title === "Digiplexo Pvt. Ltd." ? "Shopify Developer + Performance Marketer" : "",
      }));
  const roles = content.positioning.split(" · ");
  const editorial = content.editorial;
  const navigation = [
    [editorial.navHome, "#top"],
    [editorial.navWork, "#work"],
    [editorial.navAbout, "#principle"],
    [editorial.navServices, "#services"],
    [editorial.navExperience, "#experience"],
    [editorial.navContact, "#contact"],
  ] as const;
  const contactHref = settings.contactEmail
    ? `mailto:${settings.contactEmail}?subject=Project%20enquiry%20for%20${encodeURIComponent(content.name)}`
    : settings.linkedinUrl || "#contact";
  const contactExternal = Boolean(!settings.contactEmail && settings.linkedinUrl);
  const featuredWork = [
    ...suppliedWork,
    {
      title: "Independent Projects",
      label: "Freelance · Digital growth",
      summary: "Independent engagements shaped around digital storefronts, acquisition, and the feedback loops between them.",
      focus: "Connected ecommerce practice",
      scope: ["Shopify", "Growth"],
      role: "Independent Digital Projects",
    },
  ].slice(0, 4).map((project, cardIndex) => ({ ...project, cardIndex }));
  const projectFilters = getProjectFilters(featuredWork);
  const visibleWork = activeFilters.length === 0
    ? featuredWork
    : featuredWork.filter((project) => projectMatchesFilters(project, activeFilters));
  const emailAddress = settings.contactEmail;

  const toggleProjectFilter = (filterKey: string) => {
    setActiveFilters((filters) => filters.includes(filterKey)
      ? filters.filter((key) => key !== filterKey)
      : [...filters, filterKey]);
  };

  const copyEmail = async () => {
    if (!emailAddress) return;

    try {
      await navigator.clipboard.writeText(emailAddress);
    } catch {
      const input = document.createElement("textarea");
      input.value = emailAddress;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }

    setEmailCopied(true);
    window.setTimeout(() => setEmailCopied(false), 1800);
  };

  return (
    <div className="portfolio-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>

      <header className="topbar">
        <div className="page-width topbar__inside">
          <a className="topbar__portfolio" href="#top" aria-label={`${content.name} home`}>
            <span>{editorial.siteLabel}</span>
            <i aria-hidden="true" />
          </a>

          <nav className="desktop-nav" aria-label="Main navigation">
            {navigation.map(([label, href]) => <a href={href} key={href}>{label}</a>)}
          </nav>

          <div className="topbar__available" aria-label="Available for freelance projects">
            <span className="available-orbit" aria-hidden="true" />
            <span>{editorial.availabilityLineOne}<br />{editorial.availabilityLineTwo}</span>
          </div>

          <button
            className="menu-button"
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <nav className="mobile-menu" aria-label="Mobile navigation">
          <div className="mobile-menu__top">
            <span>{editorial.menuLabel}</span>
            <span>0{navigation.length}</span>
          </div>
          <div className="mobile-menu__links">
            {navigation.map(([label, href], index) => (
              <a href={href} key={href} onClick={() => setMenuOpen(false)}>
                <small>0{index + 1}</small><span>{label}</span><ArrowRight size={20} aria-hidden="true" />
              </a>
            ))}
          </div>
          <p>{content.positioning}</p>
        </nav>
      )}

      <main id="main-content">
        <section className="hero-section" id="top">
          <div className="page-width hero-grid">
            <div className="hero-copy">
              <p className="hero-kicker">{editorial.heroKicker}</p>
              <h1><span>{editorial.heroTitleLineOne}</span><span>{editorial.heroTitleLineTwo}</span></h1>
              <span className="script-line">{editorial.heroScript}</span>
              <p className="hero-statement">{content.hero}</p>
              <a className="primary-link" href="#work">{editorial.heroCta} <ArrowDownRight size={19} aria-hidden="true" /></a>
              <span className="hero-gridmark" aria-hidden="true">✦</span>
            </div>

            <div className="hero-portrait-wrap">
              <div className="portrait-frame">
                <img src={editorial.portraitUrl} alt={editorial.portraitAlt} />
              </div>
              <div className="role-list">
                {roles.map((role) => <span key={role}>{role}</span>)}
              </div>
            </div>
          </div>
        </section>

        <section className="credibility page-width" aria-labelledby="credibility-title">
          <div className="credibility__intro">
            <Sparkles size={20} aria-hidden="true" />
            <h2 id="credibility-title" className="whitespace-pre-line">{editorial.credibilityHeadline}</h2>
            <p>{content.supportingLine}</p>
          </div>
          {editorial.stats.map((stat, index) => (
            <div className="stat-block" key={`${stat.value}-${index}`}>
              <span className="stat-block__icon" aria-hidden="true">
                {index === 0 && <Box size={21} />}
                {index === 1 && <MousePointer2 size={21} />}
                {index === 2 && <BriefcaseBusiness size={21} />}
                {index === 3 && <Globe2 size={21} />}
              </span>
              <strong>{stat.value}</strong>
              <span><span>{stat.labelLineOne}</span><span>{stat.labelLineTwo}</span></span>
            </div>
          ))}
        </section>

        <section className="work-section page-width" id="work" aria-labelledby="work-title">
          <div className="section-bar">
            <div><p className="whitespace-pre-line">{editorial.workLabel} <ArrowUpRight size={16} aria-hidden="true" /></p></div>
            <a href="#contact">{editorial.workCta} <ArrowRight size={17} aria-hidden="true" /></a>
          </div>
          <div className="project-filter" aria-label="Filter projects by technology or role">
            <span>{editorial.filterLabel}</span>
            <div className="project-filter__controls" role="group" aria-label="Project categories">
              <button type="button" className={activeFilters.length === 0 ? "is-active" : ""} aria-pressed={activeFilters.length === 0} onClick={() => setActiveFilters([])}>{editorial.filterAllLabel}</button>
              {projectFilters.map((filter) => (
                <button type="button" className={activeFilters.includes(filter.key) ? "is-active" : ""} aria-pressed={activeFilters.includes(filter.key)} onClick={() => toggleProjectFilter(filter.key)} key={filter.key}>
                  {filter.kind === "Role" ? `${editorial.filterRolePrefix} ` : ""}{filter.label}
                </button>
              ))}
            </div>
          </div>
          <div className="project-grid">
            {visibleWork.map((project) => {
              const treatment = editorialProjectCards[project.cardIndex];
              return (
                <article className={`project-card project-card--${treatment.visual}`} data-reveal key={`${project.title}-${project.cardIndex}`}>
                  <a href="#contact" aria-label={`Discuss a project similar to ${project.title}`}>
                    <div className="project-card__image" aria-hidden="true">
                      {treatment.visual === "jewelry" && <img src={assetUrls.jewelry} alt="" />}
                      {treatment.visual === "mobile" && <img src={assetUrls.mobile} alt="" />}
                      {treatment.visual === "type" && <div className="typographic-art"><span>O</span><span>R</span><span>A</span><span>Z</span><span>A</span></div>}
                      {treatment.visual === "monogram" && <div className="monogram-art"><span>SV</span><i /></div>}
                    </div>
                    <div className="project-card__copy">
                      <span className="project-number">0{project.cardIndex + 1}</span>
                      <div><h3>{project.title}</h3><p>{project.label || treatment.category}</p></div>
                      <ArrowUpRight size={17} aria-hidden="true" />
                    </div>
                  </a>
                </article>
              );
            })}
          </div>
          {visibleWork.length === 0 && <p className="project-empty" role="status">{editorial.filterEmptyMessage}</p>}
          <p className="work-note">{editorial.workNote}</p>
        </section>

        <section className="services-section page-width" id="services" aria-labelledby="services-title">
          <div className="services-heading"><p className="whitespace-pre-line">{editorial.servicesLabel} <ArrowDownRight size={16} aria-hidden="true" /></p></div>
          <div className="service-grid" id="services-title">
            {content.pillars.map((pillar, index) => (
              <article className="service-card" key={pillar.title}>
                <span className="service-card__icon" aria-hidden="true">
                  {index === 0 && <Code2 size={25} />}
                  {index === 1 && <MousePointer2 size={25} />}
                  {index === 2 && <Globe2 size={25} />}
                  {index === 3 && <Sparkles size={25} />}
                </span>
                <h2>{pillar.title}</h2>
                <p>{pillar.description}</p>
                <span className="service-index">0{index + 1}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="experience-section page-width" id="experience" aria-labelledby="experience-title" data-reveal>
          <div className="experience-list">
            <div className="experience-list__heading"><h2 id="experience-title" className="whitespace-pre-line">{editorial.experienceTitle}</h2><ArrowRight size={18} aria-hidden="true" /></div>
            <ol>
              {content.journey.map((item, index) => (
                <li key={item.company}>
                  <span>{item.period}</span><i aria-hidden="true" /><div><h3>{item.company}</h3><p>{item.role}</p></div><em>0{index + 1}</em>
                </li>
              ))}
            </ol>
          </div>
          <aside className="principle-panel" id="principle" aria-labelledby="principle-title">
            <span className="quote-mark" aria-hidden="true">“</span>
            <p id="principle-title">{content.sections.statement}</p>
            <div className="principle-panel__signature"><span className="signature-badge">{getInitials(content.name)}</span><span><strong>{content.name}</strong><small>{content.positioning}</small></span></div>
          </aside>
          <div className="experience-art" aria-hidden="true"><span>SV</span><i /><i /><i /></div>
        </section>

        <section className="collaborations page-width" aria-label="Selected collaborations">
          <p>{editorial.collaborationsLabel} <ArrowUpRight size={15} aria-hidden="true" /></p>
          <div>{suppliedWork.slice(0, 3).map((project) => <span key={project.title}>{project.title}</span>)}</div>
        </section>

        <section className="contact-section page-width" id="contact" aria-labelledby="contact-title">
          <div className="contact-lockup"><h2 id="contact-title" className="whitespace-pre-line">{editorial.contactHeadline}</h2><span aria-hidden="true">✦</span></div>
          <div className="contact-details">
            <p className="whitespace-pre-line">{editorial.contactAvailability}</p>
            <a href={contactHref} target={contactExternal ? "_blank" : undefined} rel={contactExternal ? "noreferrer" : undefined}><Mail size={17} aria-hidden="true" />{settings.contactEmail || editorial.contactFallbackLabel}</a>
            <a href={settings.linkedinUrl} target="_blank" rel="noreferrer"><Linkedin size={17} aria-hidden="true" />{editorial.linkedinDisplayLabel}</a>
            <a href={settings.githubUrl} target="_blank" rel="noreferrer"><Code2 size={17} aria-hidden="true" />{editorial.githubDisplayLabel}</a>
            <span><Globe2 size={17} aria-hidden="true" />{editorial.contactLocationLabel}</span>
            <div className="contact-actions">
              <a className="contact-action resume-download" href={portfolioResume.url} download={portfolioResume.filename}><FileDown size={16} aria-hidden="true" />{editorial.resumeLabel}</a>
              <button className={`contact-action copy-email${emailCopied ? " is-copied" : ""}`} type="button" onClick={copyEmail} disabled={!emailAddress} aria-label={emailAddress ? "Copy email address" : "Email address is not configured"}>
                {emailCopied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}{emailCopied ? editorial.emailCopiedLabel : emailAddress ? editorial.copyEmailLabel : editorial.emailUnavailableLabel}
              </button>
            </div>
            <span className="copy-status" aria-live="polite">{emailCopied ? editorial.emailCopiedMessage : ""}</span>
          </div>
          <div className="contact-portrait"><img src={editorial.portraitUrl} alt="" /><a href={contactHref} aria-label="Start a project conversation"><ArrowUpRight size={24} /></a><span className="thank-you">{editorial.thanksLabel}</span></div>
        </section>
      </main>

      <footer className="footer page-width">
        <span>© {new Date().getFullYear()} {content.name}</span>
        <span>{editorial.footerTagline}</span>
        <a href="/admin">{editorial.studioLabel} <ArrowUpRight size={13} aria-hidden="true" /></a>
      </footer>
    </div>
  );
}
