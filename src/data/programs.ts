/**
 * Programas de fidelidade e companhias.
 *
 * Os números aqui são ESTIMATIVAS de mercado usadas pelo motor de
 * recomendação na fase 1 (dados mock). Quando a camada de dados virar
 * API, estes valores passam a vir de uma tabela atualizável.
 */

export type AirlineId = "gol" | "latam" | "azul" | "other";
export type ProgramId = "smiles" | "latampass" | "tudoazul";
export type BankProgramId = "livelo" | "esfera" | "ailos";

export type Airline = {
  id: AirlineId;
  name: string;
  /** null para companhias sem programa mapeado */
  program: ProgramId | null;
  /** cor da marca, só para o logo-texto */
  color: string;
};

export const AIRLINES: Record<AirlineId, Airline> = {
  gol: { id: "gol", name: "GOL", program: "smiles", color: "#F26A21" },
  latam: { id: "latam", name: "LATAM", program: "latampass", color: "#E0004D" },
  azul: { id: "azul", name: "Azul", program: "tudoazul", color: "#1C56A5" },
  other: { id: "other", name: "Outra cia", program: null, color: "#64748b" },
};

export type Program = {
  id: ProgramId;
  name: string;
  airline: AirlineId;
  /** Valor de referência do milheiro (R$ por 1.000 milhas). Acima disso, usar milhas compensa. */
  referenceValuePer1000: number;
  /** Quanto uma agência costuma pagar pelo milheiro na venda (R$). Piso do valor da milha. */
  sellValuePer1000: number;
  color: string;
};

export const PROGRAMS: Record<ProgramId, Program> = {
  smiles: {
    id: "smiles",
    name: "Smiles",
    airline: "gol",
    referenceValuePer1000: 22,
    sellValuePer1000: 16,
    color: "#F26A21",
  },
  latampass: {
    id: "latampass",
    name: "LATAM Pass",
    airline: "latam",
    referenceValuePer1000: 25,
    sellValuePer1000: 18,
    color: "#E0004D",
  },
  tudoazul: {
    id: "tudoazul",
    name: "TudoAzul",
    airline: "azul",
    referenceValuePer1000: 23,
    sellValuePer1000: 17,
    color: "#1C56A5",
  },
};

export type BankProgram = {
  id: BankProgramId;
  name: string;
  /** Preço cheio de compra de pontos (R$ por 1.000). */
  buyPricePer1000: number;
  /** Preço típico em promoção de compra (R$ por 1.000). */
  promoBuyPricePer1000: number;
};

export const BANK_PROGRAMS: Record<BankProgramId, BankProgram> = {
  livelo: { id: "livelo", name: "Livelo", buyPricePer1000: 70, promoBuyPricePer1000: 35 },
  esfera: { id: "esfera", name: "Esfera", buyPricePer1000: 70, promoBuyPricePer1000: 38 },
  ailos: { id: "ailos", name: "Ailos", buyPricePer1000: 65, promoBuyPricePer1000: 40 },
};

export type TransferBonus = {
  id: string;
  from: BankProgramId;
  to: ProgramId;
  /** 0.8 = 80% de bônus (1.000 pontos viram 1.800 milhas). */
  bonus: number;
  /** ISO date (inclusive). */
  until: string;
  /** Condição em linguagem simples. */
  note?: string;
};

/** Promoções ativas (mock). Na fase 2 vem de monitoramento de Livelo/Esfera + blogs. */
export const TRANSFER_BONUSES: TransferBonus[] = [
  { id: "lv-sm-1", from: "livelo", to: "smiles", bonus: 0.8, until: "2026-10-22", note: "Clube Smiles ganha +10%" },
  { id: "es-lp-1", from: "esfera", to: "latampass", bonus: 1.0, until: "2026-10-16", note: "Mínimo de 5.000 pontos" },
  { id: "lv-ta-1", from: "livelo", to: "tudoazul", bonus: 0.6, until: "2026-10-31" },
  { id: "lv-lp-1", from: "livelo", to: "latampass", bonus: 0.3, until: "2026-11-05" },
];

export const CABINS = [
  { id: "economy", label: "Econômica" },
  { id: "premium", label: "Econômica Premium" },
  { id: "business", label: "Executiva" },
] as const;
export type CabinId = (typeof CABINS)[number]["id"];

export const CABIN_MULTIPLIER: Record<CabinId, number> = {
  economy: 1,
  premium: 1.8,
  business: 3.4,
};
