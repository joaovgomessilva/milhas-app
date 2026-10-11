"use client";

import type { CabinId } from "@/data/programs";
import { brl, compactMiles } from "@/lib/format";
import { priceProvider } from "@/lib/providers";
import type { RouteInsight } from "@/lib/providers/types";
import { useEffect, useState } from "react";
import { Term } from "./Term";

type Props = {
  from: string;
  to: string;
  cabin: CabinId;
  /** menor preço do mês em foco (R$ e milhas) */
  monthMinCash: number;
  monthMinMiles: number | null;
  onCreateAlert: () => void;
};

/**
 * "Comprar agora ou esperar?" — faixa típica da rota, posição do mês em foco
 * nessa faixa e histórico de 30 dias. Inspirado no indicador do Google Flights
 * e na previsão do Hopper; aqui com a conta exposta, não uma caixa-preta.
 */
export function RouteInsightCard({ from, to, cabin, monthMinCash, monthMinMiles, onCreateAlert }: Props) {
  const key = `${from}-${to}-${cabin}`;
  const [res, setRes] = useState<{ key: string; data: RouteInsight } | null>(null);
  const data = res?.key === key ? res.data : null;

  useEffect(() => {
    let alive = true;
    priceProvider.getRouteInsight(from, to, cabin).then((d) => alive && setRes({ key, data: d }));
    return () => { alive = false; };
  }, [from, to, cabin, key]);

  if (!data) return <div className="skeleton h-40 mt-3" />;

  const mid = (data.typicalLow + data.typicalHigh) / 2;
  const diff = Math.round(((monthMinCash - mid) / mid) * 100);
  const level = monthMinCash < data.typicalLow ? "low" : monthMinCash > data.typicalHigh ? "high" : "typical";
  const verdict = {
    low: { title: "Bom momento para comprar", body: `O menor preço deste mês está ${Math.abs(diff)}% abaixo do que essa rota costuma custar. Preços assim não duram: se a data serve, compre.`, tone: "text-good", bg: "bg-good-soft" },
    typical: { title: "Preço normal para esta rota", body: `Está dentro da faixa típica. Dá para esperar uma queda, mas sem garantia. Um alerta avisa se cair abaixo de ${brl(data.typicalLow)}.`, tone: "text-ink-strong", bg: "bg-surface-2" },
    high: { title: "Acima do normal, vale esperar", body: `O menor preço deste mês está ${diff}% acima do que essa rota costuma custar. Se a data é flexível, crie um alerta e espere voltar à faixa típica.`, tone: "text-warn", bg: "bg-warn-soft" },
  }[level];

  const milesLevel = monthMinMiles == null ? null : monthMinMiles < data.typicalMilesLow ? "low" : monthMinMiles > data.typicalMilesHigh ? "high" : "typical";

  return (
    <section className="card p-4 mt-3" aria-label="Comprar agora ou esperar">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Comprar agora ou esperar?</p>
      <h2 className={`text-base font-semibold mt-1 ${verdict.tone}`}>{verdict.title}</h2>
      <p className="text-sm text-ink mt-1">{verdict.body}</p>

      <RangeBar low={data.typicalLow} high={data.typicalHigh} value={monthMinCash} />
      <div className="flex justify-between text-[11px] text-ink-muted mt-1">
        <span><Term k="tipico">Faixa típica</Term>: {brl(data.typicalLow)} a {brl(data.typicalHigh)}</span>
        <span>este mês: <strong className="text-ink-strong">{brl(monthMinCash)}</strong></span>
      </div>

      {milesLevel && monthMinMiles != null && (
        <p className="text-xs text-ink-muted mt-2">
          Em milhas: <strong className="text-miles">{compactMiles(monthMinMiles)}</strong> este mês, faixa típica {compactMiles(data.typicalMilesLow)} a {compactMiles(data.typicalMilesHigh)}
          {milesLevel === "low" ? ". Também está barato em milhas." : milesLevel === "high" ? ". Em milhas está caro." : "."}
        </p>
      )}

      {data.history.length > 1 && <Sparkline history={data.history} />}

      {level !== "low" && (
        <button type="button" className="btn-secondary w-full mt-3 !min-h-[40px] text-sm" onClick={onCreateAlert}>Criar alerta e esperar</button>
      )}
    </section>
  );
}

function RangeBar({ low, high, value }: { low: number; high: number; value: number }) {
  const min = low * 0.6, max = high * 1.5;
  const pos = (v: number) => `${Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100))}%`;
  return (
    <div className="relative h-2 mt-3 rounded-full bg-surface-2" aria-hidden>
      <div className="absolute top-0 bottom-0 rounded-full bg-good/30" style={{ left: pos(low), width: `calc(${pos(high)} - ${pos(low)})` }} />
      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-primary ring-2 ring-surface" style={{ left: pos(value) }} />
    </div>
  );
}

/** Menor preço diário visto nos últimos 30 dias. SVG puro, sem biblioteca. */
function Sparkline({ history }: { history: RouteInsight["history"] }) {
  const w = 320, h = 56, pad = 4;
  const vals = history.map((p) => p.cash);
  const min = Math.min(...vals), max = Math.max(...vals);
  const x = (i: number) => pad + (i / (history.length - 1)) * (w - pad * 2);
  const y = (v: number) => h - pad - ((v - min) / Math.max(1, max - min)) * (h - pad * 2);
  const d = history.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.cash).toFixed(1)}`).join(" ");
  const last = history[history.length - 1], first = history[0];
  const trend = Math.round(((last.cash - first.cash) / first.cash) * 100);
  return (
    <figure className="mt-3">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-14" role="img" aria-label={`Histórico de 30 dias: de ${brl(first.cash)} para ${brl(last.cash)}`}>
        <path d={d} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(history.length - 1)} cy={y(last.cash)} r="3" fill="var(--primary)" />
      </svg>
      <figcaption className="text-[11px] text-ink-muted flex justify-between">
        <span>Menor preço diário, últimos 30 dias</span>
        <span className={trend < 0 ? "text-good" : trend > 0 ? "text-warn" : ""}>{trend > 0 ? "+" : ""}{trend}% no período</span>
      </figcaption>
    </figure>
  );
}
