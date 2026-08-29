"use node";

type ApifyPlayer = {
  name: string;
  whereItWorks: string;
  sourceUrl?: string;
  confidence: "confirmado" | "probable";
};

type ExtractedPlayer = {
  name: string;
  whereItWorks: string;
  sourceUrl?: string;
  confidence: "confirmado" | "probable";
};

type ExtractionResult = {
  players: ExtractedPlayer[];
  gap: string;
};

const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions";

function buildPrompt(problem: string, solution: string, candidates: ApifyPlayer[]): string {
  const sourcesList = candidates
    .map((c, i) => {
      const source = c.sourceUrl ? c.sourceUrl : "SIN_FUENTE";
      return `${i + 1}. nombre="${c.name}" fuente=${source} resumen="${c.whereItWorks}"`;
    })
    .join("\n");

  return `Eres un analista que valida ideas de negocio contra evidencia real. Recibiste resultados crudos de una búsqueda web (Apify) sobre este problema/solución:

Problema: ${problem}
Solución propuesta: ${solution}

Candidatos encontrados en la búsqueda (cada uno con su fuente real o SIN_FUENTE si no tiene una):
${sourcesList || "(ninguno)"}

Tu tarea:
1. Selecciona entre 3 y 5 players reales que ya atacan este problema, basándote SOLO en los candidatos de arriba. No inventes players que no estén en la lista.
2. Para cada player, escribe una línea concreta de dónde funciona (mercado, segmento o región), basada en su resumen.
3. Usa EXACTAMENTE la misma fuente (sourceUrl) que tiene el candidato en la lista. Si el candidato no tiene fuente (SIN_FUENTE), el player debe quedar como "probable" y sourceUrl debe ser null. Nunca inventes ni modifiques una URL.
4. Escribe un "hueco concreto": una oración sobre qué no está resuelto por ninguno de estos players, que el usuario podría ocupar.

Responde ÚNICAMENTE con JSON válido en este formato exacto, sin texto adicional:
{
  "players": [
    { "name": "...", "whereItWorks": "...", "sourceUrl": "https://..." o null, "confidence": "confirmado" o "probable" }
  ],
  "gap": "..."
}`;
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  return text.trim();
}

// Nunca confiar en una sourceUrl que DeepSeek "recuerde" mal: solo se acepta
// si coincide exactamente con una fuente que Apify realmente encontró.
function sanitizeAgainstCandidates(
  result: ExtractionResult,
  candidates: ApifyPlayer[],
): ExtractionResult {
  const knownUrls = new Set(candidates.map((c) => c.sourceUrl).filter(Boolean));

  const players = result.players
    .map((p): ExtractedPlayer => {
      const sourceUrl = p.sourceUrl && knownUrls.has(p.sourceUrl) ? p.sourceUrl : undefined;
      return {
        name: p.name,
        whereItWorks: p.whereItWorks,
        sourceUrl,
        confidence: sourceUrl ? "confirmado" : "probable",
      };
    })
    .slice(0, 5);

  return { players, gap: result.gap };
}

export async function extractPlayersWithDeepSeek(
  problem: string,
  solution: string,
  candidates: ApifyPlayer[],
): Promise<ExtractionResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("Missing DEEPSEEK_API_KEY environment variable.");
  }

  const response = await fetch(DEEPSEEK_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: buildPrompt(problem, solution, candidates),
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DeepSeek request failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek returned an empty response.");
  }

  const parsed = JSON.parse(extractJson(content)) as ExtractionResult;
  return sanitizeAgainstCandidates(parsed, candidates);
}
