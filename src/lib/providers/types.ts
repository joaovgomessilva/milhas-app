import type { AirlineId, CabinId, ProgramId } from "@/data/programs";

/** Parâmetros de uma busca. Datas em ISO (YYYY-MM-DD). */
export type SearchQuery = {
  from: string;
  to: string;
  /** mês em foco no calendário, YYYY-MM */
  month: string;
  passengers: number;
  cabin: CabinId;
};

/**
 * De onde veio o preço e quando foi verificado.
 * Resposta direta à reclamação "o preço do app não existe na companhia":
 * cada número na tela carrega sua idade e sua origem.
 */
export type PriceMeta = {
  /** nome legível da fonte, ex.: "Dados de teste", "Duffel", "Seats.aero" */
  source: string;
  /** ISO datetime da verificação */
  checkedAt: string;
  /** estado da fonte no momento */
  status: "ok" | "unstable" | "down";
};

export type CashFare = {
  airline: AirlineId;
  /** nome/código quando airline === "other" */
  airlineName?: string;
  /** total por passageiro, R$ */
  price: number;
};

export type MilesFare = {
  program: ProgramId;
  airline: AirlineId;
  /** milhas por passageiro */
  miles: number;
  /** taxas em R$ por passageiro (embarque etc.) */
  taxes: number;
};

export type Flight = {
  id: string;
  airline: AirlineId;
  airlineName?: string;
  /** link de compra em agência/parceiro, quando a fonte fornece */
  bookingUrl?: string;
  departure: string; // HH:mm
  arrival: string; // HH:mm
  durationMin: number;
  stops: number;
  cash: number;
  miles: MilesFare | null;
  meta: PriceMeta;
};

export type DayPrice = {
  date: string; // YYYY-MM-DD
  /** menor preço em dinheiro entre companhias, R$ por passageiro */
  minCash: number | null;
  /** menor emissão em milhas entre programas */
  minMiles: MilesFare | null;
  cash: CashFare[];
  miles: MilesFare[];
};

export type CalendarResult = {
  days: DayPrice[];
  meta: PriceMeta;
};

/** Um destino no modo Explorar: o menor preço encontrado no período. */
export type ExploreDestination = {
  to: string;
  minCash: number;
  cashDate: string;
  minMiles: MilesFare | null;
  milesDate: string | null;
};

export type ExploreQuery = {
  from: string;
  /** "YYYY-MM" ou "any" (próximos 6 meses) */
  month: string | "any";
  passengers: number;
  cabin: CabinId;
};

/**
 * "Comprar agora ou esperar?": faixa típica da rota e histórico recente do menor preço.
 * Inspirado no indicador de preço do Google Flights e na previsão do Hopper.
 */
export type RouteInsight = {
  /** faixa típica (percentis 25 e 75) do menor preço diário em R$, nos próximos 6 meses */
  typicalLow: number;
  typicalHigh: number;
  /** idem em milhas */
  typicalMilesLow: number;
  typicalMilesHigh: number;
  /** menor preço diário visto nos últimos 30 dias de verificação (série para o gráfico) */
  history: { date: string; cash: number; miles: number }[];
  meta: PriceMeta;
};

export interface PriceProvider {
  /** Um registro por dia do mês. */
  getCalendar(q: SearchQuery): Promise<CalendarResult>;
  /** Voos de um dia específico. */
  getFlights(q: SearchQuery, date: string): Promise<Flight[]>;
  /** Todos os destinos a partir de uma origem, ordenados do mais barato. */
  getExplore(q: ExploreQuery): Promise<{ destinations: ExploreDestination[]; meta: PriceMeta }>;
  /** Faixa típica e histórico de uma rota. */
  getRouteInsight(from: string, to: string, cabin: CabinId): Promise<RouteInsight>;
}
