"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { fetchPlayerCandidatesFromApify } from "./apifySearch";
import { extractPlayersWithDeepSeek } from "./deepseek";

// Orquesta el flujo real: Apify (búsqueda web en vivo) -> DeepSeek (extracción
// de players + hueco). Nunca inventa URLs: DeepSeek solo puede usar fuentes
// que Apify ya encontró (ver convex/deepseek.ts: sanitizeAgainstCandidates).
export const runEvidenceSearch = internalAction({
  args: { validationId: v.id("validations") },
  handler: async (ctx, { validationId }) => {
    const validation = await ctx.runQuery(internal.validations.getForAction, {
      validationId,
    });
    if (!validation) return;

    try {
      const query = `${validation.problem} ${validation.solution}`;
      const { players: candidates } = await fetchPlayerCandidatesFromApify(query, 8);

      const { players, gap, verdict } = await extractPlayersWithDeepSeek(
        validation.problem,
        validation.solution,
        candidates,
      );

      await ctx.runMutation(internal.validations.saveResults, {
        validationId,
        gap,
        verdict,
        players,
      });
    } catch (error) {
      console.error("runEvidenceSearch failed:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Algo falló al buscar evidencia. Prueba con un problema y solución más específicos.";
      await ctx.runMutation(internal.validations.markError, { validationId, message });
    }
  },
});
