/**
 * Provider de preços MOCK.
 *
 * Gera preços determinísticos (mesma busca → mesmos números) com um
 * gerador pseudoaleatório semeado pela rota e pela data, calibrado em
 * faixas realistas do mercado brasileiro. Serve para validar UX e o
 * motor de recomendação. Será substituído por Duffel/Google Flights
 * (dinheiro) e por fontes de milhas na fase 2, sem mudar as telas.
 */
import { airportByCode, distanceKm } from "@/data/airports";
import {
  AIRLINES,
  CABIN_MULTIPLIER,
  PROGRAMS,
  type AirlineId,
  type ProgramId,
} from "@/data/programs";
import type { CalendarResult, DayPrice, ExploreDestination, ExploreQuery, Flight, MilesFare, PriceMeta, PriceProvider, RouteInsight, SearchQuery } from "./types";
import { AIRPORTS } from "@/data/airports";
import type { CabinId } from "@/data/programs";

// ---------- util ----------
function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pad = (n: number) => String(n).padStart(2, "0");
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const roundTo = (v: number, step: number) => Math.round(v / step) * step;

const HOLIDAYS = new Set([
  "2026-11-02", "2026-11-15", "2026-11-20", "2026-12-24", "2026-12-25", "2026-12-31",
  "2027-01-01", "2027-02-15", "2027-02-16", "2027-02-17", "2027-04-02", "2027-04-21", "2027-05-01",
]);

// ---------- modelo de preço ----------
type RouteModel = {
  international: boolean;
  baseCash: number;
  taxes: number;
  airlines: AirlineId[];
  durationMin: number;
};

function routeModel(from: string, to: string): RouteModel | null {
  const a = airportByCode(from);
  const b = airportByCode(to);
  if (!a || !b || a.code === b.code) return null;
  const km = distanceKm(a, b);
  const international = a.country === "INTL" || b.country === "INTL";
  const baseCash = international ? 900 + km * 0.28 : 130 + km * 0.26;
  const taxes = international ? 260 + km * 0.02 : 44.9;
  const airlines: AirlineId[] = international
    ? km > 6000
      ? ["latam", "azul"]
      : ["latam", "gol", "azul"]
    : ["gol", "latam", "azul"];
  const durationMin = Math.round(40 + km / 13);
  return { international, baseCash, taxes, airlines, durationMin };
}

function dayFactor(date: Date, today: Date) {
  const dow = date.getDay();
  let f = 1;
  if (dow === 5 || dow === 0) f *= 1.22; // sexta e domingo
  if (dow === 6) f *= 1.05;
  if (dow === 2 || dow === 3) f *= 0.88; // terça e quarta
  const iso = toISO(date);
  if (HOLIDAYS.has(iso)) f *= 1.45;
  const m = date.getMonth();
  if (m === 0 || m === 11 || m === 6) f *= 1.18; // férias
  const daysAhead = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (daysAhead < 7) f *= 1.6;
  else if (daysAhead < 21) f *= 1.25;
  else if (daysAhead > 120) f *= 0.95;
  return f;
}

/** "Preço" implícito do milheiro naquele dia para aquele programa (R$ por 1.000). Dias de promo caem. */
function milesRatePer1000(program: ProgramId, r: () => number) {
  const ref = PROGRAMS[program].referenceValuePer1000;
  const roll = r();
  if (roll < 0.12) return ref * 1.9; // dia bom para milhas (muitas milhas valem pouco → espera, invertido abaixo)
  if (roll < 0.35) return ref * 1.3;
  if (roll < 0.8) return ref * 0.95;
  return ref * 0.6; // dia ruim: emissão cara em milhas
}

function buildDay(q: SearchQuery, model: RouteModel, date: Date, today: Date): DayPrice {
  const iso = toISO(date);
  const r = rng(hash(`${q.from}-${q.to}-${iso}-${q.cabin}`));
  const cabin = CABIN_MULTIPLIER[q.cabin];
  const f = dayFactor(date, today) * cabin;
  const cash = model.airlines.map((airline) => {
    const spread = 0.82 + r() * 0.5;
    return { airline, price: roundTo(model.baseCash * f * spread, model.international ? 10 : 1) };
  });
  const miles: MilesFare[] = model.airlines.map((airline) => {
    const program = AIRLINES[airline].program!;
    const c = cash.find((x) => x.airline === airline)!.price;
    // milhas = preço em dinheiro / (R$ por milha). Dias "bons" têm rate alto → menos milhas.
    const rate = milesRatePer1000(program, r);
    return {
      program,
      airline,
      miles: roundTo((c / rate) * 1000, 100),
      taxes: Math.round(model.taxes * cabin * 100) / 100,
    };
  });
  const minCash = Math.min(...cash.map((c) => c.price));
  const minMiles = miles.reduce((best, m) => (!best || m.miles < best.miles ? m : best), null as MilesFare | null);
  return { date: iso, minCash, minMiles, cash, miles };
}

/**
 * Estimativa de milhas a partir de um preço real em dinheiro.
 * Usada pelo provider de produção enquanto não há fonte real de milhas.
 * Determinística por rota/dia/companhia, calibrada pelos valores de referência.
 */
export function estimateMilesForCash(from: string, to: string, date: string, cabin: CabinId, airline: Exclude<AirlineId, "other">, cash: number): MilesFare | null {
  const model = routeModel(from, to);
  if (!model) return null;
  const program = AIRLINES[airline].program!;
  const r = rng(hash(`est-${from}-${to}-${date}-${program}`));
  // sobre um preço real, variação mais contida que no mock puro: ±20% em torno da referência
  const rate = PROGRAMS[program].referenceValuePer1000 * (0.85 + r() * 0.4);
  const taxes = Math.round(model.taxes * CABIN_MULTIPLIER[cabin] * 100) / 100;
  return { program, airline, miles: roundTo(((cash - taxes) / rate) * 1000, 100), taxes };
}

export class MockPriceProvider implements PriceProvider {
  constructor(private today = new Date()) {}

  private meta(): PriceMeta {
    return { source: "Dados de teste", checkedAt: new Date().toISOString(), status: "ok" };
  }

  async getCalendar(q: SearchQuery): Promise<CalendarResult> {
    const model = routeModel(q.from, q.to);
    const [y, m] = q.month.split("-").map(Number);
    const days: DayPrice[] = [];
    const last = new Date(y, m, 0).getDate();
    const t0 = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());
    for (let d = 1; d <= last; d++) {
      const date = new Date(y, m - 1, d);
      const iso = toISO(date);
      if (!model || date < t0) {
        days.push({ date: iso, minCash: null, minMiles: null, cash: [], miles: [] });
      } else {
        days.push(buildDay(q, model, date, t0));
      }
    }
    await sleep(350);
    return { days, meta: this.meta() };
  }

  async getFlights(q: SearchQuery, date: string): Promise<Flight[]> {
    const model = routeModel(q.from, q.to);
    if (!model) return [];
    const [y, m, d] = date.split("-").map(Number);
    const t0 = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());
    const day = buildDay(q, model, new Date(y, m - 1, d), t0);
    const r = rng(hash(`flights-${q.from}-${q.to}-${date}`));
    const flights: Flight[] = [];
    const meta = this.meta();
    for (const airline of model.airlines) {
      const base = day.cash.find((c) => c.airline === airline)!.price;
      const mf = day.miles.find((x) => x.airline === airline) ?? null;
      const n = 2 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) {
        const depH = 5 + Math.floor(r() * 17);
        const depM = [0, 15, 30, 45][Math.floor(r() * 4)];
        const stops = r() < (model.international ? 0.45 : 0.25) ? 1 : 0;
        const dur = model.durationMin + (stops ? 90 + Math.floor(r() * 120) : 0);
        const arr = depH * 60 + depM + dur;
        const spread = i === 0 ? 1 : 1 + r() * 0.35;
        const cash = roundTo(base * spread, 1);
        flights.push({
          id: `${airline}-${date}-${i}`,
          airline,
          departure: `${pad(depH)}:${pad(depM)}`,
          arrival: `${pad(Math.floor(arr / 60) % 24)}:${pad(arr % 60)}`,
          durationMin: dur,
          stops,
          cash,
          miles: mf ? { ...mf, miles: roundTo(mf.miles * spread, 100) } : null,
          meta,
        });
      }
    }
    await sleep(250);
    return flights.sort((a, b) => a.cash - b.cash);
  }

  async getExplore(q: ExploreQuery) {
    const months = q.month === "any" ? monthsFrom(this.today, 6) : [q.month];
    const destinations: ExploreDestination[] = [];
    const origin = airportByCode(q.from);
    for (const a of AIRPORTS) {
      if (a.code === q.from || !origin || distanceKm(origin, a) < 150) continue; // mesma região metropolitana
      const days = scanDays({ from: q.from, to: a.code, month: months[0], passengers: q.passengers, cabin: q.cabin }, months, this.today);
      if (!days.length) continue;
      let minCash = Infinity, cashDate = "";
      let minMiles: MilesFare | null = null, milesDate: string | null = null;
      for (const d of days) {
        if (d.minCash != null && d.minCash < minCash) { minCash = d.minCash; cashDate = d.date; }
        if (d.minMiles && (!minMiles || d.minMiles.miles < minMiles.miles)) { minMiles = d.minMiles; milesDate = d.date; }
      }
      if (minCash === Infinity) continue;
      destinations.push({ to: a.code, minCash, cashDate, minMiles, milesDate });
    }
    await sleep(400);
    return { destinations: destinations.sort((a, b) => a.minCash - b.minCash), meta: this.meta() };
  }

  async getRouteInsight(from: string, to: string, cabin: CabinId): Promise<RouteInsight> {
    const months = monthsFrom(this.today, 6);
    const days = scanDays({ from, to, month: months[0], passengers: 1, cabin }, months, this.today);
    const cash = days.map((d) => d.minCash).filter((x): x is number => x != null).sort((a, b) => a - b);
    const miles = days.map((d) => d.minMiles?.miles).filter((x): x is number => x != null).sort((a, b) => a - b);
    // histórico mock: caminhada aleatória determinística em torno da mediana, últimos 30 dias
    const r = rng(hash(`hist-${from}-${to}-${cabin}`));
    const medCash = pct(cash, 0.5), medMiles = pct(miles, 0.5);
    let c = medCash * (0.9 + r() * 0.3), m = medMiles * (0.9 + r() * 0.3);
    const history: RouteInsight["history"] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(this.today); d.setDate(d.getDate() - i);
      c = Math.max(medCash * 0.6, Math.min(medCash * 1.6, c * (0.94 + r() * 0.12)));
      m = Math.max(medMiles * 0.6, Math.min(medMiles * 1.6, m * (0.94 + r() * 0.12)));
      history.push({ date: toISO(d), cash: Math.round(c), miles: roundTo(m, 100) });
    }
    await sleep(150);
    return { typicalLow: pct(cash, 0.25), typicalHigh: pct(cash, 0.75), typicalMilesLow: pct(miles, 0.25), typicalMilesHigh: pct(miles, 0.75), history, meta: this.meta() };
  }
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

function monthsFrom(today: Date, n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  });
}

/** Percorre todos os dias futuros dos meses pedidos sem o sleep artificial. */
function scanDays(q: SearchQuery, months: string[], today: Date): DayPrice[] {
  const model = routeModel(q.from, q.to);
  if (!model) return [];
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const out: DayPrice[] = [];
  for (const month of months) {
    const [y, m] = month.split("-").map(Number);
    const last = new Date(y, m, 0).getDate();
    for (let d = 1; d <= last; d++) {
      const date = new Date(y, m - 1, d);
      if (date < t0) continue;
      out.push(buildDay(q, model, date, t0));
    }
  }
  return out;
}

const pct = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;

export const priceProvider: PriceProvider = new MockPriceProvider();
