"use client";

import type { CabinId, ProgramId } from "@/data/programs";
import { useLocalValue } from "./local-store";
import type { PriceProvider } from "./providers/types";
import { shiftMonth } from "./format";

/**
 * Alertas de preço por rota, com datas flexíveis e histórico do menor preço visto.
 * Resposta às reclamações "poucos alertas", "só data fixa", "quero histórico do mais barato".
 * Fase 1: verificação roda no aparelho quando a aba Alertas abre. Fase 2: backend + push.
 */
export type Alert = {
  id: string;
  from: string;
  to: string;
  /** "YYYY-MM" para um mês específico ou "any" para os próximos 6 meses */
  month: string | "any";
  passengers: number;
  cabin: CabinId;
  programs: ProgramId[];
  /** avisar quando o menor preço em R$ ficar abaixo disso (0 = ignorar) */
  maxCash: number;
  /** avisar quando a menor emissão em milhas ficar abaixo disso (0 = ignorar) */
  maxMiles: number;
  createdAt: string;
  lastCheckedAt?: string;
  /** histórico: o menor valor já visto desde a criação */
  bestCash?: { value: number; date: string; seenAt: string };
  bestMiles?: { value: number; program: ProgramId; date: string; seenAt: string };
  /** último resultado da verificação */
  current?: { minCash: number | null; minMiles: number | null; minMilesProgram?: ProgramId; cashDate?: string; milesDate?: string };
};

type Store = { alerts: Alert[] };
const KEY = "milhas-app:alerts:v1";
const EMPTY: Store = { alerts: [] };

export function useAlerts() {
  const [store, set, loaded] = useLocalValue<Store>(KEY, EMPTY);
  return {
    alerts: store.alerts,
    loaded,
    add(a: Omit<Alert, "id" | "createdAt">) {
      const alert: Alert = { ...a, id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, createdAt: new Date().toISOString() };
      set({ alerts: [alert, ...store.alerts] });
      return alert;
    },
    remove(id: string) {
      set({ alerts: store.alerts.filter((a) => a.id !== id) });
    },
    replaceAll(alerts: Alert[]) {
      set({ alerts });
    },
  };
}

export function alertTriggered(a: Alert) {
  if (!a.current) return false;
  const cashHit = a.maxCash > 0 && a.current.minCash != null && a.current.minCash <= a.maxCash;
  const milesHit = a.maxMiles > 0 && a.current.minMiles != null && a.current.minMiles <= a.maxMiles;
  return cashHit || milesHit;
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Verifica um alerta contra o provider e devolve a cópia atualizada (não grava). */
export async function checkAlert(a: Alert, provider: PriceProvider): Promise<Alert> {
  const months = a.month === "any" ? Array.from({ length: 6 }, (_, i) => shiftMonth(currentMonth(), i)) : [a.month];
  let minCash: number | null = null;
  let cashDate: string | undefined;
  let minMiles: number | null = null;
  let minMilesProgram: ProgramId | undefined;
  let milesDate: string | undefined;

  for (const month of months) {
    const { days } = await provider.getCalendar({ from: a.from, to: a.to, month, passengers: a.passengers, cabin: a.cabin });
    for (const d of days) {
      if (d.minCash != null && (minCash == null || d.minCash < minCash)) { minCash = d.minCash; cashDate = d.date; }
      const m = d.miles.filter((x) => a.programs.includes(x.program)).sort((x, y) => x.miles - y.miles)[0];
      if (m && (minMiles == null || m.miles < minMiles)) { minMiles = m.miles; minMilesProgram = m.program; milesDate = d.date; }
    }
  }

  const seenAt = new Date().toISOString();
  const bestCash = minCash != null && (!a.bestCash || minCash < a.bestCash.value) ? { value: minCash, date: cashDate!, seenAt } : a.bestCash;
  const bestMiles = minMiles != null && (!a.bestMiles || minMiles < a.bestMiles.value) ? { value: minMiles, program: minMilesProgram!, date: milesDate!, seenAt } : a.bestMiles;

  return { ...a, lastCheckedAt: seenAt, bestCash, bestMiles, current: { minCash, minMiles, minMilesProgram, cashDate, milesDate } };
}
