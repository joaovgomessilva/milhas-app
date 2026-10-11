"use client";

import { BANK_PROGRAMS, PROGRAMS, TRANSFER_BONUSES } from "@/data/programs";
import { brl, num } from "@/lib/format";
import { useTodayIndex } from "@/lib/local-store";
import { Term } from "./Term";

export function PromosList() {
  const today = useTodayIndex();
  const sorted = [...TRANSFER_BONUSES].sort((a, b) => a.until.localeCompare(b.until));
  return (
    <>
      <p className="text-sm text-ink-muted">
        <Term k="bonus">Bônus</Term> ativos de banco para companhia aérea. Transferir com bônus é a forma mais barata de conseguir milhas.
      </p>
      <ul className="flex flex-col gap-3">
        {sorted.map((b) => {
          const bank = BANK_PROGRAMS[b.from];
          const prog = PROGRAMS[b.to];
          const milesPer1000 = 1000 * (1 + b.bonus);
          const costPer1000Miles = bank.promoBuyPricePer1000 / (1 + b.bonus);
          const days = Math.max(0, Math.floor(new Date(b.until + "T12:00").getTime() / 86400000) - today);
          const good = costPer1000Miles < prog.referenceValuePer1000 * 0.8;
          return (
            <li key={b.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-ink-muted">{bank.name} → {prog.name}</p>
                  <p className="text-[28px] font-semibold leading-tight" style={{ color: prog.color }}>+{Math.round(b.bonus * 100)}%</p>
                </div>
                {today === 0 ? (
                  <span className="skeleton h-6 w-16" aria-hidden />
                ) : (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${days <= 3 ? "bg-warn-soft text-warn" : "bg-surface-2 text-ink"}`}>
                    {days === 0 ? "termina hoje" : `${days} ${days === 1 ? "dia" : "dias"}`}
                  </span>
                )}
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3 text-sm">
                <dt className="text-ink-muted">1.000 pontos viram</dt><dd className="text-right font-medium">{num(milesPer1000)} milhas</dd>
                <dt className="text-ink-muted">Comprando em promo, o <Term k="milheiro">milheiro</Term> sai</dt><dd className="text-right font-medium">{brl(costPer1000Miles)}</dd>
                <dt className="text-ink-muted"><Term k="referencia">Referência</Term> {prog.name}</dt><dd className="text-right font-medium">{brl(prog.referenceValuePer1000)}</dd>
              </dl>
              {b.note && <p className="text-xs text-ink-muted mt-2">{b.note}</p>}
              <p className={`text-xs mt-2 font-medium ${good ? "text-good" : "text-ink-muted"}`}>
                {good ? "Bom negócio: milha sai bem abaixo da referência." : "Só compensa se você já tiver os pontos."}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-ink-muted">Promoções de exemplo. Na próxima fase, esta lista será atualizada automaticamente a partir de Livelo, Esfera e blogs especializados.</p>
    </>
  );
}
