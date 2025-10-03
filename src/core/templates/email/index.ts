import fs from "fs";
import path from "path";
import Handlebars from "handlebars";

import { appConfig } from "@/core/config";

export type EmailTemplateRenderOptions = {
  templateId?: string;
  locale?: string;
  context?: Record<string, unknown>;
  fallback?: {
    title?: string;
    message?: string;
  };
  overrides?: {
    subject?: string;
  };
};

export type EmailTemplateRenderResult = {
  subject?: string;
  html?: string;
  text?: string;
};

type TemplateDelegate = Handlebars.TemplateDelegate;

type RegisteredTemplate = {
  id: string;
  compile: TemplateDelegate;
};

const EMAIL_TEMPLATE_ROOT = path.join(__dirname);
const LAYOUTS_DIR = path.join(EMAIL_TEMPLATE_ROOT, "layouts");
const PARTIALS_DIR = path.join(EMAIL_TEMPLATE_ROOT, "partials");

const templateCache = new Map<string, RegisteredTemplate>();
let partialsLoaded = false;

const toArray = (value: unknown): string[] => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : String(item)))
      .filter((item) => item.trim().length > 0);
  }

  if (typeof value === "string") {
    return value.trim().length ? [value] : [];
  }

  return [String(value)];
};

const normalizeCtas = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [] as Array<{ label: string; url: string }>;
  }

  return value
    .map((cta) => {
      if (!cta || typeof cta !== "object") {
        return undefined;
      }
      const label = String((cta as Record<string, unknown>).label ?? "").trim();
      const url = String((cta as Record<string, unknown>).url ?? "").trim();
      if (!label || !url) {
        return undefined;
      }
      return { label, url };
    })
    .filter((cta): cta is { label: string; url: string } => Boolean(cta));
};

const loadPartials = () => {
  if (partialsLoaded) {
    return;
  }
  if (!fs.existsSync(PARTIALS_DIR)) {
    partialsLoaded = true;
    return;
  }

  const files = fs.readdirSync(PARTIALS_DIR);
  files
    .filter((file) => file.endsWith(".hbs"))
    .forEach((file) => {
      const partialName = path.basename(file, ".hbs");
      const partialSource = fs.readFileSync(path.join(PARTIALS_DIR, file), "utf8");
      Handlebars.registerPartial(partialName, partialSource);
    });

  partialsLoaded = true;
};

const compileTemplateSource = (templateId: string, source: string) => {
  const compile = Handlebars.compile(source, { noEscape: true });
  const entry: RegisteredTemplate = { id: templateId, compile };
  templateCache.set(templateId, entry);
  return entry;
};

const loadTemplateFromDisk = (templateId: string) => {
  const filePath = path.join(LAYOUTS_DIR, `${templateId}.hbs`);
  if (!fs.existsSync(filePath)) {
    return undefined;
  }
  const source = fs.readFileSync(filePath, "utf8");
  return compileTemplateSource(templateId, source);
};

const resolveTemplate = (templateId: string) => {
  const cached = templateCache.get(templateId);
  if (cached) {
    return cached;
  }
  return loadTemplateFromDisk(templateId);
};

export const registerEmailTemplate = (templateId: string, templateSource: string) => {
  if (!templateId.trim()) {
    throw new Error("templateId cannot be empty");
  }
  compileTemplateSource(templateId, templateSource);
};

type RenderContext = ReturnType<typeof buildRenderContext>;

const buildRenderContext = (options: EmailTemplateRenderOptions) => {
  const rawContext = (options.context ?? {}) as Record<string, unknown>;
  const fallbackTitle = options.fallback?.title ?? appConfig.name;
  const fallbackMessage = options.fallback?.message ?? "";

  const subject =
    options.overrides?.subject ??
    (typeof rawContext.subject === "string" ? rawContext.subject : undefined) ??
    fallbackTitle ?? `${appConfig.name} Notification`;

  const title =
    (typeof rawContext.title === "string" ? rawContext.title : undefined) ??
    fallbackTitle ??
    appConfig.name;

  const locale =
    options.locale ?? (typeof rawContext.locale === "string" ? rawContext.locale : undefined) ?? "en";

  const previewText =
    (typeof rawContext.previewText === "string" ? rawContext.previewText : undefined) ?? fallbackMessage;

  const textOverride = typeof rawContext.text === "string" ? rawContext.text : undefined;
  const bodyHtml = typeof rawContext.bodyHtml === "string" ? rawContext.bodyHtml : undefined;

  const renderContext = {
    app: { name: appConfig.name },
    brand: appConfig.name,
    locale,
    subject,
    title,
    greeting: typeof rawContext.greeting === "string" ? rawContext.greeting : undefined,
    intro: toArray(rawContext.intro ?? fallbackMessage),
    body: toArray(rawContext.body),
    bodyHtml,
    outro: toArray(rawContext.outro),
    footerNote: typeof rawContext.footerNote === "string" ? rawContext.footerNote : undefined,
    headerSubtitle: typeof rawContext.headerSubtitle === "string" ? rawContext.headerSubtitle : undefined,
    previewText,
    ctas: normalizeCtas(rawContext.ctas),
    textOverride,
    raw: rawContext,
    fallback: options.fallback ?? {},
    year: new Date().getFullYear(),
  };

  return renderContext;
};

const buildTextVersion = (context: RenderContext) => {
  const segments: string[] = [];
  segments.push(context.title);
  if (context.greeting) {
    segments.push(context.greeting);
  }
  if (context.intro.length) {
    segments.push(...context.intro);
  }
  if (context.body.length) {
    segments.push(...context.body);
  }
  if (context.textOverride) {
    segments.push(context.textOverride);
  }
  if (context.outro.length) {
    segments.push(...context.outro);
  }
  if (context.footerNote) {
    segments.push(context.footerNote);
  } else {
    segments.push(`© ${context.year} ${context.brand}`);
  }
  return segments.filter((segment) => segment && segment.trim().length).join("\n\n");
};

export const renderEmailTemplate = (
  options: EmailTemplateRenderOptions,
): EmailTemplateRenderResult => {
  loadPartials();

  const templateId = options.templateId ?? "master";
  const template = resolveTemplate(templateId);

  if (!template) {
    throw new Error(`Email template '${templateId}' could not be found`);
  }

  const context = buildRenderContext(options);
  const html = template.compile(context);
  const text = buildTextVersion(context);

  return {
    subject: context.subject,
    html,
    text,
  };
};
