export type Confidence = "confirmado" | "probable";

export interface Player {
  name: string;
  whereItWorks: string;
  sourceUrl?: string;
  confidence: Confidence;
}

export interface ValidationSummary {
  _id: string;
  problem: string;
  solution: string;
  status: "searching" | "done" | "error";
  createdAt: number;
}

export interface ValidationDetail extends ValidationSummary {
  gap: string;
  players: Player[];
}
