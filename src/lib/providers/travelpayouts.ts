/**
 * Cliente da Data API da Travelpayouts/Aviasales (só no servidor: usa o token).
 * Preços em dinheiro vindos do cache de buscas recentes da Aviasales, em BRL.
 * Docs: https://support.travelpayouts.com/hc/en-us/articles/203956163
 */
import "server-only";

const BASE = "https://api.travelpayouts.com";
const token = () => process.env.TRAVELPAYOUTS_TOKEN?.trim() ?? "";
export const hasTravelpayouts = () => token().length > 0;
export const marker = () => process.env.TRAVELPAYOUTS_MARKER?.trim() ?? "";

export type TpFare = {
  airline: string; // código IATA, ex.: G3, LA, AD, TP
  price: number;
  departureAt: string; // ISO com fuso
  durationMin: number;
  transfers: number;
  flightNumber: string;
  link: string;
};

async function get<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const p = new URLSearchParams({ ...params, token: token(), currency: "brl" });
  const url = `${BASE}${path}?${p.toString()}`;
  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const json = (await res.json()) as { success?: boolean; data?: T };
    if (json.success === false) return null;
    return (json.data ?? null) as T | null;
  } catch {
    return null;
  }
}

type RawFare = { airline: string; price: number; departure_at: string; duration: number; transfers: number; flight_number: string; link: string };
const toFare = (r: RawFare): TpFare => ({
  airline: r.airline,
  price: r.price,
  departureAt: r.departure_at,
  durationMin: r.duration,
  transfers: r.transfers,
  flightNumber: String(r.flight_number),
  link: r.link,
});

/** Menor preço por dia de um mês (YYYY-MM), só ida. Chave = YYYY-MM-DD. */
export async function cheapestPerDay(from: string, to: string, month: string): Promise<Record<string, TpFare>> {
  const data = await get<Record<string, RawFare>>("/aviasales/v3/grouped_prices", {
    origin: from, destination: to, departure_at: month, group_by: "departure_at", one_way: "true", direct: "false",
  });
  const out: Record<string, TpFare> = {};
  for (const [date, raw] of Object.entries(data ?? {})) out[date] = toFare(raw);
  return out;
}

/** Tarifas em cache para um dia específico (geralmente poucas: é cache, não busca ao vivo). */
export async function faresForDay(from: string, to: string, date: string): Promise<TpFare[]> {
  const data = await get<RawFare[]>("/aviasales/v3/prices_for_dates", {
    origin: from, destination: to, departure_at: date, one_way: "true", direct: "false", limit: "30", sorting: "price",
  });
  return (data ?? []).map(toFare);
}

export type TpLatest = { destination: string; departDate: string; value: number; transfers: number };

/** Menores preços recentes a partir de uma origem para qualquer destino, num mês. */
export async function latestFromOrigin(from: string, month: string): Promise<TpLatest[]> {
  const data = await get<{ destination: string; depart_date: string; value: number; number_of_changes: number; actual: boolean }[]>("/v2/prices/latest", {
    origin: from, period_type: "month", beginning_of_period: `${month}-01`, one_way: "true", limit: "1000", show_to_affiliates: "false", sorting: "price",
  });
  return (data ?? []).filter((x) => x.actual !== false).map((x) => ({ destination: x.destination, departDate: x.depart_date, value: x.value, transfers: x.number_of_changes }));
}

/** Link de compra na Aviasales com o nosso marker. */
export function aviasalesUrl(link: string) {
  const m = marker();
  return `https://www.aviasales.com${link}${m ? `&marker=${m}` : ""}`;
}
