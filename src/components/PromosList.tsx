"use client";

import { BANK_PROGRAMS, PROGRAMS } from "@/data/programs";
import { activeBonusRadar, daysLeft, recentEndedBonuses, type BonusAnalysis, type BonusLevel } from "@/lib/bonus-radar";
import { brl, num } from "@/lib/format";
import { useTodayIndex } from "@/lib/local-store";
import { Term } from "./Term";

export const LEVEL_STYLE: Record<BonusLevel, string> = {
  good: "bg-good-soft text-good",
  ok: "bg-surface-2 text-ink",
  weak: "bg-warn-soft text-warn",
};

export function DaysChip({ until, today }: { until: string; today: number }) {
  if (today === 0) return <span className="skeleton h-6 w-16" aria-hidden />;
  const days = daysLeft(until, today);
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${days <= 3 ? "bg-warn-soft text-warn" : "bg-surface-2 text-ink"}`}>
      {days <= 0 ? "termina hoje" : `${days} ${days === 1 ? "dia" : "dias"}`}
    </span>
  );
}

export function PromosList() {
  const today = useTodayIndex();
  const radar = activeBonusRadar(today);
  const ended = recentEndedBonuses();
  return (
    <>
      <p className="text-sm text-ink-muted">
        <Term k="bonus">Bônus</Term> ativos de banco para companhia aérea, com um veredito: <strong className="text-good">Bom</strong>, <strong className="text-ink">Normal</strong> ou <strong className="text-warn">Fraco</strong>. A gente compara com o histórico do par e com o <Term k="referencia">valor de referência</Term>, e mostra a conta.
      </p>
      <ul className="flex flex-col gap-3">
        {radar.map((a) => <BonusCard key={a.bonus.id} a={a} today={today} />)}
      </ul>

      <section>
        <h2 className="text-base font-semibold">Encerradas recentemente</h2>
        <p className="text-xs text-ink-muted mb-2">É a régua do veredito: mostra quanto cada par costuma pagar.</p>
        <ul className="card divide-y divide-border">
          {ended.map((b) => (
            <li key={b.id} className="p-3 flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">{BANK_PROGRAMS[b.from].name} → {PROGRAMS[b.to].name}</span>
              <span className="flex items-center gap-3 shrink-0">
                <span className="font-semibold" style={{ color: PROGRAMS[b.to].color }}>+{Math.round(b.bonus * 100)}%</span>
                <span className="text-xs text-ink-muted w-20 text-right">até {new Date(b.until + "T12:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-ink-muted">Promoções e histórico de exemplo. Na próxima fase, esta lista será atualizada automaticamente a partir de Livelo, Esfera e blogs especializados.</p>
    </>
  );
}

function BonusCard({ a, today }: { a: BonusAnalysis; today: number }) {
  const bank = BANK_PROGRAMS[a.bonus.from];
  const prog = PROGRAMS[a.bonus.to];
  return (
    <li className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink-muted">{bank.name} → {prog.name}</p>
          <p className="text-[28px] font-semibold leading-tight" style={{ color: prog.color }}>+{Math.round(a.bonus.bonus * 100)}%</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${LEVEL_STYLE[a.level]}`}>{a.label}</span>
          <DaysChip until={a.bonus.until} today={today} />
        </div>
      </div>
      <p className="text-sm text-ink mt-2">{a.summary}</p>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3 text-sm">
        <dt className="text-ink-muted">1.000 pontos viram</dt><dd className="text-right font-medium">{num(a.milesPer1000)} milhas</dd>
        <dt className="text-ink-muted">Comprando em promo, o <Term k="milheiro">milheiro</Term> sai</dt><dd className="text-right font-medium">{brl(a.costPer1000Promo)}</dd>
        <dt className="text-ink-muted"><Term k="referencia">Referência</Term> {prog.name}</dt><dd className="text-right font-medium">{brl(a.referencePer1000)}</dd>
        {a.typicalBonus != null && (<><dt className="text-ink-muted">Bônus típico do par</dt><dd className="text-right font-medium">+{Math.round(a.typicalBonus * 100)}%</dd></>)}
      </dl>
      {a.bonus.note && <p className="text-xs text-ink-muted mt-2">{a.bonus.note}</p>}
      <details className="mt-3 group">
        <summary className="text-sm font-medium text-primary cursor-pointer list-none flex items-center gap-1">
          Ver a conta <span className="transition-transform group-open:rotate-90" aria-hidden>›</span>
        </summary>
        <ul className="mt-2 flex flex-col gap-1.5 text-sm text-ink list-disc pl-5">
          {a.reasons.map((r) => <li key={r}>{r}</li>)}
          <li>A preço cheio (~{brl(bank.buyPricePer1000)} o milheiro de pontos), sairia {brl(a.costPer1000Full)} por 1.000 milhas: só compensa comprar em promoção.</li>
          <li>Se você já tem os pontos, transferir com bônus é sempre melhor que sem: cada 1.000 pontos rendem {num(a.milesPer1000 - 1000)} milhas a mais.</li>
        </ul>
      </details>
    </li>
  );
}
