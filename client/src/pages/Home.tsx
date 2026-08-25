import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronRight,
  Code2,
  Menu,
  MousePointer2,
  Target,
  X,
} from "lucide-react";
import { portfolioContent } from "@/content/portfolio";

const navItems = [
  ["Expertise", "#expertise"],
  ["Selected work", "#work"],
  ["Approach", "#approach"],
];

const funnelSteps = ["Traffic", "Landing page", "Product", "Cart", "Purchase"];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeWork, setActiveWork] = useState("All work");
  const [headerElevated, setHeaderElevated] = useState(false);

  useEffect(() => {
    const onScroll = () => setHeaderElevated(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const visibleWork =
    activeWork === "All work"
      ? portfolioContent.work
      : portfolioContent.work.filter((item) => item.scope.includes(activeWork));

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className={`site-header ${headerElevated ? "site-header--elevated" : ""}`}>
        <div className="site-header__inner">
          <a className="brand" href="#top" aria-label="Sani Virani home">
            <span className="brand__mark">SV</span>
            <span className="brand__name">Sani Virani</span>
          </a>

          <nav className="desktop-nav" aria-label="Main navigation">
            {navItems.map(([label, href]) => (
              <a href={href} key={label}>
                {label}
              </a>
            ))}
          </nav>

          <a className="header-contact" href="#contact">
            Start a project <ArrowUpRight size={15} aria-hidden="true" />
          </a>

          <button
            className="menu-trigger"
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>

        {menuOpen && (
          <nav className="mobile-nav" aria-label="Mobile navigation">
            {navItems.map(([label, href]) => (
              <a href={href} key={label} onClick={() => setMenuOpen(false)}>
                {label}
                <ChevronRight size={16} aria-hidden="true" />
              </a>
            ))}
            <a href="#contact" onClick={() => setMenuOpen(false)}>
              Start a project <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </nav>
        )}
      </header>

      <main id="main-content">
        <section className="hero" id="top">
          <div className="hero__grain" aria-hidden="true" />
          <div className="layout-container hero__layout">
            <div className="hero__copy">
              <p className="eyebrow eyebrow--light">
                <span /> Digital growth, connected
              </p>
              <p className="hero__name">Hi, I’m Sani Virani.</p>
              <h1>{portfolioContent.hero}</h1>
              <p className="hero__description">{portfolioContent.supportingLine}</p>
              <div className="hero__actions">
                <a className="button button--lime" href="#work">
                  Explore selected work <ArrowDownRight size={18} aria-hidden="true" />
                </a>
                <a className="text-link text-link--light" href="#approach">
                  My approach <span aria-hidden="true">↘</span>
                </a>
              </div>
              <div className="hero__footnote">
                <span className="status-dot" aria-hidden="true" />
                <span>Developer thinking <b>×</b> marketer thinking <b>×</b> analyst thinking</span>
              </div>
            </div>

            <div className="signal-board" aria-label="Digital growth loop visualization">
              <div className="signal-board__topline">
                <span>Growth system</span>
                <span className="signal-board__live"><i /> Active view</span>
              </div>
              <div className="signal-board__summary">
                <div>
                  <span>Built to connect</span>
                  <strong>store + traffic + insight</strong>
                </div>
                <div className="signal-board__pulse" aria-hidden="true">
                  <svg viewBox="0 0 112 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 42C13 42 14 28 25 28C37 28 37 35 50 35C63 35 63 12 78 12C91 12 91 22 111 4" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              <div className="funnel-map">
                <div className="funnel-map__label">Customer journey</div>
                <div className="funnel-map__steps">
                  {funnelSteps.map((step, index) => (
                    <div className="funnel-step" key={step}>
                      <span className="funnel-step__node">0{index + 1}</span>
                      <span>{step}</span>
                      {index < funnelSteps.length - 1 && <i className="funnel-step__line" aria-hidden="true" />}
                    </div>
                  ))}
                </div>
              </div>
              <div className="signal-board__bottom">
                <div className="mini-chart" aria-hidden="true">
                  <i style={{ height: "30%" }} />
                  <i style={{ height: "55%" }} />
                  <i style={{ height: "42%" }} />
                  <i style={{ height: "72%" }} />
                  <i style={{ height: "60%" }} />
                  <i style={{ height: "90%" }} />
                  <i style={{ height: "76%" }} />
                </div>
                <div>
                  <span>Decision framework</span>
                  <strong>Build → Measure → Optimize → Grow</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="marquee-section" aria-label="Areas of expertise">
          <div className="marquee-track">
            <span>Shopify development</span><b>✦</b><span>Performance marketing</span><b>✦</b><span>Analytics</span><b>✦</b><span>Ecommerce growth</span><b>✦</b>
            <span aria-hidden="true">Shopify development</span><b aria-hidden="true">✦</b><span aria-hidden="true">Performance marketing</span><b aria-hidden="true">✦</b>
          </div>
        </section>

        <section className="expertise section-space" id="expertise">
          <div className="layout-container">
            <div className="section-heading">
              <div>
                <p className="eyebrow"><span /> The growth loop</p>
                <h2>One partner across the work that moves ecommerce forward.</h2>
              </div>
              <p>
                The strongest digital experiences are not isolated pages or campaigns. They are systems where each decision informs the next.
              </p>
            </div>

            <div className="pillar-grid">
              {portfolioContent.pillars.map((pillar, index) => (
                <article className="pillar-card" key={pillar.title}>
                  <div className="pillar-card__top">
                    <span>0{index + 1}</span>
                    {index === 0 && <Code2 size={19} aria-hidden="true" />}
                    {index === 1 && <Target size={19} aria-hidden="true" />}
                    {index === 2 && <BarChart3 size={19} aria-hidden="true" />}
                    {index === 3 && <MousePointer2 size={19} aria-hidden="true" />}
                  </div>
                  <p className="pillar-card__eyebrow">{pillar.eyebrow}</p>
                  <h3>{pillar.title}</h3>
                  <p className="pillar-card__description">{pillar.description}</p>
                  <div className="tag-list">
                    {pillar.tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="statement-section">
          <div className="layout-container statement-section__inner">
            <div className="statement-mark" aria-hidden="true">↗</div>
            <p>
              “The goal isn’t simply to make a store look good. It’s to make every point in the customer journey work together.”
            </p>
          </div>
        </section>

        <section className="selected-work section-space" id="work">
          <div className="layout-container">
            <div className="section-heading section-heading--work">
              <div>
                <p className="eyebrow"><span /> Selected work</p>
                <h2>Projects built with the entire customer journey in view.</h2>
              </div>
              <p>
                A selection of engagements across jewelry, ecommerce, development, and growth execution. Every detail shown is grounded in the supplied portfolio record.
              </p>
            </div>
            <div className="work-filters" aria-label="Filter selected work">
              {["All work", "Shopify", "Development", "Performance Marketing", "Analytics", "Ecommerce"].map((filter) => (
                <button
                  type="button"
                  key={filter}
                  className={activeWork === filter ? "is-active" : ""}
                  onClick={() => setActiveWork(filter)}
                  aria-pressed={activeWork === filter}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="work-grid">
              {visibleWork.map((item, index) => (
                <article className={`work-card work-card--${item.tone}`} key={item.title}>
                  <div className="work-card__visual" aria-hidden="true">
                    <span className="work-card__index">0{index + 1}</span>
                    {item.tone === "violet" && <div className="jewel-orbit"><i /><b /></div>}
                    {item.tone === "lime" && <div className="browser-slice"><span /><span /><span /></div>}
                    {item.tone === "sand" && <div className="campaign-pieces"><i /><i /><i /><i /></div>}
                  </div>
                  <div className="work-card__content">
                    <div className="work-card__meta"><span>{item.label}</span><ArrowUpRight size={18} aria-hidden="true" /></div>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                    <div className="work-card__detail"><span>Focus</span><strong>{item.focus}</strong></div>
                    <div className="tag-list tag-list--dark">
                      {item.scope.map((tag) => <span key={tag}>{tag}</span>)}
                    </div>
                  </div>
                </article>
              ))}
              {visibleWork.length === 0 && (
                <div className="empty-work"><p>Additional project details are being prepared for this category.</p></div>
              )}
            </div>
            <p className="results-note"><Check size={16} aria-hidden="true" /> Results are discussed using verified, project-specific data—never invented numbers.</p>
          </div>
        </section>

        <section className="journey section-space">
          <div className="layout-container journey__layout">
            <div className="journey__sticky">
              <p className="eyebrow"><span /> Professional journey</p>
              <h2>Experience built across the full ecommerce ecosystem.</h2>
              <p>
                From Shopify foundations to cross-functional campaign and analytics work, Sani’s path has been shaped by understanding how the parts relate.
              </p>
              <div className="stack-cloud" aria-label="Technology stack">
                {portfolioContent.stack.map((item) => <span key={item}>{item}</span>)}
              </div>
            </div>
            <ol className="journey-list">
              {portfolioContent.journey.map((item) => (
                <li key={item.company}>
                  <span className="journey-list__dot" aria-hidden="true" />
                  <div className="journey-list__period">{item.period}</div>
                  <div><h3>{item.company}</h3><p>{item.role}</p></div>
                  <span className="journey-list__track">{item.track}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="approach section-space" id="approach">
          <div className="layout-container">
            <div className="approach__top">
              <p className="eyebrow eyebrow--light"><span /> Working approach</p>
              <h2>Clear priorities, well-made execution, and a feedback loop that keeps learning.</h2>
            </div>
            <div className="process-grid">
              {portfolioContent.process.map(([number, title, description]) => (
                <article key={number}>
                  <span>{number}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="contact" id="contact">
          <div className="layout-container contact__layout">
            <div>
              <p className="eyebrow"><span /> Start a conversation</p>
              <h2>Have a store, campaign, or growth question worth exploring?</h2>
            </div>
            <div className="contact__details">
              <p>
                Share a concise brief, the business context, and what you want to improve. Direct contact details and social profiles can be connected here before launch.
              </p>
              <a className="button button--dark" href="mailto:?subject=Project%20enquiry%20for%20Sani%20Virani">
                Prepare a project enquiry <ArrowUpRight size={18} aria-hidden="true" />
              </a>
              <div className="social-placeholder" aria-label="Social profile links to connect before launch">
                <span>Social profiles</span>
                <span className="social-placeholder__items">LinkedIn <i /> Instagram <i /> X</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="layout-container site-footer__inner">
          <span>© {new Date().getFullYear()} Sani Virani</span>
          <span>Shopify · Performance · Growth</span>
          <a href="#top">Back to top <ArrowUpRight size={14} aria-hidden="true" /></a>
        </div>
      </footer>
    </div>
  );
}
