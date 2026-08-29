import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Una validación = una búsqueda de problema (+ solución opcional) iniciada
  // por un usuario. Sin solution: modo "solo problema" (busca soluciones que
  // ya existen). Con solution: modo principal (busca competidores directos).
  validations: defineTable({
    userId: v.string(), // identity.subject de Clerk
    problem: v.string(),
    solution: v.optional(v.string()),
    status: v.union(
      v.literal("searching"),
      v.literal("done"),
      v.literal("error"),
    ),
    gap: v.optional(v.string()),
    verdict: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    // Señal de mercado: cuántos candidatos eran producto usable vs.
    // contenido (artículos/guías) que solo habla del tema.
    marketSignalProducts: v.optional(v.number()),
    marketSignalContentPieces: v.optional(v.number()),
    // Distingue "no hay productos reales" (certeza de mercado) de "la
    // búsqueda no trajo candidatos" (falta de datos) — nunca presentar el
    // segundo caso como si fuera el primero.
    zeroReason: v.optional(
      v.union(v.literal("no_real_products"), v.literal("no_candidates")),
    ),
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
});
