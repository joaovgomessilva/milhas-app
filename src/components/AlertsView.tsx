"use client";

import { airportByCode } from "@/data/airports";
import { PROGRAMS } from "@/data/programs";
import { alertTriggered, checkAlert, useAlerts, type Alert } from "@/lib/alerts-store";
import { brl, monthLabel, num } from "@/lib/format";
import { priceProvider } from "@/lib/providers/mock";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PromosList } from "./PromosList";
import { relativeTime } from "./Freshness";
import { useSyncExternalStore } from "react";

type Tab = "alerts" | "promos";

export function AlertsView() {
  const { alerts, loaded, remove, replaceAll } = useAlerts();
  const [tab, setTab] = useState<Tab>("alerts");
  const [checkedFor, setCheckedFor] = useState<string | null>(null);
  const minute = useSyncExternalStore((cb) => { const id = setInterval(cb, 30000); return () => clearInterval(id); }, () => Math.floor(Date.now() / 60000), () => 0);

  // Verificação ao abrir a aba: simula o que um backend faria em segundo plano.
  const ids = alerts.map((a) => a.id).join(",");
  const checking = loaded && !!ids && checkedFor !== ids;
  useEffect(() => {
    if (!loaded || !ids || checkedFor === ids) return;
    let alive = true;
    Promise.all(alerts.map((a) => checkAlert(a, priceProvider))).then((updated) => {
      if (!alive) return;
      replaceAll(updated);
      setCheckedFor(ids);
    });
    return () => { alive = false; };
  }, [loaded, ids, checkedFor, alerts, replaceAll]);

  const triggered = alerts.filter(alertTriggered).length;

  return (
    <>
      <div className="segmented grid-cols-2" role="group" aria-label="Seção">
        <button type="button" aria-pressed={tab === "alerts"} onClick={() => setTab("alerts")}>
          Meus alertas{alerts.length ? ` (${alerts.length})` : ""}
        </button>
        <button type="button" aria-pressed={tab === "promos"} onClick={() => setTab("promos")}>Promoções de bônus</button>
      </div>

      {tab === "promos" && <PromosList />}

      {tab === "alerts" && !loaded && <div className="skeleton h-32" />}

      {tab === "alerts" && loaded && alerts.length === 0 && (
        <div className="card p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-primary-soft text-primary-strong mx-auto flex items-center justify-center" aria-hidden>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 3 5 14h6l-1 7 8-11h-6l1-7z" /></svg>
          </div>
          <h2 className="text-base font-semibold mt-3">Crie seu primeiro alerta</h2>
          <p className="text-sm text-ink-muted mt-1">Escolha uma rota, um mês ou qualquer data, e um preço em R$ ou em milhas. A gente guarda o menor valor já visto e avisa quando bater.</p>
          <Link href="/" className="btn-primary mt-4">Buscar uma rota</Link>
        </div>
      )}

      {tab === "alerts" && loaded && alerts.length > 0 && (
        <>
          <p className="text-xs text-ink-muted flex items-center gap-2" aria-live="polite">
            {checking ? <><span className="skeleton w-3 h-3 rounded-full" /> Verificando preços…</> : triggered ? `${triggered} ${triggered === 1 ? "alerta bateu" : "alertas bateram"} o preço que você quer.` : "Nenhum alerta bateu ainda. Verificado ao abrir esta aba."}
          </p>
          <ul className="flex flex-col gap-3">
            {alerts.map((a) => <AlertCard key={a.id} a={a} minute={minute} onRemove={() => remove(a.id)} />)}
          </ul>
          <p className="text-xs text-ink-muted">Nesta versão, a verificação acontece quando você abre o app. Avisos por notificação chegam na próxima fase.</p>
        </>
      )}
    </>
  );
}

function AlertCard({ a, minute, onRemove }: { a: Alert; minute: number; onRemove: () => void }) {
  const hit = alertTriggered(a);
  const from = airportByCode(a.from);
  const to = airportByCode(a.to);
  const url = `/resultados?from=${a.from}&to=${a.to}&month=${a.month === "any" ? (a.current?.cashDate?.slice(0, 7) ?? "") : a.month}&pax=${a.passengers}&cabin=${a.cabin}&budget=${a.maxCash}&programs=${a.programs.join(",")}`;
  return (
    <li className={`card p-4 ${hit ? "border border-good/40" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-ink-strong truncate">{from?.city ?? a.from} → {to?.city ?? a.to}</h3>
          <p className="text-xs text-ink-muted">
            {a.month === "any" ? "Qualquer data nos próximos 6 meses" : monthLabel(a.month)} · {a.passengers} {a.passengers > 1 ? "pessoas" : "pessoa"} · {a.programs.map((p) => PROGRAMS[p].name).join(", ")}
          </p>
        </div>
        {hit && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-good-soft text-good shrink-0">Bateu!</span>}
      </div>

      <dl className="grid grid-cols-2 gap-3 mt-3">
        <div className="rounded-[12px] bg-surface-2 p-3">
          <dt className="text-xs text-ink-muted">Quero até</dt>
          <dd className="font-semibold text-ink-strong">{a.maxCash ? brl(a.maxCash) : "—"}</dd>
          <dt className="text-xs text-ink-muted mt-2">Agora</dt>
          <dd className={`font-semibold ${hit && a.maxCash && a.current?.minCash != null && a.current.minCash <= a.maxCash ? "text-good" : "text-ink-strong"}`}>
            {a.current?.minCash != null ? brl(a.current.minCash) : "…"}
            {a.current?.cashDate && <span className="block text-[11px] font-normal text-ink-muted">dia {Number(a.current.cashDate.slice(-2))}/{a.current.cashDate.slice(5, 7)}</span>}
          </dd>
        </div>
        <div className="rounded-[12px] bg-surface-2 p-3">
          <dt className="text-xs text-ink-muted">Quero até</dt>
          <dd className="font-semibold text-miles">{a.maxMiles ? `${num(a.maxMiles)} milhas` : "—"}</dd>
          <dt className="text-xs text-ink-muted mt-2">Agora</dt>
          <dd className={`font-semibold ${hit && a.maxMiles && a.current?.minMiles != null && a.current.minMiles <= a.maxMiles ? "text-good" : "text-miles"}`}>
            {a.current?.minMiles != null ? num(a.current.minMiles) : "…"}
            {a.current?.minMilesProgram && <span className="block text-[11px] font-normal text-ink-muted">{PROGRAMS[a.current.minMilesProgram].name}, dia {Number(a.current.milesDate!.slice(-2))}/{a.current.milesDate!.slice(5, 7)}</span>}
          </dd>
        </div>
      </dl>

      {(a.bestCash || a.bestMiles) && (
        <p className="text-xs text-ink-muted mt-3">
          Menor já visto: {a.bestCash && <strong className="text-ink">{brl(a.bestCash.value)}</strong>}{a.bestCash && a.bestMiles && " · "}{a.bestMiles && <strong className="text-miles">{num(a.bestMiles.value)} milhas</strong>}
          {a.lastCheckedAt && minute ? ` · verificado ${relativeTime(a.lastCheckedAt, minute)}` : ""}
        </p>
      )}

      <div className="flex gap-2 mt-3">
        <Link href={url} className="btn-secondary flex-1 !min-h-[40px] text-sm">Ver calendário</Link>
        <button type="button" onClick={onRemove} className="btn-secondary !min-h-[40px] px-3 text-sm text-bad" aria-label="Excluir alerta">Excluir</button>
      </div>
    </li>
  );
}
