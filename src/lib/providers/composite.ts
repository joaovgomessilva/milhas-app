/**
 * Provider de produção (servidor): dinheiro real da Aviasales, milhas ESTIMADAS
 * a partir do preço em dinheiro até existir fonte real de milhas.
 * Sem token configurado, cai no mock inteiro.
 */
import "server-only";

import { airportByCode, distanceKm } from "@/data/airports";
import { AIRLINES, PROGRAMS } from "@/data/programs";
import { hasObservedRoute, observedFor } from "@/data/observed-miles";
import type { AirlineId, CabinId } from "@/data/programs";
import { MockPriceProvider, estimateMilesForCash } from "./mock";
import { aviasalesUrl, cheapestPerDay, faresForDay, hasTravelpayouts, latestFromOrigin, type TpFare } from "./travelpayouts";
import type { CalendarResult, DayPrice, ExploreDestination, ExploreQuery, Flight, MilesFare, PriceMeta, PriceProvider, RouteInsight, SearchQuery } from "./types";

const CODE_TO_AIRLINE: Record<string, AirlineId> = { G3: "gol", LA: "latam", JJ: "latam", AD: "azul" };
const CITY_TO_AIRPORT: Record<string, string> = { SAO: "GRU", RIO: "GIG", BUE: "EZE", NYC: "JFK", MIA: "MIA", LIS: "LIS", MAD: "MAD", SCL: "SCL", MVD: "MVD", ORL: "MCO" };

const pad = (n: number) => String(n).padStart(2, "0");
function monthsFrom(n: number) {
  const t = new Date();
  return Array.from({ length: n }, (_, i) => { const d = new Date(t.getFullYear(), t.getMonth() + i, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; });
}
const meta = (from?: string, to?: string): PriceMeta => ({
  source: from && to && hasObservedRoute(from, to) ? "Dinheiro: Aviasales (cache) · Milhas: observadas + estimativa" : "Dinheiro: Aviasales (cache) · Milhas: estimativa",
  checkedAt: new Date().toISOString(),
  status: "ok",
});

/** Milhas de um dia: observadas (fonte pública, à mão) têm prioridade; estimativa cobre o resto. */
function milesForDay(q: { from: string; to: string; cabin: CabinId }, date: string, cashByAirline: { airline: AirlineId; price: number }[]): MilesFare[] {
  const out: MilesFare[] = observedFor(q.from, q.to, date).map((o) => ({
    program: o.program, airline: PROGRAMS[o.program].airline, miles: o.miles, taxes: o.taxes, kind: "observed", source: o.source, seenAt: o.seenAt,
  }));
  for (const c of cashByAirline) {
    const program = c.airline === "other" ? null : AIRLINES[c.airline].program;
    if (!program || out.some((m) => m.program === program)) continue;
    const est = milesFor(q, date, c.airline, c.price);
    if (est) out.push(est);
  }
  return out.sort((a, b) => a.miles - b.miles);
}

function milesFor(q: { from: string; to: string; cabin: CabinId }, date: string, airline: AirlineId, cash: number): MilesFare | null {
  if (airline === "other") return null;
  return estimateMilesForCash(q.from, q.to, date, q.cabin, airline, cash);
}

function dayFromFare(q: SearchQuery, date: string, fare: TpFare | undefined): DayPrice {
  const airline = fare ? (CODE_TO_AIRLINE[fare.airline] ?? "other") : "other";
  const cash = fare ? [{ airline, price: fare.price, airlineName: airline === "other" ? fare.airline : undefined }] : [];
  const miles = milesForDay(q, date, cash);
  return { date, minCash: fare ? fare.price : null, minMiles: miles[0] ?? null, cash, miles };
}

class CompositeProvider implements PriceProvider {
  private mock = new MockPriceProvider();

  async getCalendar(q: SearchQuery): Promise<CalendarResult> {
    const byDay = await cheapestPerDay(q.from, q.to, q.month);
    const [y, m] = q.month.split("-").map(Number);
    const last = new Date(y, m, 0).getDate();
    const days: DayPrice[] = [];
    for (let d = 1; d <= last; d++) {
      const date = `${q.month}-${pad(d)}`;
      days.push(dayFromFare(q, date, byDay[date]));
    }
    return { days, meta: meta(q.from, q.to) };
  }

  async getFlights(q: SearchQuery, date: string): Promise<Flight[]> {
    const fares = await faresForDay(q.from, q.to, date);
    const mt = meta(q.from, q.to);
    const observed = observedFor(q.from, q.to, date);
    return fares.map((f, i) => {
      const airline = CODE_TO_AIRLINE[f.airline] ?? "other";
      // horário local do voo vem no ISO com fuso; usamos o texto para não depender do fuso do servidor
      const depText = f.departureAt.slice(11, 16) || "00:00";
      const arrMin = (Number(depText.slice(0, 2)) * 60 + Number(depText.slice(3, 5)) + f.durationMin) % 1440;
      return {
        id: `tp-${f.airline}-${date}-${i}`,
        airline,
        airlineName: airline === "other" ? f.airline : undefined,
        departure: depText,
        arrival: `${pad(Math.floor(arrMin / 60))}:${pad(arrMin % 60)}`,
        durationMin: f.durationMin,
        stops: f.transfers,
        cash: f.price,
        miles: (() => {
          const program = airline === "other" ? null : AIRLINES[airline].program;
          const o = observed.find((x) => x.program === program);
          if (o) return { program: o.program, airline, miles: o.miles, taxes: o.taxes, kind: "observed" as const, source: o.source, seenAt: o.seenAt };
          return milesFor(q, date, airline, f.price);
        })(),
        bookingUrl: aviasalesUrl(f.link),
        meta: mt,
      };
    });
  }

  async getExplore(q: ExploreQuery) {
    const months = q.month === "any" ? monthsFrom(6) : [q.month];
    const origin = airportByCode(q.from);
    const best = new Map<string, ExploreDestination>();
    for (const month of months) {
      const list = await latestFromOrigin(q.from, month);
      for (const x of list) {
        const code = CITY_TO_AIRPORT[x.destination] ?? x.destination;
        const a = airportByCode(code);
        if (!a || code === q.from || (origin && distanceKm(origin, a) < 150)) continue;
        const cur = best.get(code);
        if (!cur || x.value < cur.minCash) best.set(code, { to: code, minCash: x.value, cashDate: x.departDate, minMiles: null, milesDate: null });
      }
    }
    const destinations = [...best.values()].sort((a, b) => a.minCash - b.minCash);
    return { destinations, meta: { ...meta(), source: "Dinheiro: Aviasales (cache) · Milhas: indisponível" } };
  }

  async getRouteInsight(from: string, to: string, cabin: CabinId): Promise<RouteInsight> {
    const months = monthsFrom(6);
    const cash: number[] = [];
    const miles: number[] = [];
    for (const month of months) {
      const byDay = await cheapestPerDay(from, to, month);
      for (const [date, fare] of Object.entries(byDay)) {
        cash.push(fare.price);
        const ms = milesForDay({ from, to, cabin }, date, [{ airline: CODE_TO_AIRLINE[fare.airline] ?? "other", price: fare.price }]);
        if (ms[0]) miles.push(ms[0].miles);
      }
    }
    cash.sort((a, b) => a - b); miles.sort((a, b) => a - b);
    const pct = (s: number[], p: number) => s[Math.min(s.length - 1, Math.floor(s.length * p))] ?? 0;
    return { typicalLow: pct(cash, 0.25), typicalHigh: pct(cash, 0.75), typicalMilesLow: pct(miles, 0.25), typicalMilesHigh: pct(miles, 0.75), history: [], meta: meta(from, to) };
  }
}

export const serverProvider: PriceProvider = hasTravelpayouts() ? new CompositeProvider() : new MockPriceProvider();
export const serverProviderName = hasTravelpayouts() ? "aviasales+estimativa" : "mock";

