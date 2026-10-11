"use client";

import { airportByCode } from "@/data/airports";
import { PROGRAMS, type CabinId, type ProgramId } from "@/data/programs";
import { brl, compactBrl, compactMiles, monthLabel, shiftMonth } from "@/lib/format";
import { priceProvider } from "@/lib/providers";
import type { CalendarResult, DayPrice, SearchQuery } from "@/lib/providers/types";
import { useWallet } from "@/lib/wallet-store";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DaySheet } from "./DaySheet";
import { CreateAlertSheet } from "./CreateAlertSheet";
import { Freshness } from "./Freshness";
import { Term } from "./Term";
import { RouteInsightCard } from "./RouteInsightCard";

type View = "both" | "cash" | "miles";

export function Results() {
  const sp = useSearchParams();
  const router = useRouter();
  const { wallet } = useWallet();

  const q: SearchQuery & { budget: number; programs: ProgramId[] } = useMemo(() => ({
    from: sp.get("from") ?? "GRU",
    to: sp.get("to") ?? "REC",
    month: sp.get("month") ?? shiftMonth(new Date().toISOString().slice(0, 7), 1),
    passengers: Number(sp.get("pax") ?? 1),
    cabin: (sp.get("cabin") as CabinId) ?? "economy",
    budget: Number(sp.get("budget") ?? 0),
    programs: ((sp.get("programs") ?? "smiles,latampass,tudoazul").split(",") as ProgramId[]).filter((p) => p in PROGRAMS),
  }), [sp]);

  const key = JSON.stringify(q);
  const [result, setResult] = useState<{ key: string; data: CalendarResult } | null>(null);
  const days = result?.key === key ? result.data.days : null;
  const meta = result?.key === key ? result.data.meta : null;
  const [alertOpen, setAlertOpen] = useState(false);
  const [view, setView] = useState<View>("both");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    priceProvider.getCalendar(q).then((d) => alive && setResult({ key, data: d }));
    return () => { alive = false; };
  }, [q, key]);

  // filtra milhas pelos programas escolhidos
  const filtered = useMemo(() => days?.map((d) => {
    const miles = d.miles.filter((m) => q.programs.includes(m.program));
    const minMiles = miles.reduce((b, m) => (!b || m.miles < b.miles ? m : b), null as DayPrice["minMiles"]);
    return { ...d, miles, minMiles };
  }) ?? null, [days, q.programs]);

  const stats = useMemo(() => {
    if (!filtered) return null;
    const cash = filtered.map((d) => d.minCash).filter((x): x is number => x != null);
    const miles = filtered.map((d) => d.minMiles?.miles).filter((x): x is number => x != null);
    const sorted = [...cash].sort((a, b) => a - b);
    const sortedM = [...miles].sort((a, b) => a - b);
    return {
      cheapCash: sorted[Math.floor(sorted.length * 0.2)] ?? Infinity,
      cheapMiles: sortedM[Math.floor(sortedM.length * 0.2)] ?? Infinity,
      minCash: sorted[0],
      minMiles: sortedM[0],
      bestCashDay: filtered.find((d) => d.minCash === sorted[0])?.date,
      bestMilesDay: filtered.find((d) => d.minMiles?.miles === sortedM[0])?.date,
    };
  }, [filtered]);

  const from = airportByCode(q.from);
  const to = airportByCode(q.to);

  function go(month: string) {
    const p = new URLSearchParams(sp.toString());
    p.set("month", month);
    router.replace(`/resultados?${p.toString()}`);
  }

  const [y, m] = q.month.split("-").map(Number);
  const firstDow = new Date(y, m - 1, 1).getDay();

  return (
    <main className="flex flex-col min-h-full">
      <header className="px-4 pt-4 pb-3 sticky top-0 z-30 bg-bg/95 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Voltar para a busca" className="btn-secondary !min-h-[40px] w-10 px-0 shrink-0"><BackIcon /></Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold truncate">{from?.city ?? q.from} → {to?.city ?? q.to}</h1>
            <p className="text-xs text-ink-muted">
              {q.passengers} {q.passengers > 1 ? "passageiros" : "passageiro"} · {cabinLabel(q.cabin)} · por pessoa{q.budget ? ` · até ${brl(q.budget)}` : ""}
            </p>
          </div>
          <button type="button" className="btn-secondary !min-h-[40px] px-3 text-sm shrink-0" onClick={() => setAlertOpen(true)} aria-label="Criar alerta de preço para esta rota">
            <BoltIcon /> Alerta
          </button>
        </div>

        <div className="segmented grid-cols-3 mt-3" role="group" aria-label="Mostrar preços em">
          <button type="button" aria-pressed={view === "both"} onClick={() => setView("both")}>R$ e milhas</button>
          <button type="button" aria-pressed={view === "cash"} onClick={() => setView("cash")}>Só R$</button>
          <button type="button" aria-pressed={view === "miles"} onClick={() => setView("miles")}>Só milhas</button>
        </div>
      </header>

      <section className="px-4">
        <div className="flex items-center justify-between mb-2">
          <button type="button" className="btn-secondary !min-h-[40px] w-10 px-0" aria-label="Mês anterior" onClick={() => go(shiftMonth(q.month, -1))}>‹</button>
          <h2 className="text-base font-semibold">{monthLabel(q.month)}</h2>
          <button type="button" className="btn-secondary !min-h-[40px] w-10 px-0" aria-label="Próximo mês" onClick={() => go(shiftMonth(q.month, 1))}>›</button>
        </div>

        <div className="card p-2">
          <div className="grid grid-cols-7 text-center text-[11px] font-medium text-ink-muted mb-1">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => <span key={i}>{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1" role="grid" aria-busy={!filtered}>
            {Array.from({ length: firstDow }).map((_, i) => <span key={`e${i}`} />)}
            {!filtered && Array.from({ length: 30 }).map((_, i) => <div key={i} className="skeleton aspect-[4/5]" />)}
            {filtered?.map((d) => {
              const dayNum = Number(d.date.slice(-2));
              const empty = d.minCash == null;
              const overBudget = q.budget > 0 && d.minCash != null && d.minCash > q.budget;
              const cheapCash = d.minCash != null && stats && d.minCash <= stats.cheapCash;
              const cheapMiles = d.minMiles != null && stats && d.minMiles.miles <= stats.cheapMiles;
              const highlight = view === "cash" ? cheapCash : view === "miles" ? cheapMiles : cheapCash || cheapMiles;
              return (
                <button
                  key={d.date}
                  type="button"
                  role="gridcell"
                  disabled={empty}
                  aria-label={empty ? `Dia ${dayNum}, sem preços` : `Dia ${dayNum}: ${brl(d.minCash!)} ou ${d.minMiles ? compactMiles(d.minMiles.miles) + " milhas" : "sem milhas"}`}
                  onClick={() => setSelected(d.date)}
                  className={`fade-in aspect-[4/5] rounded-[10px] flex flex-col items-center justify-center gap-0.5 px-0.5 transition-transform active:scale-95
                    ${empty ? "text-ink-muted/40" : overBudget ? "opacity-35" : ""}
                    ${highlight && !overBudget ? "bg-good-soft" : "bg-surface-2/60"}
                    ${selected === d.date ? "ring-2 ring-primary" : ""}`}
                >
                  <span className={`text-[13px] leading-none ${highlight && !overBudget ? "font-semibold text-ink-strong" : "text-ink"}`}>{dayNum}</span>
                  {!empty && view !== "miles" && (
                    <span className={`text-[10px] leading-tight ${cheapCash ? "text-good font-semibold" : "text-cash"}`}>{compactBrl(d.minCash!)}</span>
                  )}
                  {!empty && view !== "cash" && d.minMiles && (
                    <span className={`text-[10px] leading-tight ${cheapMiles ? "text-good font-semibold" : "text-miles"}`}>{compactMiles(d.minMiles.miles)}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {stats && stats.minCash != null && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Stat label="Menor em dinheiro" value={brl(stats.minCash)} sub={stats.bestCashDay ? `dia ${Number(stats.bestCashDay.slice(-2))}` : ""} tone="cash" onClick={() => stats.bestCashDay && setSelected(stats.bestCashDay)} />
            <Stat label="Menor em milhas" value={stats.minMiles != null ? `${compactMiles(stats.minMiles)}` : "—"} sub={stats.bestMilesDay ? `dia ${Number(stats.bestMilesDay.slice(-2))} + taxas` : ""} tone="miles" onClick={() => stats.bestMilesDay && setSelected(stats.bestMilesDay)} />
          </div>
        )}
        {stats && stats.minCash != null && (
          <RouteInsightCard from={q.from} to={q.to} cabin={q.cabin} monthMinCash={stats.minCash} monthMinMiles={stats.minMiles ?? null} onCreateAlert={() => setAlertOpen(true)} />
        )}
        {filtered && stats && stats.minCash == null && (
          <div className="card p-6 mt-3 text-center">
            <h2 className="text-base font-semibold">Sem preços para este mês</h2>
            <p className="text-sm text-ink-muted mt-1">Esta rota ou mês ainda não tem dados. Tente outro mês ou outra rota.</p>
          </div>
        )}

        <p className="text-[11px] text-ink-muted mt-3 flex items-center gap-1.5 flex-wrap">
          <span className="inline-block w-3 h-3 rounded bg-good-soft border border-good/30" aria-hidden /> 20% mais baratos do mês · dias em branco: sem preço recente · <span className="text-cash font-medium">R$ por pessoa</span> · <span className="text-miles font-medium">milhas</span> + <Term k="taxas">taxas</Term>
        </p>
        {meta && <div className="mt-1.5"><Freshness meta={meta} compact /></div>}
      </section>

      {alertOpen && (
        <CreateAlertSheet
          from={q.from} to={q.to} month={q.month} passengers={q.passengers} cabin={q.cabin} programs={q.programs}
          suggestedCash={stats?.minCash ?? null} suggestedMiles={stats?.minMiles ?? null}
          onClose={() => setAlertOpen(false)}
        />
      )}
      {selected && (
        <DaySheet q={q} date={selected} wallet={wallet} onClose={() => setSelected(null)} onPrev={() => setSelected(shiftDay(selected, -1))} onNext={() => setSelected(shiftDay(selected, 1))} />
      )}
    </main>
  );
}

function shiftDay(iso: string, delta: number) {
  const d = new Date(iso + "T12:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function cabinLabel(c: CabinId) {
  return c === "economy" ? "Econômica" : c === "premium" ? "Econ. Premium" : "Executiva";
}

function Stat({ label, value, sub, tone, onClick }: { label: string; value: string; sub: string; tone: "cash" | "miles"; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="card p-3 text-left active:scale-[0.98] transition-transform">
      <span className="block text-xs text-ink-muted">{label}</span>
      <span className={`block text-xl font-semibold mt-0.5 ${tone === "miles" ? "text-miles" : "text-ink-strong"}`}>{value}</span>
      <span className="block text-xs text-ink-muted">{sub}</span>
    </button>
  );
}

function BoltIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M13 3 5 14h6l-1 7 8-11h-6l1-7z" /></svg>;
}

function BackIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m15 6-6 6 6 6" /></svg>;
}
