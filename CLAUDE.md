# Configuracion de scraping con Apify (solo esta parte)

Este repositorio deja definida la configuracion para usar **solo scraping web** con el actor:

- Actor: `apify/google-search-scraper`
- `actId`: `nFJndFXA5zjCTuudP`

## Archivo de configuracion

Usar el archivo `apify.google-search.input.json` como base de input para cada corrida.

Regla: antes de ejecutar, reemplazar `queries` con el texto del problema/solucion enviado por el usuario.

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
