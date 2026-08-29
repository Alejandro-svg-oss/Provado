# Configuracion de scraping con Apify (solo esta parte)

Este repositorio deja definida la configuracion para usar **solo scraping web** con el actor:

- Actor: `apify/google-search-scraper`
- `actId`: `nFJndFXA5zjCTuudP`

## Archivo de configuracion

Usar el archivo `apify.google-search.input.json` como base de input para cada corrida.

Regla: antes de ejecutar, reemplazar `queries` con el texto del problema/solucion enviado por el usuario.

## Action de Convex ya incluida en el repo

Archivo: `convex/apifySearch.ts`

Exporta:

- `scrapePlayersFromApify`

Argumentos:

- `query: string` (obligatorio)
- `maxPlayers?: number` (opcional, default 5)

Retorna:

- `players[]` deduplicados por dominio con:
  - `name`
  - `whereItWorks`
  - `sourceUrl`
  - `confidence` (`confirmado` o `probable`)

## Nota adicional

Para una integracion separada de **solo transcripcion de voz** con Vapi, ver:

- `CLAUDE_VAPI_TRANSCRIPCION.md`

## Objetivo del output

Extraer de `organicResults`:

- `title`
- `url`
- `description`
- `websiteTitle`

Priorizar 3-5 players con URL real (`http` o `https`) y deduplicar por dominio.

## Reglas de confianza

- `confirmado con fuente`: el dato tiene `sourceUrl` valido proveniente de `organicResults.url`.
- `probable sin verificar`: afirmacion sin URL valida directa.

## Reglas de alcance (hackathon)

- Solo scraping y evidencias con fuente clickeable.
- No usar add-ons de IA dentro de Apify para este flujo (`Perplexity`, `ChatGPT`, `Gemini`, `AI Mode` desactivados).
- No hacer enriquecimiento de leads ni scraping de contenido completo de sitios.

## Variables recomendadas (no hardcodear secretos)

Definir en entorno:

- `APIFY_TOKEN`
- `APIFY_ACTOR_ID=nFJndFXA5zjCTuudP`

No commitear tokens reales en el repositorio.
