"use client";

import { useLocalValue } from "./local-store";

/**
 * "Preço diferente? Avise." Guarda localmente na fase 1; na fase 2 vai para o backend
 * e alimenta a confiança de cada fonte. Resposta à reclamação "o preço não existe na companhia".
 */
export type PriceReport = {
  id: string;
  flightId: string;
  route: string;
  date: string;
  shownCash: number;
  shownMiles: number | null;
  kind: "higher" | "lower" | "unavailable";
  createdAt: string;
};

type Store = { reports: PriceReport[] };
const KEY = "milhas-app:reports:v1";
const EMPTY: Store = { reports: [] };

export function useReports() {
  const [store, set] = useLocalValue<Store>(KEY, EMPTY);
  return {
    reports: store.reports,
    hasReported: (flightId: string) => store.reports.some((r) => r.flightId === flightId),
    add(r: Omit<PriceReport, "id" | "createdAt">) {
      set({ reports: [{ ...r, id: `${Date.now().toString(36)}`, createdAt: new Date().toISOString() }, ...store.reports].slice(0, 200) });
    },
  };
}
