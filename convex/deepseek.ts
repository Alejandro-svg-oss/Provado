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

type MarketSignal = {
  products: number;
  contentPieces: number;
};

type ZeroReason = "no_real_products" | "no_candidates" | null;

type ExtractionResult = {
  verdict: string;
  players: ExtractedPlayer[];
  gap: string;
  marketSignal: MarketSignal;
  zeroReason: ZeroReason;
};

// Forma cruda del JSON del modo "solo problema" antes de normalizar a
// ExtractionResult (solutions -> players, howItSolves -> whereItWorks).
type SoloProblemRaw = {
  verdict: string;
  solutions: { name: string; howItSolves: string; sourceUrl?: string | null; confidence: "confirmado" | "probable" }[];
  gap: string;
  marketSignal: MarketSignal;
};

type MainModeRaw = {
  verdict: string;
  players: { name: string; whereItWorks: string; sourceUrl?: string | null; confidence: "confirmado" | "probable" }[];
  gap: string;
  marketSignal: MarketSignal;
};

const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions";

// Paso de clasificación compartido por ambos modos: separa producto (algo
// usable) de contenido (algo que solo habla del tema), para no inflar el
// conteo de competidores con blogs y guías.
const CLASSIFICATION_STEP = `PASO DE CLASIFICACIÓN (obligatorio antes de extraer):
Para cada candidato, decide qué es:
- "producto": una herramienta, app o servicio que un usuario puede USAR para resolver el problema. Compite de verdad.
- "contenido": un artículo, blog, guía, curso o crítica que HABLA del tema pero no es una herramienta usable.

REGLA: solo los "producto" entran en la lista final. El contenido NO se cuenta como competidor/solución. No inflar el conteo con blogs.

UN "producto" DEBE SER UNA HERRAMIENTA/SERVICIO USABLE Y PROPIO. NO son productos, aunque el fragmento lo sugiera:
- Posts o hilos de foros: Reddit, Quora, Hacker News, Indie Hackers, foros.
- Listados, directorios o marketplaces de terceros (una página que LISTA herramientas no es una herramienta).
- Redes sociales, videos, podcasts.
- Documentos, PDFs, plantillas, hojas de cálculo sueltas.

Estos se clasifican como "contenido" — son señal de que la gente HABLA del problema, nunca un competidor.

REGLA DE DOMINIO: si la URL es de reddit.com, quora.com, news.ycombinator.com, medium.com, youtube.com, o similares plataformas de contenido generado por usuarios, es "contenido" por defecto. Un producto real vive en su propio dominio o en una app store, no en un hilo.

TEST FUNCIONAL (aplícalo a CADA candidato, incluso si tiene su propio dominio): pregúntate "¿el usuario puede firmarse/registrarse/descargar/usar ESTO ahora mismo para resolver su problema?". Si la respuesta es "puede LEER sobre cómo resolverlo, pero no hay nada que instalar, registrar o suscribirse", es "contenido" — sin importar si el dominio es propio, tiene buen SEO, o "suena" a marca. Universidades, blogs corporativos, cámaras de comercio, incubadoras y consultoras que publican guías/checklists/kits educativos en su blog son "contenido", nunca "producto", aunque el título mencione una "herramienta" o "kit" — si ese "kit" es un artículo con una lista de pasos y no un software/servicio, sigue siendo contenido.

Ejemplos de esto que DEBEN clasificarse como "contenido" (son artículos/guías, no herramientas usables):
- Un "kit de herramientas" que es en realidad un artículo de blog explicando FODA y Business Model Canvas paso a paso.
- Un "checklist de 7 pasos" publicado por una universidad.
- Un artículo que "enseña a usar SEO" para validar demanda.
- Un blog post con "consejos prácticos" para confirmar si una idea funcionará.
Ninguno de estos te deja registrarte, pagar, o abrir una app — son lectura, no producto.

Nombrar un player: usa el nombre real del producto/empresa, nunca "Herramienta de X en Reddit". Si no puedes nombrar un producto real detrás del candidato, no es un producto.

Si un candidato es dudoso (una consultora, un servicio manual, un estudio), clasifícalo como "producto" solo si el usuario puede contratarlo/usarlo directamente; si solo explica cómo hacerlo, es "contenido".

USA EL CONTENIDO COMO SEÑAL, NO COMO RUIDO:
El volumen de contenido dice algo real sobre el mercado. Refléjalo en el veredicto y en "marketSignal":
- Mucho contenido + pocos productos = hay interés/demanda pero poca competencia real construida (buena señal para el hueco).
- Muchos productos = espacio saturado.`;

const ZERO_DISTINCTION_STEP = `DISTINGUE DOS CEROS:
- Si hubo candidatos pero ninguno era producto real → zeroReason = "no_real_products". Veredicto fuerte: "El mercado habla del problema pero nadie lo resuelve con producto. Hueco real."
- Si NO hubo candidatos en absoluto → zeroReason = "no_candidates". Veredicto honesto sobre la incertidumbre: "La búsqueda no devolvió resultados; puede ser un problema muy nuevo o una query demasiado específica. Vale la pena reformular."
- Si sí hay productos reales → zeroReason = null.

Nunca presentes un vacío de datos (no_candidates) como si fuera certeza de mercado (no_real_products). Son cosas distintas y hay que decir cuál es.`;

const TONE_STEP = `TONO: crítico con filo, pero SIEMPRE con recibos. Cada golpe va anclado a una fuente real de los candidatos — insulto con evidencia, nunca insulto a secas. Prohibido pegarle a la idea sin una URL que respalde el golpe.

El beef se APAGA cuando la idea sobrevive. Si de verdad no hay competencia real con fuente, no insultes: reconócelo con respeto ("ok, esto no lo está cubriendo nadie con fuente — aquí sí tienes de dónde agarrarte"). El contraste es lo que hace que el filo tenga peso cuando llega.

Nunca inventes una debilidad. Si no puedes respaldar el golpe con un candidato real, no lo des.`;

const MAIN_MODE_SYSTEM_PROMPT = `Eres el motor de evaluación de Provado. Recibes una idea de negocio (problema + solución) y una lista de CANDIDATOS que un scraper ya encontró en la web. Cada candidato trae un título, un fragmento y una URL real.

Tu trabajo: extraer 3-5 players que ya atacan ese problema, definir UN hueco concreto que la idea todavía podría ocupar, y emitir un veredicto de una línea con criterio propio.

REGLAS DURAS (inviolables):
1. NUNCA inventes ni alteres una URL. Solo puedes usar URLs que aparezcan literalmente en los candidatos. Si cambias un solo carácter de una URL, fallaste.
2. Un player es "confirmado" SOLO si lo respalda una URL real de los candidatos. Si no tiene fuente en los candidatos, es "probable" y su sourceUrl es null.
3. No rellenes para llegar a 5. Si solo hay 2 players con fuente real, entrega 2. La honestidad sobre la cantidad es parte del producto.
4. El "dónde funciona" de cada player debe salir del fragmento del candidato, no de tu conocimiento general. Si el fragmento no lo dice, márcalo como probable.

${CLASSIFICATION_STEP}

EL CASO "NO EXISTE" ES UNA VICTORIA, NO UN ERROR:
Si los candidatos no muestran players reales que ataquen exactamente este problema, NO lo trates como fallo. Es el mejor resultado posible: significa que la idea ocupa un espacio poco atendido. Dilo con claridad y confianza — ese hueco es el activo.

${ZERO_DISTINCTION_STEP}

${TONE_STEP}

Forma del veredicto con beef (ancla siempre a fuente):
"Esto ya lo hacen [N] empresas y [Player] lo hace mejor que como lo planteas ([fuente]). Tu versión no trae con qué diferenciarse — pero nadie está atacando [hueco], y ahí sí hay algo. Pívota."

Ejemplo de veredicto afinado con marketSignal: "Solo 1 producto real compite ([Player]); los otros resultados son artículos sobre el tema. Hay interés en el mercado pero el espacio construido está casi vacío — ahí está tu apertura."

SALIDA:
Devuelve SOLO este JSON, sin markdown, sin texto extra:
{
  "verdict": "string, una línea",
  "players": [
    { "name": "string", "whereItWorks": "string, una línea", "sourceUrl": "string o null", "confidence": "confirmado" | "probable" }
  ],
  "gap": "string, el hueco concreto que la idea podría ocupar",
  "marketSignal": { "products": <número de productos reales que compiten>, "contentPieces": <número de artículos/guías encontrados> },
  "zeroReason": "no_real_products" | "no_candidates" | null
}`;

const SOLO_PROBLEM_SYSTEM_PROMPT = `Eres el motor de evaluación de Provado, en modo "solo problema". El usuario describió un PROBLEMA pero todavía no tiene solución. Recibes CANDIDATOS que un scraper ya encontró en la web, cada uno con título, fragmento y URL real.

Tu trabajo: encontrar 3-5 soluciones que YA existen para este problema, definir qué parte del problema queda mal resuelta (el hueco), y emitir un veredicto con criterio.

REGLAS DURAS (inviolables):
1. NUNCA inventes ni alteres una URL. Solo usa las que aparecen en los candidatos. Un carácter cambiado = fallaste.
2. Una solución es "confirmado" solo si la respalda una URL real de los candidatos; si no, es "probable" con sourceUrl null.
3. No rellenes para llegar a 5. Si hay 2 soluciones reales, entrega 2.

${CLASSIFICATION_STEP}

EL CASO "NADIE LO RESUELVE BIEN" ES ORO:
Si los candidatos no muestran soluciones reales para este problema, es el mejor resultado: hay un problema sin resolver esperando. Dilo con confianza — eso es una oportunidad, no un vacío.

${ZERO_DISTINCTION_STEP}

${TONE_STEP}

En modo solo-problema el beef es más suave por naturaleza — no hay una solución del usuario a la que pegarle todavía, así que el filo se va hacia "esto ya está resuelto, no reinventes" cuando el espacio está lleno.

VEREDICTO: una línea, con criterio. Juzga, no describas.
- "Este problema ya lo resuelven 3 herramientas; la parte sin cubrir es [hueco]."
- "Casi nadie resuelve esto con producto real. Hay un problema abierto aquí."

SALIDA: SOLO este JSON, sin markdown, sin texto extra:
{
  "verdict": "string, una línea",
  "solutions": [
    { "name": "string", "howItSolves": "string, una línea", "sourceUrl": "string o null", "confidence": "confirmado" | "probable" }
  ],
  "gap": "string, la parte del problema que ninguna solución cubre bien",
  "marketSignal": { "products": <número>, "contentPieces": <número> },
  "zeroReason": "no_real_products" | "no_candidates" | null
}`;

function buildUserMessage(
  problem: string,
  solution: string | undefined,
  candidates: ApifyPlayer[],
): string {
  const sourcesList = candidates
    .map((c, i) => {
      const source = c.sourceUrl ? c.sourceUrl : "SIN_FUENTE";
      return `${i + 1}. nombre="${c.name}" fuente=${source} resumen="${c.whereItWorks}"`;
    })
    .join("\n");

  const solutionLine = solution
    ? `Solución propuesta: ${solution}`
    : "Solución propuesta: (el usuario todavía no tiene una)";

  return `Problema: ${problem}
${solutionLine}

Candidatos encontrados en la búsqueda (cada uno con su fuente real o SIN_FUENTE si no tiene una):
${sourcesList || "(ninguno)"}`;
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  return text.trim();
}

function normalizeMarketSignal(raw?: Partial<MarketSignal>): MarketSignal {
  return {
    products: typeof raw?.products === "number" ? raw.products : 0,
    contentPieces: typeof raw?.contentPieces === "number" ? raw.contentPieces : 0,
  };
}

// Segunda línea de defensa contra URLs alucinadas: no confiar solo en el
// prompt. Cada sourceUrl que DeepSeek devuelve se valida contra la lista
// real de candidatos que Apify encontró; si no coincide exactamente, se
// descarta y el player pasa a "probable".
//
// zeroReason se recalcula aquí en vez de confiar ciegamente en el valor de
// DeepSeek: si Apify no trajo candidatos, es "no_candidates" sin importar
// qué haya dicho el modelo. Si hubo candidatos pero terminamos sin players
// reales tras la sanitización, es "no_real_products".
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

  let zeroReason: ZeroReason = null;
  if (candidates.length === 0) {
    zeroReason = "no_candidates";
  } else if (players.length === 0) {
    zeroReason = "no_real_products";
  }

  return {
    verdict: result.verdict,
    players,
    gap: result.gap,
    marketSignal: result.marketSignal,
    zeroReason,
  };
}

export async function extractPlayersWithDeepSeek(
  problem: string,
  solution: string | undefined,
  candidates: ApifyPlayer[],
): Promise<ExtractionResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("Missing DEEPSEEK_API_KEY environment variable.");
  }

  const isSoloProblemMode = !solution || solution.trim().length === 0;
  const systemPrompt = isSoloProblemMode ? SOLO_PROBLEM_SYSTEM_PROMPT : MAIN_MODE_SYSTEM_PROMPT;

  const response = await fetch(DEEPSEEK_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: buildUserMessage(problem, solution, candidates) },
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

  let normalized: ExtractionResult;
  try {
    const json = extractJson(content);

    if (isSoloProblemMode) {
      const parsed = JSON.parse(json) as SoloProblemRaw;
      normalized = {
        verdict: parsed.verdict,
        gap: parsed.gap,
        marketSignal: normalizeMarketSignal(parsed.marketSignal),
        // zeroReason se recalcula en sanitizeAgainstCandidates, no se confía
        // en el valor crudo de DeepSeek.
        zeroReason: null,
        players: (parsed.solutions ?? []).map((s) => ({
          name: s.name,
          whereItWorks: s.howItSolves,
          sourceUrl: s.sourceUrl ?? undefined,
          confidence: s.confidence,
        })),
      };
    } else {
      const parsed = JSON.parse(json) as MainModeRaw;
      normalized = {
        verdict: parsed.verdict,
        gap: parsed.gap,
        marketSignal: normalizeMarketSignal(parsed.marketSignal),
        zeroReason: null,
        players: (parsed.players ?? []).map((p) => ({
          name: p.name,
          whereItWorks: p.whereItWorks,
          sourceUrl: p.sourceUrl ?? undefined,
          confidence: p.confidence,
        })),
      };
    }
  } catch {
    throw new Error(
      "DeepSeek devolvió una respuesta que no se pudo interpretar. Intenta de nuevo con un problema/solución más específicos.",
    );
  }

  return sanitizeAgainstCandidates(normalized, candidates);
}
