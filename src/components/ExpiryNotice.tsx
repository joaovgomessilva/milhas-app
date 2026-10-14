"use client";

import { programName, urgentLots, useExpirations } from "@/lib/expirations";
import { brl, num } from "@/lib/format";
import { useTodayIndex } from "@/lib/local-store";
import Link from "next/link";

/** Aviso de pontos vencendo em até 90 dias. Aparece na home e em Alertas; some se não houver nada urgente. */
export function ExpiryNotice() {
  const { lots, loaded } = useExpirations();
  const today = useTodayIndex();
  if (!loaded || today === 0) return null;
  const urgent = urgentLots(lots, today);
  if (!urgent.length) return null;
  const first = urgent[0];
  const total = urgent.reduce((s, x) => s + (x.days >= 0 ? x.value : 0), 0);
  const tone = first.days <= 30 ? "border-warn/40" : "border-primary/30";
  return (
    <Link href="/carteira#vencimentos" className={`card p-4 border ${tone} flex items-start gap-3 active:scale-[0.98] transition-transform fade-in`}>
      <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${first.days <= 30 ? "bg-warn-soft text-warn" : "bg-primary-soft text-primary-strong"}`} aria-hidden>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5M9 2h6" /></svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-ink-strong">
          {first.days < 0
            ? `${num(first.lot.points)} pontos ${programName(first.lot.program)} venceram`
            : `${num(first.lot.points)} pontos ${programName(first.lot.program)} vencem ${first.days === 0 ? "hoje" : `em ${first.days} ${first.days === 1 ? "dia" : "dias"}`}`}
        </span>
        <span className="block text-sm text-ink-muted">
          {urgent.length > 1 ? `E mais ${urgent.length - 1} ${urgent.length - 1 === 1 ? "lote" : "lotes"} nos próximos 90 dias. ` : ""}
          {total > 0 ? `Cerca de ${brl(total)} em risco. ` : ""}Toque para ver o que fazer.
        </span>
      </span>
      <span className="text-ink-muted" aria-hidden>›</span>
    </Link>
  );
}
