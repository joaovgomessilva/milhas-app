"use client";

import { AIRLINES, PROGRAMS, type ProgramId } from "@/data/programs";
import { brl, duration, longDate, num } from "@/lib/format";
import { priceProvider } from "@/lib/providers";
import type { Flight, SearchQuery } from "@/lib/providers/types";
import { recommend, type Recommendation, type Wallet } from "@/lib/valuation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { airlineSearchUrl } from "@/lib/deeplinks";
import { useReports } from "@/lib/reports-store";
import { Freshness } from "./Freshness";
import { Term } from "./Term";

type Props = {
  q: SearchQuery & { programs: ProgramId[] };
  date: string;
  wallet: Wallet;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export function DaySheet({ q, date, wallet, onClose, onPrev, onNext }: Props) {
  const key = JSON.stringify({ q, date });
  const [result, setResult] = useState<{ key: string; flights: Flight[] } | null>(null);
  const flights = result?.key === key ? result.flights : null;
  const [openState, setOpen] = useState<{ key: string; id: string | null }>({ key, id: null });
  const open = openState.key === key ? openState.id : null;
  const reports = useReports();

  useEffect(() => {
    let alive = true;
    priceProvider.getFlights(q, date).then((f) => alive && setResult({ key, flights: f.filter((x) => !x.miles || q.programs.includes(x.miles.program)) }));
    return () => { alive = false; };
  }, [q, date, key]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  // Dica do dia: a opção de MENOR custo total (dinheiro, taxas ou compra de pontos),
  // comparada ao voo mais barato em dinheiro.
  const best = useMemo(() => {
    if (!flights?.length) return null;
    const cheapestCash = flights[0].cash;
    const recs = flights.filter((f) => f.miles).map((f) => ({ f, r: recommend(f.cash, f.miles!, wallet) }));
    const top = recs.sort((a, b) => a.r.totalCost - b.r.totalCost || a.f.cash - b.f.cash)[0];
    if (!top) return null;
    return { top, savings: Math.max(0, cheapestCash - top.r.totalCost) };
  }, [flights, wallet]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-label={`Voos em ${longDate(date)}`}
        className="sheet-enter w-full max-w-lg bg-bg rounded-t-[20px] max-h-[88dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-border">
          <button type="button" className="btn-secondary !min-h-[40px] w-10 px-0" aria-label="Dia anterior" onClick={onPrev}>‹</button>
          <h2 className="flex-1 text-center text-base font-semibold">{cap(longDate(date))}</h2>
          <button type="button" className="btn-secondary !min-h-[40px] w-10 px-0" aria-label="Próximo dia" onClick={onNext}>›</button>
          <button type="button" className="btn-secondary !min-h-[40px] w-10 px-0" aria-label="Fechar" onClick={onClose}>✕</button>
        </div>

        <div className="overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {!flights && (
            <>
              <div className="skeleton h-28" />
              <div className="skeleton h-24" />
              <div className="skeleton h-24" />
            </>
          )}

          {flights && best && <Tip rec={best.top.r} flight={best.top.f} savings={best.savings} passengers={q.passengers} />}

          {flights && flights.length === 0 && (
            <div className="card p-6 text-center">
              <h3 className="font-semibold">Sem voos neste dia</h3>
              <p className="text-sm text-ink-muted mt-1">Experimente o dia seguinte ou outro programa.</p>
            </div>
          )}

          {flights && flights.length > 0 && (
            <ul className="flex flex-col gap-2" aria-label="Voos">
              {flights.map((f) => {
                const rec = f.miles ? recommend(f.cash, f.miles, wallet) : null;
                const expanded = open === f.id;
                return (
                  <li key={f.id} className="card overflow-hidden">
                    <button type="button" className="w-full text-left p-3" aria-expanded={expanded} onClick={() => setOpen({ key, id: expanded ? null : f.id })}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="text-[11px] font-bold tracking-wide px-1.5 py-0.5 rounded" style={{ background: AIRLINES[f.airline].color, color: "#fff" }}>{f.airlineName ?? AIRLINES[f.airline].name}</span>
                          <span className="text-sm text-ink-muted">{f.stops === 0 ? "Direto" : "1 parada"} · {duration(f.durationMin)}</span>
                        </span>
                        {rec && <VerdictBadge v={rec.verdict} />}
                      </div>
                      <div className="mt-2 flex items-end justify-between gap-3">
                        <span className="text-ink-strong font-semibold">{f.departure} <span className="text-ink-muted font-normal">→</span> {f.arrival}</span>
                        <span className="text-right">
                          <span className="block text-base font-semibold text-cash">{brl(f.cash)}</span>
                          {f.miles ? (
                            <span className="block text-sm text-miles font-medium">{num(f.miles.miles)} milhas <span className="text-ink-muted font-normal">+ {brl(f.miles.taxes)}</span></span>
                          ) : (
                            <span className="block text-xs text-ink-muted">sem emissão em milhas</span>
                          )}
                        </span>
                      </div>
                    </button>
                    {expanded && !f.miles && (
                      <div className="px-3 pb-3 fade-in">
                        <p className="text-xs text-ink-muted">Sem estimativa em milhas para esta companhia.</p>
                        <div className="mt-2"><Freshness meta={f.meta} compact /></div>
                        <a href={airlineSearchUrl({ airline: f.airline, from: q.from, to: q.to, date, passengers: q.passengers, cabin: q.cabin, miles: false })} target="_blank" rel="noopener noreferrer" className="btn-primary w-full mt-2 !min-h-[44px] text-sm">Ver em R$ {f.airline === "other" ? "no Google" : `na ${AIRLINES[f.airline].name}`} <ExtIcon /></a>
                        {f.bookingUrl && <a href={f.bookingUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full mt-2 !min-h-[40px] text-sm">Comprar pela Aviasales por {brl(f.cash)} <ExtIcon /></a>}
                      </div>
                    )}
                    {expanded && rec && f.miles && (
                      <div className="px-3 pb-3 fade-in">
                        <div className="rounded-[12px] bg-surface-2 p-3 text-sm">
                          <p className="font-semibold text-ink-strong">{rec.title}</p>
                          <p className="text-ink mt-1">{rec.explanation}</p>
                          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3 text-xs">
                            <dt className="text-ink-muted"><Term k="programa">Programa</Term></dt><dd className="text-right font-medium">{PROGRAMS[f.miles.program].name}</dd>
                            <dt className="text-ink-muted"><Term k="implicito">Milheiro nesta emissão</Term></dt><dd className="text-right font-medium">{brl(rec.impliedPer1000)}</dd>
                            <dt className="text-ink-muted"><Term k="referencia">Valor de referência</Term></dt><dd className="text-right font-medium">{brl(rec.referencePer1000)}</dd>
                            {q.passengers > 1 && (<><dt className="text-ink-muted">Total p/ {q.passengers} pessoas</dt><dd className="text-right font-medium">{brl(rec.totalCost * q.passengers)}</dd></>)}
                          </dl>
                        </div>

                        <div className="mt-3">
                          <Freshness meta={f.meta} compact />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <a href={airlineSearchUrl({ airline: f.airline, from: q.from, to: q.to, date, passengers: q.passengers, cabin: q.cabin, miles: false })} target="_blank" rel="noopener noreferrer" className="btn-primary !min-h-[44px] text-sm">
                            Ver em R$ {f.airline === "other" ? "no Google" : `na ${AIRLINES[f.airline].name}`} <ExtIcon />
                          </a>
                          <a href={airlineSearchUrl({ airline: f.airline, from: q.from, to: q.to, date, passengers: q.passengers, cabin: q.cabin, miles: true })} target="_blank" rel="noopener noreferrer" className="btn-secondary !min-h-[44px] text-sm">
                            Ver em milhas <ExtIcon />
                          </a>
                        </div>
                        {f.bookingUrl && (
                          <a href={f.bookingUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full mt-2 !min-h-[40px] text-sm">Comprar pela Aviasales por {brl(f.cash)} <ExtIcon /></a>
                        )}
                        <ReportRow f={f} route={`${q.from}-${q.to}`} date={date} reports={reports} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <p className="text-[11px] text-ink-muted">Preços em dinheiro vêm do cache de buscas recentes e podem ter mudado. As milhas são estimadas a partir do preço em dinheiro até termos fonte própria. A compra é feita no site da companhia, do programa ou da agência. Este app não pede sua senha e não movimenta pontos.</p>
        </div>
      </div>
    </div>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function ExtIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></svg>;
}

function ReportRow({ f, route, date, reports }: { f: Flight; route: string; date: string; reports: ReturnType<typeof useReports> }) {
  const [open, setOpen] = useState(false);
  const done = reports.hasReported(f.id);
  if (done) return <p className="text-xs text-good mt-2">Obrigado! Seu aviso ajuda a corrigir a fonte.</p>;
  if (!open) return <button type="button" className="text-xs text-ink-muted underline underline-offset-2 mt-2" onClick={() => setOpen(true)}>Preço diferente na companhia? Avise</button>;
  const send = (kind: "higher" | "lower" | "unavailable") => reports.add({ flightId: f.id, route, date, shownCash: f.cash, shownMiles: f.miles?.miles ?? null, kind });
  return (
    <div className="mt-2 flex flex-wrap gap-1.5 fade-in" role="group" aria-label="Como estava o preço na companhia?">
      <span className="text-xs text-ink-muted w-full">Na companhia estava:</span>
      <button type="button" className="chip !min-h-[32px] text-xs" onClick={() => send("higher")}>Mais caro</button>
      <button type="button" className="chip !min-h-[32px] text-xs" onClick={() => send("lower")}>Mais barato</button>
      <button type="button" className="chip !min-h-[32px] text-xs" onClick={() => send("unavailable")}>Não existe</button>
    </div>
  );
}

function VerdictBadge({ v }: { v: Recommendation["verdict"] }) {
  const map = {
    "use-miles": { t: "Use milhas", c: "bg-good-soft text-good" },
    "pay-cash": { t: "Dinheiro", c: "bg-surface-2 text-ink" },
    transfer: { t: "Transfira", c: "bg-miles-soft text-miles" },
    "buy-transfer": { t: "Compre + bônus", c: "bg-warn-soft text-warn" },
  } as const;
  const m = map[v];
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${m.c}`}>{m.t}</span>;
}

function Tip({ rec, flight, savings, passengers }: { rec: Recommendation; flight: Flight; savings: number; passengers: number }) {
  const tone = rec.verdict === "use-miles" || rec.verdict === "transfer" ? "border-good/40" : rec.verdict === "buy-transfer" ? "border-warn/40" : "border-border";
  return (
    <section className={`card p-4 border ${tone}`} aria-label="Dica">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Dica para este dia</p>
      <h3 className="text-base font-semibold mt-1">{rec.title}</h3>
      <p className="text-sm text-ink mt-1">{rec.explanation}</p>
      {savings > 0 && (
        <p className="text-sm mt-2 font-medium text-good">Economia estimada: {brl(savings * passengers)} em relação ao voo mais barato em dinheiro{passengers > 1 ? `, para ${passengers} pessoas` : ""}</p>
      )}
      <p className="text-xs text-ink-muted mt-2">Melhor opção: {flight.airlineName ?? AIRLINES[flight.airline].name} às {flight.departure}. {rec.verdict === "pay-cash" && !rec.savings ? <Link href="/carteira" className="text-primary underline">Informe seus saldos</Link> : null}</p>
    </section>
  );
}
