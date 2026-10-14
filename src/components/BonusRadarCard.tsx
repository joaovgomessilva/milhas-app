"use client";

import { BANK_PROGRAMS, PROGRAMS } from "@/data/programs";
import { activeBonusRadar } from "@/lib/bonus-radar";
import { useTodayIndex } from "@/lib/local-store";
import Link from "next/link";
import { DaysChip, LEVEL_STYLE } from "./PromosList";

/** Card da home: o melhor bônus ativo agora, com veredito e prazo. */
export function BonusRadarCard() {
  const today = useTodayIndex();
  const radar = activeBonusRadar(today);
  if (!radar.length) return null;
  const top = radar[0];
  const good = radar.filter((a) => a.level === "good").length;
  return (
    <Link href="/promocoes" className="card p-4 flex flex-col gap-3 active:scale-[0.98] transition-transform" aria-label="Radar de bônus: ver todas as promoções">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Radar de bônus</p>
        <span className="text-xs text-ink-muted">
          {radar.length} {radar.length === 1 ? "ativa" : "ativas"}{good ? ` · ${good} ${good === 1 ? "boa" : "boas"}` : ""} ›
        </span>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-ink-muted">{BANK_PROGRAMS[top.bonus.from].name} → {PROGRAMS[top.bonus.to].name}</p>
          <p className="text-[24px] font-semibold leading-tight" style={{ color: PROGRAMS[top.bonus.to].color }}>+{Math.round(top.bonus.bonus * 100)}%</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${LEVEL_STYLE[top.level]}`}>{top.label}</span>
          <DaysChip until={top.bonus.until} today={today} />
        </div>
      </div>
      <p className="text-sm text-ink">{top.summary}</p>
    </Link>
  );
}
