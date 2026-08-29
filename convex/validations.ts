import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";

// Datos mock realistas para que el cascarón se vea completo sin backend.
const MOCK_PLAYERS = [
  {
    name: "Notion",
    whereItWorks: "Workspaces de equipos pequeños que centralizan docs y tareas",
    sourceUrl: "https://www.notion.so/product",
    confidence: "confirmado" as const,
  },
  {
    name: "Coda",
    whereItWorks: "Equipos de producto que combinan docs con bases de datos ligeras",
    sourceUrl: "https://coda.io/product",
    confidence: "confirmado" as const,
  },
  {
    name: "Airtable",
    whereItWorks: "Operaciones internas que necesitan una base de datos sin código",
    sourceUrl: "https://www.airtable.com/product",
    confidence: "confirmado" as const,
  },
  {
    name: "Glide",
    whereItWorks: "Founders no técnicos armando MVPs internos rápido",
    sourceUrl: undefined,
    confidence: "probable" as const,
  },
  {
    name: "Retool interno",
    whereItWorks: "Equipos de ingeniería con herramientas internas ad hoc",
    sourceUrl: undefined,
    confidence: "probable" as const,
  },
];

const MOCK_GAP =
  "Ningún player ofrece una vista unificada de confianza por dato: todos mezclan fuentes verificadas y suposiciones sin distinguirlas visualmente.";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // TODO(apify): en producción, players y scrapedSources vienen de la tabla real.
    // Aquí devolvemos datos mock para no depender del backend en el cascarón.
    return MOCK_HISTORY;
  },
});

export const get = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    // TODO(apify): reemplazar por lectura real de `validations` + `players` por id.
    return {
      _id: id,
      problem: "Los equipos remotos pierden contexto entre reuniones y docs",
      solution: "Un asistente que resume decisiones y las liga a la tarea correspondiente",
      status: "done" as const,
      gap: MOCK_GAP,
      createdAt: Date.now(),
      players: MOCK_PLAYERS,
    };
  },
});

export const create = mutation({
  args: { problem: v.string(), solution: v.string() },
  handler: async (ctx, { problem, solution }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const validationId = await ctx.db.insert("validations", {
      userId: identity.subject,
      problem,
      solution,
      status: "searching",
      createdAt: Date.now(),
    });

    // TODO(deepseek): disparar aquí la action que extrae players y decide
    // confirmado/probable a partir de las fuentes scrapeadas por Apify.
    return validationId;
  },
});

// TODO(deepseek): la extracción de players y la decisión confirmado/probable
// ocurre en una Convex ACTION (no en query/mutation), porque llama a un LLM externo.
export const runEvidenceSearch = action({
  args: { validationId: v.id("validations") },
  handler: async (_ctx, { validationId: _validationId }) => {
    // Stub: en producción esta action llama a DeepSeek con las fuentes de
    // `scrapedSources` (escritas por el pipeline de Apify) y escribe los
    // resultados en `players`, marcando cada uno confirmado/probable.
    return null;
  },
});

const MOCK_HISTORY = [
  {
    _id: "mock-1",
    problem: "Los equipos remotos pierden contexto entre reuniones y docs",
    solution: "Un asistente que resume decisiones y las liga a la tarea correspondiente",
    status: "done" as const,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    _id: "mock-2",
    problem: "Las pymes no saben si su precio está por debajo del mercado",
    solution: "Un comparador de precios en tiempo real por categoría e industria",
    status: "done" as const,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
  {
    _id: "mock-3",
    problem: "Los freelancers pierden horas armando propuestas desde cero",
    solution: "Generador de propuestas a partir de un brief corto del cliente",
    status: "done" as const,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 9,
  },
];
