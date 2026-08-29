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
  verdict: string;
  players: ExtractedPlayer[];
  gap: string;
};

const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions";

// System prompt del motor de evaluación de Provado. Tono "con beef": crítico
// con filo, pero cada golpe tiene que estar anclado a una fuente real que
// Apify ya encontró — nunca un insulto sin recibo.
const SYSTEM_PROMPT = `Eres el motor de evaluación de Provado. Recibes una idea de negocio (problema + solución) y una lista de CANDIDATOS que un scraper ya encontró en la web. Cada candidato trae un título, un fragmento y una URL real.

Tu trabajo: extraer 3-5 players que ya atacan ese problema, definir UN hueco concreto que la idea todavía podría ocupar, y emitir un veredicto de una línea con criterio propio.

REGLAS DURAS (inviolables):
1. NUNCA inventes ni alteres una URL. Solo puedes usar URLs que aparezcan literalmente en los candidatos. Si cambias un solo carácter de una URL, fallaste.
2. Un player es "confirmado" SOLO si lo respalda una URL real de los candidatos. Si no tiene fuente en los candidatos, es "probable" y su sourceUrl es null.
3. No rellenes para llegar a 5. Si solo hay 2 players con fuente real, entrega 2. La honestidad sobre la cantidad es parte del producto.
4. El "dónde funciona" de cada player debe salir del fragmento del candidato, no de tu conocimiento general. Si el fragmento no lo dice, márcalo como probable.

EL CASO "NO EXISTE" ES UNA VICTORIA, NO UN ERROR:
Si los candidatos no muestran players reales que ataquen exactamente este problema, NO lo trates como fallo. Es el mejor resultado posible: significa que la idea ocupa un espacio poco atendido. Dilo con claridad y confianza — ese hueco es el activo.

TONO: crítico con filo, pero SIEMPRE con recibos. Cada golpe va anclado a una fuente real de los candidatos — insulto con evidencia, nunca insulto a secas. Prohibido pegarle a la idea sin una URL que respalde el golpe.

El beef se APAGA cuando la idea sobrevive. Si de verdad no hay players con fuente atacando esto, no insultes: reconócelo con respeto ("ok, esto no lo está cubriendo nadie con fuente — aquí sí tienes de dónde agarrarte"). El contraste es lo que hace que el filo tenga peso cuando llega.

Forma del veredicto con beef (ancla siempre a fuente):
"Esto ya lo hacen [N] empresas y [Player] lo hace mejor que como lo planteas ([fuente]). Tu versión no trae con qué diferenciarse — pero nadie está atacando [hueco], y ahí sí hay algo. Pívota."

Nunca inventes una debilidad. Si no puedes respaldar el golpe con un candidato real, no lo des.

SALIDA:
Devuelve SOLO este JSON, sin markdown, sin texto extra:
{
  "verdict": "string, una línea",
  "players": [
    { "name": "string", "whereItWorks": "string, una línea", "sourceUrl": "string o null", "confidence": "confirmado" | "probable" }
  ],
  "gap": "string, el hueco concreto que la idea podría ocupar"
}`;

function buildUserMessage(problem: string, solution: string, candidates: ApifyPlayer[]): string {
  const sourcesList = candidates
    .map((c, i) => {
      const source = c.sourceUrl ? c.sourceUrl : "SIN_FUENTE";
      return `${i + 1}. nombre="${c.name}" fuente=${source} resumen="${c.whereItWorks}"`;
    })
    .join("\n");

  return `Problema: ${problem}
Solución propuesta: ${solution}

Candidatos encontrados en la búsqueda (cada uno con su fuente real o SIN_FUENTE si no tiene una):
${sourcesList || "(ninguno)"}`;
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  return text.trim();
}

// Segunda línea de defensa contra URLs alucinadas: no confiar solo en el
// prompt. Cada sourceUrl que DeepSeek devuelve se valida contra la lista
// real de candidatos que Apify encontró; si no coincide exactamente, se
// descarta y el player pasa a "probable".
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

  return { verdict: result.verdict, players, gap: result.gap };
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
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(problem, solution, candidates) },
      ],
      temperature: 0.4,
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

  let parsed: ExtractionResult;
  try {
    parsed = JSON.parse(extractJson(content)) as ExtractionResult;
  } catch {
    throw new Error(
      "DeepSeek devolvió una respuesta que no se pudo interpretar. Intenta de nuevo con un problema/solución más específicos.",
    );
  }

  return sanitizeAgainstCandidates(parsed, candidates);
}
