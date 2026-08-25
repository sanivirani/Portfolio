import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { defaultSiteSettings, portfolioContent } from "../shared/portfolioDefaults";
import * as db from "./db";
import { storagePut } from "./storage";
import { adminProcedure, publicProcedure, router, verifiedAdminProcedure } from "./_core/trpc";

const pillarSchema = z.object({
  number: z.string().max(8),
  title: z.string().min(1).max(80),
  eyebrow: z.string().min(1).max(140),
  description: z.string().min(1).max(700),
  tags: z.array(z.string().min(1).max(60)).max(8),
});

const journeySchema = z.object({
  period: z.string().min(1).max(100),
  company: z.string().min(1).max(150),
  role: z.string().min(1).max(180),
  track: z.string().min(1).max(80),
});

const processSchema = z.object({
  number: z.string().max(8),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(700),
});

const siteContentSchema = z.object({
  name: z.string().min(1).max(100),
  positioning: z.string().min(1).max(180),
  hero: z.string().min(1).max(400),
  supportingLine: z.string().min(1).max(700),
  sections: z.object({
    expertiseHeading: z.string().min(1).max(300),
    expertiseIntro: z.string().min(1).max(700),
    statement: z.string().min(1).max(700),
    workHeading: z.string().min(1).max(300),
    workIntro: z.string().min(1).max(700),
    journeyHeading: z.string().min(1).max(300),
    journeyIntro: z.string().min(1).max(700),
    approachHeading: z.string().min(1).max(300),
    contactHeading: z.string().min(1).max(300),
  }),
  pillars: z.array(pillarSchema).min(1).max(8),
  journey: z.array(journeySchema).max(20),
  process: z.array(processSchema).min(1).max(8),
  stack: z.array(z.string().min(1).max(80)).max(30),
});

const siteSettingsSchema = z.object({
  contactEmail: z.string().email().or(z.literal("")),
  linkedinUrl: z.string().url().or(z.literal("")),
  githubUrl: z.string().url().or(z.literal("")),
  contactIntro: z.string().min(1).max(700),
});

const metricSchema = z.object({
  label: z.string().min(1).max(80),
  value: z.string().min(1).max(80),
  description: z.string().max(180).optional().default(""),
});

const caseStudyInputSchema = z.object({
  slug: z.string().min(1).max(160).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only."),
  title: z.string().min(1).max(160),
  label: z.string().min(1).max(255),
  industry: z.string().min(1).max(160),
  role: z.string().max(3000).default(""),
  description: z.string().min(1).max(6000),
  focus: z.string().min(1).max(255),
  tone: z.enum(["violet", "lime", "sand"]),
  services: z.array(z.string().min(1).max(80)).max(16),
  technologies: z.array(z.string().min(1).max(80)).max(16),
  metrics: z.array(metricSchema).max(12),
  mediaId: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().min(0).max(1000),
  status: z.enum(["draft", "published"]),
});

const defaultContent = {
  ...portfolioContent,
  process: portfolioContent.process.map(([number, title, description]) => ({ number, title, description })),
};

function parseCaseStudy(row: Awaited<ReturnType<typeof db.getCaseStudies>>[number]) {
  return {
    ...row,
    role: row.role ?? "",
    services: db.parseJson<string[]>(row.services, []),
    technologies: db.parseJson<string[]>(row.technologies, []),
    metrics: db.parseJson<z.infer<typeof metricSchema>[]>(row.metrics, []),
  };
}

function toCaseStudyValues(input: z.infer<typeof caseStudyInputSchema>) {
  return {
    slug: input.slug,
    title: input.title,
    label: input.label,
    industry: input.industry,
    role: input.role || null,
    description: input.description,
    focus: input.focus,
    tone: input.tone,
    services: JSON.stringify(input.services),
    technologies: JSON.stringify(input.technologies),
    metrics: JSON.stringify(input.metrics),
    mediaId: input.mediaId ?? null,
    sortOrder: input.sortOrder,
    status: input.status,
  };
}

export const portfolioRouter = router({
  public: router({
    site: publicProcedure.query(async () => {
      const [storedContent, storedSettings, publishedCaseStudies, media] = await Promise.all([
        db.getSetting("siteContent", defaultContent),
        db.getSetting("siteSettings", defaultSiteSettings),
        db.getCaseStudies("published"),
        db.getMedia(),
      ]);
      return {
        content: siteContentSchema.parse(storedContent),
        settings: siteSettingsSchema.parse(storedSettings),
        caseStudies: publishedCaseStudies.map((caseStudy) => ({
          ...parseCaseStudy(caseStudy),
          mediaUrl: caseStudy.mediaId ? media.find((item) => item.id === caseStudy.mediaId)?.url ?? null : null,
        })),
      };
    }),
  }),
  admin: router({
    initialize: verifiedAdminProcedure.mutation(async () => {
      const [settings, existingCaseStudies] = await Promise.all([
        db.getAllSettings(),
        db.getCaseStudies(),
      ]);
      const settingKeys = new Set(settings.map((setting) => setting.key));
      if (!settingKeys.has("siteContent")) await db.setSetting("siteContent", defaultContent);
      if (!settingKeys.has("siteSettings")) await db.setSetting("siteSettings", defaultSiteSettings);
      if (existingCaseStudies.length === 0) {
        await Promise.all(portfolioContent.work.map((item, index) => db.createCaseStudy({
            slug: item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
            title: item.title,
            label: item.label,
            industry: item.industry,
            role: null,
            description: item.summary,
            focus: item.focus,
            tone: item.tone,
            services: JSON.stringify(item.scope),
            technologies: JSON.stringify(item.scope),
            metrics: "[]",
            mediaId: null,
            sortOrder: index,
            status: "published",
          })));
      }
      return { initialized: true };
    }),
    overview: adminProcedure.query(async () => {
      const [caseStudies, media, settings] = await Promise.all([
        db.getCaseStudies(),
        db.getMedia(),
        db.getAllSettings(),
      ]);
      return {
        caseStudies: caseStudies.length,
        published: caseStudies.filter((item) => item.status === "published").length,
        media: media.length,
        settings: settings.length,
      };
    }),
    content: router({
      get: adminProcedure.query(async () => {
        const content = await db.getSetting("siteContent", defaultContent);
        return siteContentSchema.parse(content);
      }),
      update: verifiedAdminProcedure.input(siteContentSchema).mutation(async ({ input }) => {
        await db.setSetting("siteContent", input);
        return input;
      }),
    }),
    settings: router({
      get: adminProcedure.query(async () => {
        const settings = await db.getSetting("siteSettings", defaultSiteSettings);
        return siteSettingsSchema.parse(settings);
      }),
      update: verifiedAdminProcedure.input(siteSettingsSchema).mutation(async ({ input }) => {
        await db.setSetting("siteSettings", input);
        return input;
      }),
    }),
    caseStudies: router({
      list: adminProcedure.query(async () => (await db.getCaseStudies()).map(parseCaseStudy)),
      create: verifiedAdminProcedure.input(caseStudyInputSchema).mutation(async ({ input }) => {
        try {
          const id = await db.createCaseStudy(toCaseStudyValues(input));
          return { id };
        } catch (error) {
          if (db.isDuplicateEntry(error)) {
            throw new TRPCError({ code: "CONFLICT", message: "A case study with this URL slug already exists." });
          }
          throw error;
        }
      }),
      update: verifiedAdminProcedure.input(z.object({ id: z.number().int().positive(), values: caseStudyInputSchema })).mutation(async ({ input }) => {
        try {
          const updated = await db.updateCaseStudy(input.id, toCaseStudyValues(input.values));
          if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Case study not found." });
          return { updated: true };
        } catch (error) {
          if (db.isDuplicateEntry(error)) {
            throw new TRPCError({ code: "CONFLICT", message: "A case study with this URL slug already exists." });
          }
          throw error;
        }
      }),
      remove: verifiedAdminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
        await db.removeCaseStudy(input.id);
        return { removed: true };
      }),
    }),
    media: router({
      list: adminProcedure.query(() => db.getMedia()),
      upload: verifiedAdminProcedure.input(z.object({
        name: z.string().min(1).max(255),
        mimeType: z.string().regex(/^image\/(jpeg|png|webp|gif|svg\+xml)$/, "Use a supported image format."),
        dataUrl: z.string().min(1).max(45_000_000),
        altText: z.string().max(255).default(""),
        caption: z.string().max(1000).default(""),
      })).mutation(async ({ input }) => {
        const base64 = input.dataUrl.split(",")[1];
        if (!base64) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid image data." });
        const buffer = Buffer.from(base64, "base64");
        if (buffer.length > 12 * 1024 * 1024) {
          throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Keep uploaded images below 12 MB." });
        }
        const extension = input.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "image";
        const key = `portfolio-media/${Date.now()}-${nanoid(8)}.${extension}`;
        const stored = await storagePut(key, buffer, input.mimeType);
        const id = await db.createMedia({
          name: input.name,
          key: stored.key,
          url: stored.url,
          mimeType: input.mimeType,
          altText: input.altText,
          caption: input.caption || null,
        });
        return { id, url: stored.url };
      }),
      update: verifiedAdminProcedure.input(z.object({
        id: z.number().int().positive(),
        altText: z.string().max(255),
        caption: z.string().max(1000),
      })).mutation(async ({ input }) => {
        await db.updateMedia(input.id, { altText: input.altText, caption: input.caption || null });
        return { updated: true };
      }),
      remove: verifiedAdminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
        await db.removeMedia(input.id);
        return { removed: true };
      }),
    }),
  }),
});
