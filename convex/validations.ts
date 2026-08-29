import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("validations")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("validations") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const validation = await ctx.db.get(id);
    if (!validation || validation.userId !== identity.subject) return null;

    const players = await ctx.db
      .query("players")
      .withIndex("by_validation", (q) => q.eq("validationId", id))
      .collect();

    return { ...validation, players };
  },
});

export const create = mutation({
  args: { problem: v.string(), solution: v.optional(v.string()) },
  handler: async (ctx, { problem, solution }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const validationId = await ctx.db.insert("validations", {
      userId: identity.subject,
      problem,
      solution: solution?.trim() ? solution : undefined,
      status: "searching",
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.evidenceSearch.runEvidenceSearch, {
      validationId,
    });

    return validationId;
  },
});

export const saveResults = internalMutation({
  args: {
    validationId: v.id("validations"),
    gap: v.string(),
    verdict: v.string(),
    marketSignalProducts: v.number(),
    marketSignalContentPieces: v.number(),
    zeroReason: v.optional(
      v.union(v.literal("no_real_products"), v.literal("no_candidates")),
    ),
    players: v.array(
      v.object({
        name: v.string(),
        whereItWorks: v.string(),
        sourceUrl: v.optional(v.string()),
        confidence: v.union(v.literal("confirmado"), v.literal("probable")),
      }),
    ),
  },
  handler: async (
    ctx,
    {
      validationId,
      gap,
      verdict,
      marketSignalProducts,
      marketSignalContentPieces,
      zeroReason,
      players,
    },
  ) => {
    await ctx.db.patch(validationId, {
      status: "done",
      gap,
      verdict,
      marketSignalProducts,
      marketSignalContentPieces,
      zeroReason,
    });
    for (const player of players) {
      await ctx.db.insert("players", { validationId, ...player });
    }
  },
});

export const markError = internalMutation({
  args: { validationId: v.id("validations"), message: v.string() },
  handler: async (ctx, { validationId, message }) => {
    await ctx.db.patch(validationId, { status: "error", errorMessage: message });
  },
});

export const getForAction = internalQuery({
  args: { validationId: v.id("validations") },
  handler: async (ctx, { validationId }) => {
    return await ctx.db.get(validationId);
  },
});
