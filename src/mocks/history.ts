import type { ValidationSummary } from "./types";

export const MOCK_HISTORY: ValidationSummary[] = [
  {
    _id: "mock-1",
    problem: "Los equipos remotos pierden contexto entre reuniones y docs",
    solution: "Un asistente que resume decisiones y las liga a la tarea correspondiente",
    status: "done",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    _id: "mock-2",
    problem: "Las pymes no saben si su precio está por debajo del mercado",
    solution: "Un comparador de precios en tiempo real por categoría e industria",
    status: "done",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
  {
    _id: "mock-3",
    problem: "Los freelancers pierden horas armando propuestas desde cero",
    solution: "Generador de propuestas a partir de un brief corto del cliente",
    status: "done",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 9,
  },
];

export function formatRelativeDate(timestamp: number): string {
  const days = Math.round((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Hoy";
  if (days === 1) return "Hace 1 día";
  return `Hace ${days} días`;
}
