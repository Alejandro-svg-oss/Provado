"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

const DEFAULT_ACTOR_ID = "nFJndFXA5zjCTuudP";

const APIFY_BASE_INPUT = {
  maxPagesPerQuery: 1,
  mobileResults: false,
  languageCode: "",
  searchLanguage: "",
  forceExactMatch: false,
  focusOnPaidAds: false,
  includeIcons: false,
  includeUnfilteredResults: false,
  saveHtml: false,
  saveHtmlToKeyValueStore: false,
  aiOverview: { scrapeFullAiOverview: false },
  aiModeSearch: { enableAiMode: false },
  perplexitySearch: {
    enablePerplexity: false,
    returnImages: false,
    returnRelatedQuestions: false,
  },
  chatGptSearch: { enableChatGpt: false },
  geminiSearch: { enableGemini: false },
  copilotSearch: { enableCopilot: false },
  websiteContentScraper: { enable: false },
  maximumLeadsEnrichmentRecords: 0,
  verifyLeadsEnrichmentEmails: false,
  wordsInTitle: [] as string[],
  wordsInText: [] as string[],
  wordsInUrl: [] as string[],
};

type OrganicResult = {
  title?: string;
  websiteTitle?: string;
  url?: string;
  description?: string;
};

type SerpPage = {
  organicResults?: OrganicResult[];
};

type PlayerCandidate = {
  name: string;
  whereItWorks: string;
  sourceUrl?: string;
  confidence: "confirmado" | "probable";
};

function isHttpUrl(value?: string): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizedDomain(value: string): string {
  return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
}

function inferName(result: OrganicResult): string {
  if (result.websiteTitle?.trim()) return result.websiteTitle.trim();
  if (result.title?.trim()) return result.title.trim();
  if (isHttpUrl(result.url)) return normalizedDomain(result.url);
  return "player-sin-nombre";
}

function inferWhereItWorks(result: OrganicResult): string {
  const text = result.description?.trim();
  if (!text) return "Segmento no especificado en la fuente.";
  return text.length > 220 ? `${text.slice(0, 217)}...` : text;
}

export const scrapePlayersFromApify = action({
  args: {
    query: v.string(),
    maxPlayers: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    const token = process.env.APIFY_TOKEN;
    if (!token) {
      throw new Error("Missing APIFY_TOKEN environment variable.");
    }

    const actorId = process.env.APIFY_ACTOR_ID ?? DEFAULT_ACTOR_ID;
    const maxPlayers = Math.max(1, Math.min(args.maxPlayers ?? 5, 10));

    const input = {
      ...APIFY_BASE_INPUT,
      queries: args.query,
    };

    const endpoint = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${encodeURIComponent(
      token,
    )}&clean=true&format=json`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Apify request failed (${response.status}): ${body}`);
    }

    const pages = (await response.json()) as SerpPage[];
    const organic = pages.flatMap((page) => page.organicResults ?? []);

    const dedupedByDomain = new Map<string, PlayerCandidate>();
    for (const result of organic) {
      const hasSource = isHttpUrl(result.url);
      const domainKey = hasSource
        ? normalizedDomain(result.url)
        : `unknown-${dedupedByDomain.size + 1}`;

      if (dedupedByDomain.has(domainKey)) continue;

      dedupedByDomain.set(domainKey, {
        name: inferName(result),
        whereItWorks: inferWhereItWorks(result),
        sourceUrl: hasSource ? result.url : undefined,
        confidence: hasSource ? "confirmado" : "probable",
      });

      if (dedupedByDomain.size >= maxPlayers) break;
    }

    return {
      query: args.query,
      actorId,
      players: Array.from(dedupedByDomain.values()),
      organicResultsScanned: organic.length,
    };
  },
});
