import type { Player } from "./types";

export const MOCK_PLAYERS: Player[] = [
  {
    name: "Notion",
    whereItWorks: "Workspaces de equipos pequeños que centralizan docs y tareas",
    sourceUrl: "https://www.notion.so/product",
    confidence: "confirmado",
  },
  {
    name: "Coda",
    whereItWorks: "Equipos de producto que combinan docs con bases de datos ligeras",
    sourceUrl: "https://coda.io/product",
    confidence: "confirmado",
  },
  {
    name: "Airtable",
    whereItWorks: "Operaciones internas que necesitan una base de datos sin código",
    sourceUrl: "https://www.airtable.com/product",
    confidence: "confirmado",
  },
  {
    name: "Glide",
    whereItWorks: "Founders no técnicos armando MVPs internos rápido",
    confidence: "probable",
  },
  {
    name: "Retool interno",
    whereItWorks: "Equipos de ingeniería con herramientas internas ad hoc",
    confidence: "probable",
  },
];

export const MOCK_GAP =
  "Ningún player ofrece una vista unificada de confianza por dato: todos mezclan fuentes verificadas y suposiciones sin distinguirlas visualmente.";
