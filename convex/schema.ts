import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Una validación = una búsqueda de problema/solución iniciada por un usuario.
  validations: defineTable({
    userId: v.string(), // identity.subject de Clerk
    problem: v.string(),
    solution: v.string(),
    status: v.union(
      v.literal("searching"),
      v.literal("done"),
      v.literal("error"),
    ),
    gap: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Cada player encontrado para una validación.
  players: defineTable({
    validationId: v.id("validations"),
    name: v.string(),
    whereItWorks: v.string(),
    sourceUrl: v.optional(v.string()),
    confidence: v.union(v.literal("confirmado"), v.literal("probable")),
  }).index("by_validation", ["validationId"]),

  // TODO(apify): otra persona escribe aquí desde un scraper Apify. El front solo lee.
  scrapedSources: defineTable({
    validationId: v.id("validations"),
    url: v.string(),
    rawContent: v.string(),
    fetchedAt: v.number(),
  }).index("by_validation", ["validationId"]),
});
