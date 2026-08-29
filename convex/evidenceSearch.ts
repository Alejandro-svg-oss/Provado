"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { fetchPlayerCandidatesFromApify } from "./apifySearch";
import { extractPlayersWithDeepSeek } from "./deepseek";
import { distillSearchQuery } from "./queryDistillation";

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
      const hasSolution = Boolean(validation.solution?.trim());

      // Paso 0: destila la prosa del usuario en keywords buscables antes de
      // tocar Apify. Sin esto, una frase conversacional en primera persona
      // no casa con ninguna página real y el motor reporta 0 candidatos
      // aunque el problema sí tenga competidores indexables.
      const distilled = await distillSearchQuery(validation.problem, validation.solution);

      // Modo principal: busca competidores directos de la solución propuesta.
      // Modo solo-problema: orienta la query a soluciones ya existentes.
      // Sin comillas de frase exacta: pedirle a Google una coincidencia
      // literal de una oración completa casi nunca encuentra nada real:
      // Google cae a un fallback silencioso por palabras sueltas que trae
      // basura genérica. Palabras clave sin comillas funciona mejor.
      const query = hasSolution ? distilled : `cómo resolver ${distilled} herramienta solución`;

      const { players: candidates } = await fetchPlayerCandidatesFromApify(query, 8);

      const { players, gap, verdict, marketSignal, zeroReason } = await extractPlayersWithDeepSeek(
        validation.problem,
        validation.solution,
        candidates,
      );

      await ctx.runMutation(internal.validations.saveResults, {
        validationId,
        gap,
        verdict,
        players,
        marketSignalProducts: marketSignal.products,
        marketSignalContentPieces: marketSignal.contentPieces,
        zeroReason: zeroReason ?? undefined,
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
