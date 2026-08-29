"use node";

const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions";
const MAX_DISTILLED_WORDS = 10;

const SYSTEM_PROMPT = `Convierte la descripción del usuario en una query de búsqueda web efectiva. El usuario suele escribir en prosa, en primera persona, con rodeos ("el problema que vivo es que..."). Tu trabajo es extraer la esencia buscable.

REGLAS:
- Devuelve 3-6 palabras clave o una frase de búsqueda corta, como la escribiría alguien en Google, NO una oración.
- Enfócate en el DOMINIO y la CATEGORÍA del problema/solución, no en las emociones ni el "yo".
- Quita muletillas, primera persona y contexto personal. "tengo muchas ideas y no sé si alguien ya las hizo" → "validar si idea de negocio ya existe".
- Si hay solución, prioriza el tipo de producto/herramienta. Si solo hay problema, enfócate en el problema.
- Español si el usuario escribió en español.
- No inventes un dominio que el usuario no mencionó.

Devuelve SOLO la query, sin comillas, sin explicación.

Ejemplos:
Usuario: "el problema que vivo diariamente es que tengo muchas ideas pero no sé si alguien más ya ha tenido éxito con ellas"
Query: validar ideas de negocio existentes competidores

Usuario: "quiero hacer una app para que la gente agende citas con barberos"
Query: app agendar citas barbería

Usuario: "no sé cómo organizar los gastos de mi pequeño negocio"
Query: herramienta gastos pequeño negocio`;

function buildUserMessage(problem: string, solution?: string): string {
  return solution?.trim() ? `Usuario: "${problem} ${solution}"` : `Usuario: "${problem}"`;
}

// Red de seguridad determinística: si DeepSeek falla, tarda, o devuelve algo
// vacío/demasiado largo, no confiamos ciegamente — caemos a las primeras
// palabras significativas del texto original en vez de mandar prosa cruda
// a Apify o bloquear la búsqueda por completo.
function fallbackQuery(problem: string, solution?: string): string {
  const raw = solution?.trim() ? `${problem} ${solution}` : problem;
  const words = raw
    .replace(/[.,;:!?"']/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  return words.slice(0, MAX_DISTILLED_WORDS).join(" ");
}

function isUsableQuery(query: string): boolean {
  const wordCount = query.trim().split(/\s+/).filter(Boolean).length;
  return wordCount > 0 && wordCount <= MAX_DISTILLED_WORDS;
}

// Destila el texto en prosa del usuario a una query corta de búsqueda web,
// antes de llamar a Apify. Sin esto, Google no casa páginas contra frases
// conversacionales en primera persona y el motor reporta 0 candidatos
// aunque el problema sea real y tenga competidores indexables.
export async function distillSearchQuery(problem: string, solution?: string): Promise<string> {
  const fallback = fallbackQuery(problem, solution);
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    console.warn("DEEPSEEK_API_KEY no configurada; usando query de fallback:", fallback);
    return fallback;
  }

  try {
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
          { role: "user", content: buildUserMessage(problem, solution) },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      console.error(`Distillation request failed (${response.status}), usando fallback.`);
      return fallback;
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const distilled = data.choices?.[0]?.message?.content?.trim().replace(/^"|"$/g, "");

    console.log("Query original:", problem, solution ?? "");
    console.log("Query destilada:", distilled);

    if (distilled && isUsableQuery(distilled)) {
      return distilled;
    }

    console.warn("Query destilada inválida o vacía, usando fallback:", fallback);
    return fallback;
  } catch (error) {
    console.error("Distillation call failed, usando fallback:", error);
    return fallback;
  }
}
