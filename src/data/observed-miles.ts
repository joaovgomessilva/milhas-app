/**
 * Milhas OBSERVADAS à mão em fontes públicas (calendários dos programas, Trip Milhas, blogs).
 * Têm prioridade sobre a estimativa no provider de produção e carregam a fonte e a data.
 * Mantida manualmente na fase 2; vira tabela em banco quando houver backend.
 *
 * Convenção: só ida, por passageiro, econômica, tarifa padrão do programa
 * (Smiles: tarifa Clube/Diamante, que é a que o Trip Milhas mostra).
 */
import type { ProgramId } from "./programs";

export type ObservedMiles = {
  from: string;
  to: string;
  date: string; // YYYY-MM-DD
  program: ProgramId;
  miles: number;
  taxes: number;
  source: string;
  seenAt: string; // YYYY-MM-DD
};

const SRC = "Trip Milhas (calendário Smiles, tarifa Clube/Diamante)";
const SEEN = "2026-10-11";
const TAX = 44.9;

function series(from: string, to: string, month: string, values: Record<number, number>): ObservedMiles[] {
  return Object.entries(values).map(([d, miles]) => ({
    from, to, date: `${month}-${String(d).padStart(2, "0")}`, program: "smiles", miles, taxes: TAX, source: SRC, seenAt: SEEN,
  }));
}

export const OBSERVED_MILES: ObservedMiles[] = [
  // GRU → FOR, dezembro de 2026 (ida)
  ...series("GRU", "FOR", "2026-12", {
    1: 50000, 2: 37700, 3: 74700, 4: 74700, 5: 87700, 6: 74700, 7: 74700, 8: 74700, 9: 50000, 10: 74700,
    11: 87700, 12: 87700, 13: 87700, 14: 87700, 15: 94800, 16: 50000, 17: 87200, 18: 87200, 19: 87200, 20: 87200,
    21: 87200, 22: 87200, 23: 97800, 24: 97800, 25: 124600, 26: 108300, 27: 118300, 28: 87200, 29: 97800, 30: 87200, 31: 50000,
  }),
  // FOR → GRU, janeiro de 2027 (volta)
  ...series("FOR", "GRU", "2027-01", {
    1: 87200, 2: 97800, 3: 154100, 4: 87200, 5: 87200, 6: 87200, 7: 94800, 8: 87200, 9: 87200, 10: 50000,
    11: 87200, 12: 50000, 13: 50000, 14: 94800, 15: 87200, 16: 74700, 17: 37700, 18: 74700, 19: 37700, 20: 37700,
    21: 50000, 22: 37700, 23: 50000, 24: 74700, 25: 37700, 26: 37700, 27: 50000, 28: 37700, 29: 37700, 30: 37700, 31: 74700,
  }),
];

const index = new Map<string, ObservedMiles[]>();
for (const o of OBSERVED_MILES) {
  const k = `${o.from}-${o.to}-${o.date}`;
  index.set(k, [...(index.get(k) ?? []), o]);
}

export const observedFor = (from: string, to: string, date: string) => index.get(`${from}-${to}-${date}`) ?? [];
export const hasObservedRoute = (from: string, to: string) => OBSERVED_MILES.some((o) => o.from === from && o.to === to);
