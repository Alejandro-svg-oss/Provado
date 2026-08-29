import { query } from "./_generated/server";
import { v } from "convex/values";

// TODO(semantic): búsqueda semántica de Convex (vector search) sobre el
// historial del usuario. Opcional — no bloquea el flujo core. Por ahora
// hace un filtro de texto simple sobre datos mock.
export const searchHistory = query({
  args: { queryText: v.string() },
  handler: async (ctx, { queryText }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    if (!queryText.trim()) return [];

    // Stub: en producción esto sería un vectorSearch sobre embeddings
    // generados a partir de problem + solution de cada validación.
    return [];
  },
});
