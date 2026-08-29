# Contexto del proyecto — "Buscador de huecos" (hackathon, 12 horas)

## Qué estamos construyendo

Una herramienta que valida una idea de negocio contra evidencia real. El usuario mete un par **problema / solución** y la herramienta responde:

1. **3–5 players reales** que ya atacan ese problema, cada uno con una **fuente clickeable** (URL real, no inventada).
2. **Una línea por player** sobre dónde está funcionando (mercado, segmento o región).
3. **Un hueco concreto** que el usuario todavía podría ocupar.
4. **Cada afirmación etiquetada** como `confirmado con fuente` o `probable sin verificar`.

Eso es el producto completo. Nada más.

## El diferenciador (no perderlo de vista)

No competimos en "buscar competidores" ni en "criticar la idea" — eso ya existe (IdeaKiller, prompts de VC cínico en Forbes, Perplexity). Nuestro foso es la **honestidad sobre la confianza**: los prompts alucinan competidores con total seguridad y las apps son cajas negras. Nosotros mostramos fuentes verificables y etiquetamos el nivel de certeza de cada dato. Si un dato no tiene fuente, se marca como no verificado — nunca se disfraza de hecho.

**Regla dura:** ninguna URL inventada. Toda fuente sale de búsqueda web en vivo (Apify). Si no hay fuente, la afirmación es `probable sin verificar`.

## Alcance del hackathon — qué SÍ y qué NO

**SÍ (el único flujo que debe quedar impecable):**
- Input: problema + solución (dos campos de texto).
- Búsqueda web en vivo (Apify) → extracción de players (DeepSeek) → hueco → etiquetas de confianza.
- Resultados con fuentes clickeables.
- Auth mínima (Clerk) para que cada usuario vea sus búsquedas.

**NO (mencionar en la última slide como "lo siguiente", pero NO construir):**
- Análisis de presupuesto / free tiers / alternativas gratis.
- Recomendación de pivote elaborada más allá del "hueco concreto".
- Múltiples mercados, gráficos, dashboards.
- Voz (ElevenLabs) y búsqueda semántica sobre historial: quedan como stubs opcionales, no bloquean el core.

Si algo no está en la lista del SÍ, no se construye. Cinco features a medias pierden contra un flujo perfecto.

## Stack

- **BaaS: Convex** — base de datos + funciones backend (queries, mutations, actions).
- **Auth: Clerk** — integrado con Convex vía `ConvexProviderWithClerk` (ya cableado en `src/providers/AppProviders.tsx`).
- **Frontend:** React + Vite.
- **Búsqueda web:** Apify (`apify/google-search-scraper`, actor `nFJndFXA5zjCTuudP`) llamado desde una Convex action (`convex/apifySearch.ts`).
- **Extracción/razonamiento:** DeepSeek, llamado desde una Convex action, a partir de los resultados crudos de Apify.

### Detalle crítico de Convex que ahorra dolor

Las **queries y mutations de Convex son deterministas y NO pueden hacer `fetch` a APIs externas.** Toda llamada a Apify y a DeepSeek va en una **`action`** de Convex (con `"use node"` cuando haga falta). La action busca, procesa, y luego escribe el resultado en la base vía una mutation. No intentar hacer fetch dentro de una query — falla.

Patrón real implementado:
1. El usuario envía problema/solución (`InputPage`) → se crea un registro `validations` (mutation `create`) y se dispara una **action** (`runEvidenceSearch`).
2. La action llama a `scrapePlayersFromApify` (Apify, obtiene URLs reales) y luego a DeepSeek con esos resultados para extraer players consolidados + el hueco concreto.
3. La action valida qué afirmaciones tienen fuente real (`sourceUrl` de Apify) y asigna la etiqueta de confianza — DeepSeek nunca inventa una URL, solo resume/estructura sobre lo que Apify ya encontró.
4. La action guarda el resultado (`players` + `gap` + `status: "done"`) vía mutation.
5. El frontend lee el resultado con una **query** reactiva (`validations.get`), se actualiza sola.

### Auth con Clerk + Convex

- App envuelta con `ConvexProviderWithClerk` pasando `useAuth` de `@clerk/clerk-react` (`src/providers/AppProviders.tsx`).
- En las funciones de Convex, `ctx.auth.getUserIdentity()` da el usuario autenticado.
- Cada búsqueda se guarda con el `identity.subject` del usuario para que solo vea las suyas.

## Modelo de datos (Convex schema, ya implementado en `convex/schema.ts`)

```ts
export default defineSchema({
  validations: defineTable({
    userId: v.string(),
    problem: v.string(),
    solution: v.string(),
    status: v.union(v.literal("searching"), v.literal("done"), v.literal("error")),
    gap: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  players: defineTable({
    validationId: v.id("validations"),
    name: v.string(),
    whereItWorks: v.string(),
    sourceUrl: v.optional(v.string()),
    confidence: v.union(v.literal("confirmado"), v.literal("probable")),
  }).index("by_validation", ["validationId"]),
});
```

## Configuración de scraping con Apify

- Actor: `apify/google-search-scraper`, `actId`: `nFJndFXA5zjCTuudP`.
- Input base: `apify.google-search.input.json` — reemplazar `queries` con problema+solución del usuario antes de correr.
- Action: `convex/apifySearch.ts`, exporta `scrapePlayersFromApify({ query, maxPlayers? })`.
- Extrae de `organicResults`: `title`, `url`, `description`, `websiteTitle`. Dedupe por dominio, prioriza 3–5 con URL real.
- `confirmado`: tiene `sourceUrl` válido de `organicResults.url`. `probable`: sin URL válida.
- Add-ons de IA de Apify (Perplexity, ChatGPT, Gemini, AI Mode) desactivados — solo scraping crudo. La capa de razonamiento es DeepSeek, aparte.
- Variables de entorno (Convex, nunca en frontend): `APIFY_TOKEN`, `APIFY_ACTOR_ID`, `DEEPSEEK_API_KEY`.

## El momento de la demo (no olvidarlo)

Abrir la herramienta **contra sí misma en vivo**: meter "herramienta que valida ideas de negocio con data" como input y dejar que liste a IdeaKiller, CB Insights, Perplexity, etc. — con sus fuentes. Se autodiagnostica, es honesto y demuestra que funciona en el caso más difícil posible. Ese es el cierre.

## Primer objetivo de build

Que el flujo único corra de punta a punta con datos reales: input → action (Apify + DeepSeek) → players con fuentes → etiquetas de confianza → render. Auth y persistencia ya están. Nada de presupuesto/free tiers hasta que el core esté impecable.
