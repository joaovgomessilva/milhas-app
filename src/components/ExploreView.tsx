"use client";

import { airportByCode } from "@/data/airports";
import { PROGRAMS, type CabinId } from "@/data/programs";
import { brl, compactMiles, monthLabel, shiftMonth } from "@/lib/format";
import { useLocalValue } from "@/lib/local-store";
import { priceProvider } from "@/lib/providers/mock";
import type { ExploreDestination, PriceMeta } from "@/lib/providers/types";
import { useWallet } from "@/lib/wallet-store";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AirportField } from "./AirportField";
import { Freshness } from "./Freshness";

type Form = { from: string; month: string | "any"; passengers: number; cabin: CabinId; budget: number; onlyMiles: boolean; scope: "all" | "BR" | "INTL" };

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
const DEFAULT: Form = { from: "GRU", month: "any", passengers: 1, cabin: "economy", budget: 0, onlyMiles: false, scope: "all" };

export function ExploreView() {
  const [saved, save] = useLocalValue<Form>("milhas-app:explore:v1", DEFAULT);
  const [draft, setDraft] = useState<Form | null>(null);
  const f = draft ?? saved;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => { const n = { ...f, [k]: v }; setDraft(n); save(n); };
  const { wallet } = useWallet();

  const key = `${f.from}|${f.month}|${f.passengers}|${f.cabin}`;
  const [res, setRes] = useState<{ key: string; data: { destinations: ExploreDestination[]; meta: PriceMeta } } | null>(null);
  const data = res?.key === key ? res.data : null;

  useEffect(() => {
    let alive = true;
    priceProvider.getExplore({ from: f.from, month: f.month, passengers: f.passengers, cabin: f.cabin }).then((d) => alive && setRes({ key, data: d }));
    return () => { alive = false; };
  }, [f.from, f.month, f.passengers, f.cabin, key]);

  const list = useMemo(() => {
    if (!data) return null;
    return data.destinations
      .map((d) => {
        const a = airportByCode(d.to)!;
        const fits = d.minMiles ? (wallet[d.minMiles.program] ?? 0) >= d.minMiles.miles * f.passengers : false;
        return { ...d, airport: a, fits };
      })
      .filter((d) => f.scope === "all" || d.airport.country === f.scope)
      .filter((d) => !f.budget || d.minCash <= f.budget || d.fits)
      .filter((d) => !f.onlyMiles || d.fits)
      .sort((a, b) => (f.onlyMiles ? (a.minMiles?.miles ?? 1e9) - (b.minMiles?.miles ?? 1e9) : a.minCash - b.minCash));
  }, [data, wallet, f.scope, f.budget, f.onlyMiles, f.passengers]);

  const months = ["any", ...Array.from({ length: 6 }, (_, i) => shiftMonth(currentMonth(), i))];
  const hasWallet = Object.values(wallet).some((v) => (v ?? 0) > 0);

  return (
    <>
      <div className="card p-4 flex flex-col gap-4">
        <AirportField label="Saindo de" value={f.from} onChange={(v) => set("from", v)} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ex-month" className="label">Quando</label>
            <select id="ex-month" className="field" value={f.month} onChange={(e) => set("month", e.target.value)}>
              {months.map((m) => <option key={m} value={m}>{m === "any" ? "Qualquer data (6 meses)" : monthLabel(m)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="ex-budget" className="label">Até (R$/pessoa)</label>
            <input id="ex-budget" inputMode="numeric" className="field" placeholder="Sem limite" value={f.budget || ""} onChange={(e) => set("budget", Number(e.target.value.replace(/\D/g, "")) || 0)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "BR", "INTL"] as const).map((s) => (
            <button key={s} type="button" className="chip" data-on={f.scope === s} aria-pressed={f.scope === s} onClick={() => set("scope", s)}>
              {s === "all" ? "Todos" : s === "BR" ? "Brasil" : "Internacional"}
            </button>
          ))}
          <button type="button" className="chip" data-on={f.onlyMiles} aria-pressed={f.onlyMiles} onClick={() => set("onlyMiles", !f.onlyMiles)} disabled={!hasWallet} title={hasWallet ? "" : "Informe seus saldos na Carteira"}>
            ✦ Cabe nas minhas milhas
          </button>
        </div>
        {!hasWallet && <p className="text-xs text-ink-muted -mt-2"><Link href="/carteira" className="text-primary underline">Informe seus saldos</Link> para ver quais destinos já cabem nas suas milhas.</p>}
      </div>

      {!list && <div className="flex flex-col gap-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-[72px]" />)}</div>}

      {list && list.length === 0 && (
        <div className="card p-6 text-center">
          <h2 className="text-base font-semibold">Nenhum destino com esses filtros</h2>
          <p className="text-sm text-ink-muted mt-1">Aumente o limite de preço ou tire o filtro de milhas.</p>
        </div>
      )}

      {list && list.length > 0 && (
        <ol className="flex flex-col gap-2" aria-label="Destinos">
          {list.map((d, i) => {
            const month = (f.onlyMiles && d.milesDate ? d.milesDate : d.cashDate).slice(0, 7);
            const href = `/resultados?from=${f.from}&to=${d.to}&month=${month}&pax=${f.passengers}&cabin=${f.cabin}&budget=${f.budget}&programs=smiles,latampass,tudoazul`;
            return (
              <li key={d.to}>
                <Link href={href} className="card p-3 flex items-center gap-3 active:scale-[0.98] transition-transform">
                  <span className="w-7 text-center text-xs font-semibold text-ink-muted" aria-hidden>{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink-strong truncate">{d.airport.city} <span className="text-ink-muted font-normal text-sm">{d.to}</span></span>
                    <span className="block text-xs text-ink-muted">
                      {d.airport.country === "INTL" ? "Internacional" : "Nacional"} · mais barato em {new Date(d.cashDate + "T12:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                      {d.fits && <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-good-soft text-good">cabe nas suas milhas</span>}
                    </span>
                  </span>
                  <span className="text-right shrink-0">
                    <span className="block font-semibold text-cash">{brl(d.minCash)}</span>
                    {d.minMiles && <span className="block text-xs text-miles font-medium">{compactMiles(d.minMiles.miles)} {PROGRAMS[d.minMiles.program].name}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}

      {data && <Freshness meta={data.meta} compact />}
    </>
  );
}
