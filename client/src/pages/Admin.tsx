import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { portfolioContent } from "@/content/portfolio";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, Eye, FilePlus2, ImagePlus, Loader2, LockKeyhole, Plus, Save, ShieldCheck, Trash2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type Metric = { label: string; value: string; description: string };
type CaseDraft = {
  id?: number;
  slug: string;
  title: string;
  label: string;
  industry: string;
  role: string;
  description: string;
  focus: string;
  tone: "violet" | "lime" | "sand";
  services: string[];
  technologies: string[];
  metrics: Metric[];
  mediaId: number | null;
  sortOrder: number;
  status: "draft" | "published";
};

const emptyCaseStudy: CaseDraft = {
  slug: "new-case-study",
  title: "New case study",
  label: "Industry · Service",
  industry: "Ecommerce",
  role: "",
  description: "Describe the business context, your role, and the work completed.",
  focus: "Primary project focus",
  tone: "violet",
  services: [],
  technologies: [],
  metrics: [],
  mediaId: null,
  sortOrder: 0,
  status: "draft",
};

const sectionTitles: Record<string, { eyebrow: string; title: string; description: string }> = {
  overview: { eyebrow: "Content operations", title: "Portfolio control center", description: "Manage the public site, your portfolio record, and the media that supports it." },
  content: { eyebrow: "Homepage", title: "Site content", description: "Edit the messaging and expertise system shown on the public portfolio." },
  "case-studies": { eyebrow: "Work library", title: "Case studies", description: "Document your role, verified outcomes, services, and project assets." },
  media: { eyebrow: "Asset manager", title: "Media library", description: "Upload images once, then attach them to case studies as the portfolio grows." },
  settings: { eyebrow: "Public contact", title: "Contact & social links", description: "Set the contact channels prospective clients see on the portfolio." },
};

function splitItems(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function toSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "case-study";
}

function fieldClassName() {
  return "w-full border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-lime-300 focus:ring-1 focus:ring-lime-300";
}

export default function Admin() {
  const [location, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const currentSection = location.replace(/^\/admin\/?/, "") || "overview";
  const activeSection = sectionTitles[currentSection] ? currentSection : "overview";
  const utils = trpc.useUtils();
  const initialize = trpc.portfolio.admin.initialize.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.portfolio.admin.overview.invalidate(),
        utils.portfolio.admin.content.get.invalidate(),
        utils.portfolio.admin.settings.get.invalidate(),
        utils.portfolio.admin.caseStudies.list.invalidate(),
      ]);
    },
  });
  const verificationStatus = trpc.ownerVerification.status.useQuery(undefined, { retry: false, enabled: user?.role === "admin" });
  const revokeVerification = trpc.ownerVerification.revoke.useMutation({ onSuccess: () => verificationStatus.refetch() });

  useEffect(() => {
    if (user?.role === "admin" && verificationStatus.data?.verified) initialize.mutate();
  }, [user?.role, verificationStatus.data?.verified]);

  if (authLoading) return <DashboardLayout><LoadingPanel label="Checking admin access" /></DashboardLayout>;
  if (user && user.role !== "admin") return <DashboardLayout><div className="flex min-h-80 max-w-xl items-center border border-red-400/25 bg-red-500/10 p-7 text-red-100"><div><p className="font-mono text-[10px] uppercase tracking-[.12em] text-red-300">Restricted area</p><h1 className="mt-3 font-[Syne] text-3xl font-bold tracking-[-.05em]">Admin access required</h1><p className="mt-3 text-sm leading-6 text-red-100/75">This workspace is reserved for the portfolio owner. Sign in using the owner account to manage public content.</p></div></div></DashboardLayout>;
  if (user?.role === "admin" && verificationStatus.isLoading) return <DashboardLayout><LoadingPanel label="Checking local owner verification" /></DashboardLayout>;
  if (user?.role === "admin" && !verificationStatus.data?.verified) return <DashboardLayout><OwnerVerificationGate onVerified={() => verificationStatus.refetch()} /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-2rem)] bg-[#111510] text-zinc-100">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-7 sm:py-10">
          <div className="mb-9 flex flex-col justify-between gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-lime-300">{sectionTitles[activeSection].eyebrow}</p>
              <h1 className="font-[Syne] text-4xl font-bold tracking-[-0.06em] text-white sm:text-5xl">{sectionTitles[activeSection].title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">{sectionTitles[activeSection].description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2"><a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 self-start border border-white/15 px-3 py-2 text-xs font-bold text-zinc-200 transition hover:border-lime-300 hover:text-lime-300 sm:self-auto">View public site <Eye size={14} /></a><Button variant="outline" onClick={() => revokeVerification.mutate()} className="h-9 rounded-none border-white/15 bg-transparent px-3 text-xs text-zinc-300 hover:bg-white/10 hover:text-white"><LockKeyhole size={14} /> Lock edits</Button></div>
          </div>

          {initialize.isPending && <div className="mb-5 flex items-center gap-2 border border-lime-300/20 bg-lime-300/10 px-3 py-2 text-xs text-lime-200"><Loader2 className="animate-spin" size={14} /> Preparing editable portfolio content…</div>}
          {activeSection === "overview" && <Overview onNavigate={setLocation} />}
          {activeSection === "content" && <ContentEditor />}
          {activeSection === "case-studies" && <CaseStudyManager />}
          {activeSection === "media" && <MediaManager />}
          {activeSection === "settings" && <SettingsEditor />}
        </div>
      </div>
    </DashboardLayout>
  );
}

function OwnerVerificationGate({ onVerified }: { onVerified: () => void }) {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const verify = trpc.ownerVerification.verifyPin.useMutation({ onSuccess: onVerified });
  return <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-xl items-center py-10"><div className="w-full border border-lime-300/25 bg-[#171d16] p-6 shadow-2xl shadow-black/25 sm:p-8"><div className="flex size-12 items-center justify-center bg-lime-300 text-black"><ShieldCheck size={23} /></div><p className="mt-6 font-mono text-[10px] uppercase tracking-[.14em] text-lime-300">Owner confirmation</p><h1 className="mt-3 font-[Syne] text-4xl font-bold tracking-[-.06em] text-white">Confirm before editing.</h1><p className="mt-4 text-sm leading-6 text-zinc-400">This content studio is protected by the signed-in owner account plus a local confirmation of the registered phone number and private owner PIN. No SMS or third-party verification API is used.</p><div className="mt-7 grid gap-4"><Field label="Registered owner phone"><input inputMode="tel" autoComplete="tel" className={fieldClassName()} placeholder="Enter the authorized number" value={phone} onChange={(event) => setPhone(event.target.value)} /></Field><Field label="Private owner PIN"><input type="password" autoComplete="one-time-code" className={fieldClassName()} placeholder="Enter your private PIN" value={pin} onChange={(event) => setPin(event.target.value)} /></Field><Button disabled={!phone || !pin || verify.isPending} onClick={() => verify.mutate({ phone, pin })} className="mt-2 rounded-none bg-lime-300 text-black hover:bg-lime-200 disabled:opacity-50">{verify.isPending ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />} Confirm editing access</Button>{verify.error && <p className="text-xs leading-5 text-red-300">{verify.error.message}</p>}</div><p className="mt-6 border-t border-white/10 pt-4 text-xs leading-5 text-zinc-500">Editing access is active for 30 minutes and can be locked at any time from the content studio header.</p></div></div>;
}

function Overview({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { data, isLoading } = trpc.portfolio.admin.overview.useQuery();
  const cards = [
    ["Case studies", data?.caseStudies ?? 0, "/admin/case-studies", "Create, update, publish"],
    ["Published", data?.published ?? 0, "/admin/case-studies", "Visible on the public site"],
    ["Media assets", data?.media ?? 0, "/admin/media", "Images in your library"],
    ["Settings", data?.settings ?? 0, "/admin/settings", "Contact and profile values"],
  ];
  return (
    <div className="space-y-8">
      <div className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value, path, detail]) => (
          <button key={label as string} type="button" onClick={() => onNavigate(path as string)} className="group bg-[#111510] p-5 text-left transition hover:bg-[#1b221a]">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">{label}</p>
            <p className="mt-5 font-[Syne] text-4xl font-bold tracking-[-0.07em] text-white">{isLoading ? "—" : value}</p>
            <p className="mt-2 text-xs text-zinc-500 group-hover:text-lime-200">{detail}</p>
          </button>
        ))}
      </div>
      <div className="grid gap-5 border border-white/10 bg-[#171d16] p-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-lime-300">Recommended next step</p><h2 className="mt-3 font-[Syne] text-2xl font-bold tracking-[-0.05em] text-white">Turn each project into a proof-backed case study.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Use the case-study editor to add your role, verified metrics, project context, services, and a visual. Drafts stay private until you publish them.</p></div>
        <Button onClick={() => onNavigate("/admin/case-studies")} className="rounded-none bg-lime-300 text-black hover:bg-lime-200"><FilePlus2 size={16} /> Manage case studies</Button>
      </div>
    </div>
  );
}

function ContentEditor() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.portfolio.admin.content.get.useQuery();
  const [draft, setDraft] = useState<typeof data>();
  useEffect(() => { if (data) setDraft(data); }, [data]);
  const update = trpc.portfolio.admin.content.update.useMutation({ onSuccess: () => utils.portfolio.admin.content.get.invalidate() });
  if (isLoading || !draft) return <LoadingPanel label="Loading editable homepage content" />;
  const updatePillar = (index: number, key: "title" | "eyebrow" | "description" | "tags", value: string) => {
    setDraft({ ...draft, pillars: draft.pillars.map((pillar, itemIndex) => itemIndex === index ? { ...pillar, [key]: key === "tags" ? value.split(",").map((tag) => tag.trim()).filter(Boolean) : value } : pillar) });
  };
  return <div className="min-w-0 space-y-7">
    <div className="grid gap-5 border border-white/10 bg-[#171d16] p-5 md:grid-cols-2">
      <Field label="Name"><input className={fieldClassName()} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></Field>
      <Field label="Positioning"><input className={fieldClassName()} value={draft.positioning} onChange={(event) => setDraft({ ...draft, positioning: event.target.value })} /></Field>
      <Field label="Hero statement" className="md:col-span-2"><textarea className={fieldClassName()} rows={3} value={draft.hero} onChange={(event) => setDraft({ ...draft, hero: event.target.value })} /></Field>
      <Field label="Supporting line" className="md:col-span-2"><textarea className={fieldClassName()} rows={3} value={draft.supportingLine} onChange={(event) => setDraft({ ...draft, supportingLine: event.target.value })} /></Field>
    </div>
    <div className="grid gap-5 border border-white/10 bg-[#171d16] p-5 md:grid-cols-2">
      <div className="md:col-span-2"><p className="font-mono text-[10px] uppercase tracking-[.12em] text-lime-300">Section copy</p><h2 className="mt-2 font-[Syne] text-2xl font-bold tracking-[-.05em] text-white">Narrative and call-to-action text</h2></div>
      <Field label="Expertise heading"><textarea className={fieldClassName()} rows={2} value={draft.sections.expertiseHeading} onChange={(event) => setDraft({ ...draft, sections: { ...draft.sections, expertiseHeading: event.target.value } })} /></Field>
      <Field label="Expertise introduction"><textarea className={fieldClassName()} rows={2} value={draft.sections.expertiseIntro} onChange={(event) => setDraft({ ...draft, sections: { ...draft.sections, expertiseIntro: event.target.value } })} /></Field>
      <Field label="Statement" className="md:col-span-2"><textarea className={fieldClassName()} rows={3} value={draft.sections.statement} onChange={(event) => setDraft({ ...draft, sections: { ...draft.sections, statement: event.target.value } })} /></Field>
      <Field label="Selected-work heading"><textarea className={fieldClassName()} rows={2} value={draft.sections.workHeading} onChange={(event) => setDraft({ ...draft, sections: { ...draft.sections, workHeading: event.target.value } })} /></Field>
      <Field label="Selected-work introduction"><textarea className={fieldClassName()} rows={2} value={draft.sections.workIntro} onChange={(event) => setDraft({ ...draft, sections: { ...draft.sections, workIntro: event.target.value } })} /></Field>
      <Field label="Journey heading"><textarea className={fieldClassName()} rows={2} value={draft.sections.journeyHeading} onChange={(event) => setDraft({ ...draft, sections: { ...draft.sections, journeyHeading: event.target.value } })} /></Field>
      <Field label="Journey introduction"><textarea className={fieldClassName()} rows={2} value={draft.sections.journeyIntro} onChange={(event) => setDraft({ ...draft, sections: { ...draft.sections, journeyIntro: event.target.value } })} /></Field>
      <Field label="Approach heading"><textarea className={fieldClassName()} rows={2} value={draft.sections.approachHeading} onChange={(event) => setDraft({ ...draft, sections: { ...draft.sections, approachHeading: event.target.value } })} /></Field>
      <Field label="Contact heading"><textarea className={fieldClassName()} rows={2} value={draft.sections.contactHeading} onChange={(event) => setDraft({ ...draft, sections: { ...draft.sections, contactHeading: event.target.value } })} /></Field>
    </div>
    <div><div className="mb-4 flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.12em] text-lime-300">Expertise system</p><h2 className="mt-2 font-[Syne] text-2xl font-bold tracking-[-.05em] text-white">Service pillars</h2></div><span className="text-xs text-zinc-500">Comma-separate skills</span></div><div className="grid gap-4 md:grid-cols-2">{draft.pillars.map((pillar, index) => <div key={pillar.number} className="border border-white/10 bg-[#171d16] p-5"><p className="font-mono text-[10px] text-lime-300">{pillar.number}</p><div className="mt-4 grid gap-3"><Field label="Title"><input className={fieldClassName()} value={pillar.title} onChange={(event) => updatePillar(index, "title", event.target.value)} /></Field><Field label="Eyebrow"><input className={fieldClassName()} value={pillar.eyebrow} onChange={(event) => updatePillar(index, "eyebrow", event.target.value)} /></Field><Field label="Description"><textarea className={fieldClassName()} rows={3} value={pillar.description} onChange={(event) => updatePillar(index, "description", event.target.value)} /></Field><Field label="Tags"><input className={fieldClassName()} value={pillar.tags.join(", ")} onChange={(event) => updatePillar(index, "tags", event.target.value)} /></Field></div></div>)}</div></div>
    <EditorialFields value={{ ...portfolioContent.editorial, ...draft.editorial }} onChange={(editorial) => setDraft({ ...draft, editorial })} />
    <PortfolioStructureEditor journey={draft.journey} process={draft.process} stack={draft.stack} onJourneyChange={(journey) => setDraft({ ...draft, journey })} onProcessChange={(process) => setDraft({ ...draft, process })} onStackChange={(stack) => setDraft({ ...draft, stack })} />
    <SaveBar label="Save homepage content" saving={update.isPending} onSave={() => update.mutate(draft)} success={update.isSuccess} />
  </div>;
}

type EditorialContent = typeof portfolioContent.editorial;
type JourneyItem = { period: string; company: string; role: string; track: string };
type ProcessItem = { number: string; title: string; description: string };

function EditorialFields({ value, onChange }: { value: EditorialContent; onChange: (value: EditorialContent) => void }) {
  const update = <K extends keyof EditorialContent>(key: K, next: EditorialContent[K]) => onChange({ ...value, [key]: next });
  const updateStat = (index: number, key: "value" | "labelLineOne" | "labelLineTwo", next: string) => update("stats", value.stats.map((stat, statIndex) => statIndex === index ? { ...stat, [key]: next } : stat));
  return <div className="space-y-5">
    <div className="border border-white/10 bg-[#171d16] p-5"><p className="font-mono text-[10px] uppercase tracking-[.12em] text-lime-300">Editorial interface</p><h2 className="mt-2 font-[Syne] text-2xl font-bold tracking-[-.05em] text-white">Portfolio labels and calls to action</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">Every visible navigation label, hero line, stat, section label, and contact call-to-action is controlled here. Use a line break to preserve the intentional stacked editorial treatment.</p></div>
    <div className="grid min-w-0 gap-5 border border-white/10 bg-[#171d16] p-5 md:grid-cols-2">
      <Field label="Portfolio label"><input className={fieldClassName()} value={value.siteLabel} onChange={(event) => update("siteLabel", event.target.value)} /></Field>
      <Field label="Hero kicker"><input className={fieldClassName()} value={value.heroKicker} onChange={(event) => update("heroKicker", event.target.value)} /></Field>
      <Field label="Navigation: home"><input className={fieldClassName()} value={value.navHome} onChange={(event) => update("navHome", event.target.value)} /></Field>
      <Field label="Navigation: work"><input className={fieldClassName()} value={value.navWork} onChange={(event) => update("navWork", event.target.value)} /></Field>
      <Field label="Navigation: about"><input className={fieldClassName()} value={value.navAbout} onChange={(event) => update("navAbout", event.target.value)} /></Field>
      <Field label="Navigation: services"><input className={fieldClassName()} value={value.navServices} onChange={(event) => update("navServices", event.target.value)} /></Field>
      <Field label="Navigation: experience"><input className={fieldClassName()} value={value.navExperience} onChange={(event) => update("navExperience", event.target.value)} /></Field>
      <Field label="Navigation: contact"><input className={fieldClassName()} value={value.navContact} onChange={(event) => update("navContact", event.target.value)} /></Field>
      <Field label="Mobile menu label"><input className={fieldClassName()} value={value.menuLabel} onChange={(event) => update("menuLabel", event.target.value)} /></Field>
      <Field label="Availability line one"><input className={fieldClassName()} value={value.availabilityLineOne} onChange={(event) => update("availabilityLineOne", event.target.value)} /></Field>
      <Field label="Availability line two"><input className={fieldClassName()} value={value.availabilityLineTwo} onChange={(event) => update("availabilityLineTwo", event.target.value)} /></Field>
      <Field label="Hero display line one"><input className={fieldClassName()} value={value.heroTitleLineOne} onChange={(event) => update("heroTitleLineOne", event.target.value)} /></Field>
      <Field label="Hero display line two"><input className={fieldClassName()} value={value.heroTitleLineTwo} onChange={(event) => update("heroTitleLineTwo", event.target.value)} /></Field>
      <Field label="Hero script"><input className={fieldClassName()} value={value.heroScript} onChange={(event) => update("heroScript", event.target.value)} /></Field>
      <Field label="Hero call-to-action"><input className={fieldClassName()} value={value.heroCta} onChange={(event) => update("heroCta", event.target.value)} /></Field>
      <Field label="Portrait image URL" className="md:col-span-2"><input type="url" className={fieldClassName()} value={value.portraitUrl} onChange={(event) => update("portraitUrl", event.target.value)} /></Field>
      <Field label="Portrait image alt text" className="md:col-span-2"><input className={fieldClassName()} value={value.portraitAlt} onChange={(event) => update("portraitAlt", event.target.value)} /></Field>
      <Field label="Credibility headline (line breaks supported)" className="md:col-span-2"><textarea className={fieldClassName()} rows={3} value={value.credibilityHeadline} onChange={(event) => update("credibilityHeadline", event.target.value)} /></Field>
    </div>
    <div className="border border-white/10 bg-[#171d16] p-5"><div><p className="font-mono text-[10px] uppercase tracking-[.12em] text-lime-300">Credibility panel</p><h2 className="mt-2 font-[Syne] text-2xl font-bold tracking-[-.05em] text-white">Statistics</h2></div><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{value.stats.map((stat, index) => <div key={`${stat.value}-${index}`} className="grid min-w-0 gap-3 border border-white/10 p-4"><Field label="Value"><input className={fieldClassName()} value={stat.value} onChange={(event) => updateStat(index, "value", event.target.value)} /></Field><Field label="Label line one"><input className={fieldClassName()} value={stat.labelLineOne} onChange={(event) => updateStat(index, "labelLineOne", event.target.value)} /></Field><Field label="Label line two"><input className={fieldClassName()} value={stat.labelLineTwo} onChange={(event) => updateStat(index, "labelLineTwo", event.target.value)} /></Field></div>)}</div></div>
    <div className="grid min-w-0 gap-5 border border-white/10 bg-[#171d16] p-5 md:grid-cols-2">
      <Field label="Work section label (line breaks supported)"><textarea className={fieldClassName()} rows={2} value={value.workLabel} onChange={(event) => update("workLabel", event.target.value)} /></Field>
      <Field label="Work section CTA"><input className={fieldClassName()} value={value.workCta} onChange={(event) => update("workCta", event.target.value)} /></Field>
      <Field label="Work note" className="md:col-span-2"><textarea className={fieldClassName()} rows={2} value={value.workNote} onChange={(event) => update("workNote", event.target.value)} /></Field>
      <Field label="Project filter label"><input className={fieldClassName()} value={value.filterLabel} onChange={(event) => update("filterLabel", event.target.value)} /></Field>
      <Field label="All-work filter label"><input className={fieldClassName()} value={value.filterAllLabel} onChange={(event) => update("filterAllLabel", event.target.value)} /></Field>
      <Field label="Role filter prefix"><input className={fieldClassName()} value={value.filterRolePrefix} onChange={(event) => update("filterRolePrefix", event.target.value)} /></Field>
      <Field label="Project filter empty-state message" className="md:col-span-2"><textarea className={fieldClassName()} rows={2} value={value.filterEmptyMessage} onChange={(event) => update("filterEmptyMessage", event.target.value)} /></Field>
      <Field label="Services label (line breaks supported)"><textarea className={fieldClassName()} rows={2} value={value.servicesLabel} onChange={(event) => update("servicesLabel", event.target.value)} /></Field>
      <Field label="Experience title (line breaks supported)"><textarea className={fieldClassName()} rows={2} value={value.experienceTitle} onChange={(event) => update("experienceTitle", event.target.value)} /></Field>
      <Field label="Collaborations label"><input className={fieldClassName()} value={value.collaborationsLabel} onChange={(event) => update("collaborationsLabel", event.target.value)} /></Field>
      <Field label="Contact heading (line breaks supported)"><textarea className={fieldClassName()} rows={2} value={value.contactHeadline} onChange={(event) => update("contactHeadline", event.target.value)} /></Field>
      <Field label="Contact availability (line breaks supported)"><textarea className={fieldClassName()} rows={2} value={value.contactAvailability} onChange={(event) => update("contactAvailability", event.target.value)} /></Field>
      <Field label="Contact fallback label"><input className={fieldClassName()} value={value.contactFallbackLabel} onChange={(event) => update("contactFallbackLabel", event.target.value)} /></Field>
      <Field label="Location label"><input className={fieldClassName()} value={value.contactLocationLabel} onChange={(event) => update("contactLocationLabel", event.target.value)} /></Field>
      <Field label="LinkedIn display label"><input className={fieldClassName()} value={value.linkedinDisplayLabel} onChange={(event) => update("linkedinDisplayLabel", event.target.value)} /></Field>
      <Field label="GitHub display label"><input className={fieldClassName()} value={value.githubDisplayLabel} onChange={(event) => update("githubDisplayLabel", event.target.value)} /></Field>
      <Field label="Resume button label"><input className={fieldClassName()} value={value.resumeLabel} onChange={(event) => update("resumeLabel", event.target.value)} /></Field>
      <Field label="Copy email button label"><input className={fieldClassName()} value={value.copyEmailLabel} onChange={(event) => update("copyEmailLabel", event.target.value)} /></Field>
      <Field label="Unavailable-email label"><input className={fieldClassName()} value={value.emailUnavailableLabel} onChange={(event) => update("emailUnavailableLabel", event.target.value)} /></Field>
      <Field label="Email copied label"><input className={fieldClassName()} value={value.emailCopiedLabel} onChange={(event) => update("emailCopiedLabel", event.target.value)} /></Field>
      <Field label="Email copied announcement"><input className={fieldClassName()} value={value.emailCopiedMessage} onChange={(event) => update("emailCopiedMessage", event.target.value)} /></Field>
      <Field label="Thank-you script"><input className={fieldClassName()} value={value.thanksLabel} onChange={(event) => update("thanksLabel", event.target.value)} /></Field>
      <Field label="Footer tagline"><input className={fieldClassName()} value={value.footerTagline} onChange={(event) => update("footerTagline", event.target.value)} /></Field>
      <Field label="Content Studio footer label"><input className={fieldClassName()} value={value.studioLabel} onChange={(event) => update("studioLabel", event.target.value)} /></Field>
    </div>
  </div>;
}

function PortfolioStructureEditor({ journey, process, stack, onJourneyChange, onProcessChange, onStackChange }: { journey: JourneyItem[]; process: ProcessItem[]; stack: string[]; onJourneyChange: (value: JourneyItem[]) => void; onProcessChange: (value: ProcessItem[]) => void; onStackChange: (value: string[]) => void }) {
  return <div className="space-y-5"><div className="border border-white/10 bg-[#171d16] p-5"><p className="font-mono text-[10px] uppercase tracking-[.12em] text-lime-300">Portfolio structure</p><h2 className="mt-2 font-[Syne] text-2xl font-bold tracking-[-.05em] text-white">Timeline, process, and working stack</h2></div><EditableCollection title="Experience timeline" description="These entries appear in the public Experience & Practice panel." items={journey} emptyItem={{ period: "New stage", company: "Company", role: "Role", track: "Track" }} fields={["period", "company", "role", "track"] as const} onChange={onJourneyChange} /><EditableCollection title="Working process" description="These steps are stored with your narrative content for future public process treatments." items={process} emptyItem={{ number: String(process.length + 1).padStart(2, "0"), title: "New process step", description: "Describe the purpose of this step." }} fields={["number", "title", "description"] as const} onChange={onProcessChange} /><div className="border border-white/10 bg-[#171d16] p-5"><Field label="Technology and growth stack (one item per line)"><textarea className={fieldClassName()} rows={5} value={stack.join("\n")} onChange={(event) => onStackChange(splitItems(event.target.value))} /></Field></div></div>;
}

function EditableCollection<T extends Record<string, string>, K extends keyof T>({ title, description, items, emptyItem, fields, onChange }: { title: string; description: string; items: T[]; emptyItem: T; fields: readonly K[]; onChange: (items: T[]) => void }) {
  const update = (index: number, key: K, value: string) => onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  return <div className="border border-white/10 bg-[#171d16] p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-[Syne] text-2xl font-bold tracking-[-.05em] text-white">{title}</h2><p className="mt-1 text-sm text-zinc-400">{description}</p></div><Button type="button" variant="outline" onClick={() => onChange([...items, emptyItem])} className="rounded-none border-white/20 bg-transparent text-white hover:bg-white/10"><Plus size={15} /> Add entry</Button></div><div className="mt-5 space-y-3">{items.map((item, index) => <div key={`${title}-${index}`} className="grid min-w-0 gap-3 border border-white/10 p-4 md:grid-cols-2">{fields.map((field) => <Field key={String(field)} label={String(field)} className={field === "description" ? "md:col-span-2" : undefined}>{field === "description" ? <textarea className={fieldClassName()} rows={3} value={item[field]} onChange={(event) => update(index, field, event.target.value)} /> : <input className={fieldClassName()} value={item[field]} onChange={(event) => update(index, field, event.target.value)} />}</Field>)}<button type="button" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} className="justify-self-start border border-red-400/30 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-500/10 md:col-span-2">Remove entry</button></div>)}</div></div>;
}

function SettingsEditor() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.portfolio.admin.settings.get.useQuery();
  const [draft, setDraft] = useState<typeof data>();
  useEffect(() => { if (data) setDraft(data); }, [data]);
  const update = trpc.portfolio.admin.settings.update.useMutation({ onSuccess: () => utils.portfolio.admin.settings.get.invalidate() });
  if (isLoading || !draft) return <LoadingPanel label="Loading public contact details" />;
  return <div className="space-y-7"><div className="border border-lime-300/20 bg-lime-300/10 p-4 text-sm leading-6 text-lime-100">Your LinkedIn and GitHub profiles are ready. Add your email here when you want the public “Start a project” button to open a direct email.</div><div className="grid gap-5 border border-white/10 bg-[#171d16] p-5"><Field label="Public email address"><input type="email" placeholder="name@example.com" className={fieldClassName()} value={draft.contactEmail} onChange={(event) => setDraft({ ...draft, contactEmail: event.target.value })} /></Field><Field label="LinkedIn profile URL"><input type="url" className={fieldClassName()} value={draft.linkedinUrl} onChange={(event) => setDraft({ ...draft, linkedinUrl: event.target.value })} /></Field><Field label="GitHub profile URL"><input type="url" className={fieldClassName()} value={draft.githubUrl} onChange={(event) => setDraft({ ...draft, githubUrl: event.target.value })} /></Field><Field label="Contact introduction"><textarea className={fieldClassName()} rows={4} value={draft.contactIntro} onChange={(event) => setDraft({ ...draft, contactIntro: event.target.value })} /></Field></div><SaveBar label="Save contact & links" saving={update.isPending} onSave={() => update.mutate(draft)} success={update.isSuccess} /></div>;
}

function CaseStudyManager() {
  const utils = trpc.useUtils();
  const { data: studies, isLoading } = trpc.portfolio.admin.caseStudies.list.useQuery();
  const { data: media } = trpc.portfolio.admin.media.list.useQuery();
  const [selectedId, setSelectedId] = useState<number | "new" | null>(null);
  const selected = useMemo(() => selectedId === "new" ? emptyCaseStudy : studies?.find((study) => study.id === selectedId), [selectedId, studies]);
  const create = trpc.portfolio.admin.caseStudies.create.useMutation({ onSuccess: () => { utils.portfolio.admin.caseStudies.list.invalidate(); setSelectedId(null); } });
  const update = trpc.portfolio.admin.caseStudies.update.useMutation({ onSuccess: () => { utils.portfolio.admin.caseStudies.list.invalidate(); setSelectedId(null); } });
  const remove = trpc.portfolio.admin.caseStudies.remove.useMutation({ onSuccess: () => { utils.portfolio.admin.caseStudies.list.invalidate(); setSelectedId(null); } });
  if (isLoading) return <LoadingPanel label="Loading your editable work library" />;
  if (selected) return <CaseStudyForm key={selectedId} initial={selected} media={media ?? []} busy={create.isPending || update.isPending} onCancel={() => setSelectedId(null)} onSave={(draft) => selectedId === "new" ? create.mutate(draft) : update.mutate({ id: selected.id!, values: draft })} onDelete={selectedId === "new" ? undefined : () => remove.mutate({ id: selected.id! })} />;
  return <div className="space-y-6"><div className="flex flex-col gap-4 border border-white/10 bg-[#171d16] p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-[Syne] text-2xl font-bold tracking-[-.05em] text-white">Your work library</h2><p className="mt-1 text-sm text-zinc-400">Use drafts while gathering proof. Only published items appear on the public portfolio.</p></div><Button onClick={() => setSelectedId("new")} className="rounded-none bg-lime-300 text-black hover:bg-lime-200"><Plus size={16} /> New case study</Button></div><div className="grid gap-3">{studies?.map((study) => <button type="button" key={study.id} onClick={() => setSelectedId(study.id)} className="grid gap-3 border border-white/10 bg-[#111510] p-4 text-left transition hover:border-lime-300/70 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><div className="flex items-center gap-2"><h3 className="font-[Syne] text-lg font-bold tracking-[-.04em] text-white">{study.title}</h3><Status status={study.status} /></div><p className="mt-1 text-xs text-zinc-500">{study.industry} · {study.focus}</p></div><span className="font-mono text-[10px] uppercase tracking-[.08em] text-zinc-500">{study.metrics.length} verified metrics</span><ChevronLeft className="justify-self-end rotate-180 text-zinc-500" size={18} /></button>)}{studies?.length === 0 && <Empty label="No case studies yet. Create your first proof-backed project." />}</div></div>;
}

function CaseStudyForm({ initial, media, busy, onCancel, onSave, onDelete }: { initial: CaseDraft; media: Array<{ id: number; name: string; url: string }>; busy: boolean; onCancel: () => void; onSave: (draft: CaseDraft) => void; onDelete?: () => void }) {
  const [draft, setDraft] = useState<CaseDraft>({ ...initial, mediaId: initial.mediaId ?? null, metrics: initial.metrics.map((metric) => ({ ...metric, description: metric.description ?? "" })) });
  return <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={onCancel} className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-lime-300"><ChevronLeft size={16} /> Back to all case studies</button>{onDelete && <Button variant="ghost" onClick={onDelete} className="rounded-none text-red-300 hover:bg-red-500/10 hover:text-red-200"><Trash2 size={15} /> Delete</Button>}</div><div className="grid gap-5 border border-white/10 bg-[#171d16] p-5 md:grid-cols-2"><Field label="Case study title"><input className={fieldClassName()} value={draft.title} onChange={(event) => { const title = event.target.value; setDraft({ ...draft, title, slug: toSlug(title) }); }} /></Field><Field label="URL slug"><input className={fieldClassName()} value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: toSlug(event.target.value) })} /></Field><Field label="Project label"><input className={fieldClassName()} value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} /></Field><Field label="Industry"><input className={fieldClassName()} value={draft.industry} onChange={(event) => setDraft({ ...draft, industry: event.target.value })} /></Field><Field label="Primary focus" className="md:col-span-2"><input className={fieldClassName()} value={draft.focus} onChange={(event) => setDraft({ ...draft, focus: event.target.value })} /></Field><Field label="Your role and responsibilities" className="md:col-span-2"><textarea className={fieldClassName()} rows={4} placeholder="Describe exactly what you owned and delivered." value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} /></Field><Field label="Project description" className="md:col-span-2"><textarea className={fieldClassName()} rows={5} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></Field><Field label="Services (one per line)"><textarea className={fieldClassName()} rows={4} value={draft.services.join("\n")} onChange={(event) => setDraft({ ...draft, services: splitItems(event.target.value) })} /></Field><Field label="Technologies / channels (one per line)"><textarea className={fieldClassName()} rows={4} value={draft.technologies.join("\n")} onChange={(event) => setDraft({ ...draft, technologies: splitItems(event.target.value) })} /></Field><Field label="Visual theme"><select className={fieldClassName()} value={draft.tone} onChange={(event) => setDraft({ ...draft, tone: event.target.value as CaseDraft["tone"] })}><option value="violet">Violet</option><option value="lime">Lime</option><option value="sand">Sand</option></select></Field><Field label="Linked media"><select className={fieldClassName()} value={draft.mediaId ?? ""} onChange={(event) => setDraft({ ...draft, mediaId: event.target.value ? Number(event.target.value) : null })}><option value="">Use the default project visual</option>{media.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Display order"><input type="number" min="0" className={fieldClassName()} value={draft.sortOrder} onChange={(event) => setDraft({ ...draft, sortOrder: Number(event.target.value) })} /></Field><Field label="Public status"><select className={fieldClassName()} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as CaseDraft["status"] })}><option value="draft">Draft — private</option><option value="published">Published — public</option></select></Field></div><MetricEditor metrics={draft.metrics} onChange={(metrics) => setDraft({ ...draft, metrics })} /><SaveBar label={initial.id ? "Save case study" : "Create case study"} saving={busy} onSave={() => onSave(draft)} /></div>;
}

function MetricEditor({ metrics, onChange }: { metrics: Metric[]; onChange: (metrics: Metric[]) => void }) {
  return <div className="border border-white/10 bg-[#171d16] p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[.12em] text-lime-300">Proof points</p><h2 className="mt-2 font-[Syne] text-2xl font-bold tracking-[-.05em] text-white">Verified metrics</h2><p className="mt-1 text-sm text-zinc-400">Only add figures you can substantiate. Metrics are never invented by the system.</p></div><Button type="button" variant="outline" onClick={() => onChange([...metrics, { label: "", value: "", description: "" }])} className="rounded-none border-white/20 bg-transparent text-white hover:bg-white/10"><Plus size={15} /> Add metric</Button></div><div className="mt-5 space-y-3">{metrics.map((metric, index) => <div className="grid gap-3 border border-white/10 p-3 md:grid-cols-[1fr_1fr_1.4fr_auto]"><input placeholder="Label e.g. ROAS" className={fieldClassName()} value={metric.label} onChange={(event) => onChange(metrics.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} /><input placeholder="Value e.g. 4.2×" className={fieldClassName()} value={metric.value} onChange={(event) => onChange(metrics.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item))} /><input placeholder="Context / reporting period" className={fieldClassName()} value={metric.description} onChange={(event) => onChange(metrics.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item))} /><button type="button" aria-label="Remove metric" onClick={() => onChange(metrics.filter((_, itemIndex) => itemIndex !== index))} className="border border-red-400/30 px-3 text-red-300 hover:bg-red-500/10"><X size={16} /></button></div>)}{metrics.length === 0 && <Empty label="No metrics added. Add a verified outcome when it is ready to be published." />}</div></div>;
}

function MediaManager() {
  const utils = trpc.useUtils();
  const { data: media, isLoading } = trpc.portfolio.admin.media.list.useQuery();
  const upload = trpc.portfolio.admin.media.upload.useMutation({ onSuccess: () => utils.portfolio.admin.media.list.invalidate() });
  const remove = trpc.portfolio.admin.media.remove.useMutation({ onSuccess: () => utils.portfolio.admin.media.list.invalidate() });
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const submit = () => { if (!file) return; const reader = new FileReader(); reader.onload = () => upload.mutate({ name: file.name, mimeType: file.type as "image/jpeg", dataUrl: String(reader.result), altText, caption }); reader.readAsDataURL(file); };
  if (isLoading) return <LoadingPanel label="Loading your media library" />;
  return <div className="space-y-7"><div className="grid gap-5 border border-white/10 bg-[#171d16] p-5 lg:grid-cols-[1fr_1.2fr]"><label className="group flex min-h-48 cursor-pointer flex-col items-center justify-center border border-dashed border-white/20 bg-[#111510] p-7 text-center transition hover:border-lime-300 hover:bg-lime-300/5"><input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><Upload className="text-lime-300" size={23} /><strong className="mt-3 text-sm text-white">{file ? file.name : "Choose an image to upload"}</strong><span className="mt-2 max-w-xs text-xs leading-5 text-zinc-500">PNG, JPG, WEBP, GIF, or SVG. Keep images below 12 MB.</span></label><div className="grid content-center gap-4"><Field label="Alt text"><input className={fieldClassName()} placeholder="Describe the image for accessibility" value={altText} onChange={(event) => setAltText(event.target.value)} /></Field><Field label="Caption (optional)"><input className={fieldClassName()} value={caption} onChange={(event) => setCaption(event.target.value)} /></Field><Button disabled={!file || upload.isPending} onClick={submit} className="rounded-none bg-lime-300 text-black hover:bg-lime-200 disabled:opacity-50">{upload.isPending ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />} Upload to media library</Button>{upload.error && <p className="text-xs text-red-300">{upload.error.message}</p>}</div></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{media?.map((item) => <article key={item.id} className="overflow-hidden border border-white/10 bg-[#171d16]"><div className="aspect-[4/3] bg-black"><img src={item.url} alt={item.altText || item.name} className="h-full w-full object-cover" /></div><div className="p-4"><p className="truncate text-sm font-bold text-white">{item.name}</p><p className="mt-1 min-h-9 text-xs leading-4 text-zinc-500">{item.altText || "No alt text added"}</p><Button variant="ghost" onClick={() => remove.mutate({ id: item.id })} className="mt-3 h-8 rounded-none px-0 text-xs text-red-300 hover:bg-transparent hover:text-red-200"><Trash2 size={14} /> Remove reference</Button></div></article>)}{media?.length === 0 && <div className="sm:col-span-2 lg:col-span-3"><Empty label="Your uploaded project images will appear here." /></div>}</div></div>;
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) { return <label className={cn("grid gap-2", className)}><span className="font-mono text-[10px] uppercase tracking-[.1em] text-zinc-500">{label}</span>{children}</label>; }
function Status({ status }: { status: "draft" | "published" }) { return <span className={cn("px-2 py-1 font-mono text-[9px] uppercase tracking-[.09em]", status === "published" ? "bg-lime-300/15 text-lime-200" : "bg-white/10 text-zinc-400")}>{status}</span>; }
function LoadingPanel({ label }: { label: string }) { return <div className="flex min-h-60 items-center justify-center gap-3 border border-white/10 bg-[#171d16] text-sm text-zinc-400"><Loader2 className="animate-spin text-lime-300" size={17} /> {label}</div>; }
function Empty({ label }: { label: string }) { return <div className="border border-dashed border-white/15 p-5 text-sm text-zinc-500">{label}</div>; }
function SaveBar({ label, saving, success, onSave }: { label: string; saving: boolean; success?: boolean; onSave: () => void }) { return <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 border border-white/10 bg-[#111510]/95 p-3 backdrop-blur"><span className="text-xs text-zinc-500">Changes are saved directly to the live content system.</span><Button disabled={saving} onClick={onSave} className="rounded-none bg-lime-300 text-black hover:bg-lime-200">{saving ? <Loader2 className="animate-spin" size={16} /> : success ? <Check size={16} /> : <Save size={16} />}{success ? "Saved" : label}</Button></div>; }
