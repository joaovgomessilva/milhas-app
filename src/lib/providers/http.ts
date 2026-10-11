"use client";

/** Provider do navegador: fala com as rotas /api/prices/*, que guardam o token no servidor. */
import type { CabinId } from "@/data/programs";
import type { CalendarResult, ExploreDestination, ExploreQuery, Flight, PriceMeta, PriceProvider, RouteInsight, SearchQuery } from "./types";

async function getJson<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const p = new URLSearchParams(Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])));
  const res = await fetch(`/api/prices/${path}?${p.toString()}`);
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export const httpProvider: PriceProvider = {
  getCalendar: (q: SearchQuery) => getJson<CalendarResult>("calendar", { from: q.from, to: q.to, month: q.month, pax: q.passengers, cabin: q.cabin }),
  getFlights: (q: SearchQuery, date: string) => getJson<Flight[]>("flights", { from: q.from, to: q.to, date, pax: q.passengers, cabin: q.cabin }),
  getExplore: (q: ExploreQuery) => getJson<{ destinations: ExploreDestination[]; meta: PriceMeta }>("explore", { from: q.from, month: q.month, pax: q.passengers, cabin: q.cabin }),
  getRouteInsight: (from: string, to: string, cabin: CabinId) => getJson<RouteInsight>("insight", { from, to, cabin }),
};
