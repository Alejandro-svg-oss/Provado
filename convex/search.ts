import { query } from "./_generated/server";
import { v } from "convex/values";

// TODO(semantic): búsqueda semántica de Convex (vector search) sobre el
// historial del usuario. Opcional — no bloquea el flujo core. Por ahora
// hace un filtro de texto simple sobre las validaciones reales del usuario.
export const searchHistory = query({
  args: { queryText: v.string() },
  handler: async (ctx, { queryText }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const trimmed = queryText.trim().toLowerCase();
    if (!trimmed) return [];

    const validations = await ctx.db
      .query("validations")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    return validations.filter((v) =>
      `${v.problem} ${v.solution}`.toLowerCase().includes(trimmed),
    );
  },
});
