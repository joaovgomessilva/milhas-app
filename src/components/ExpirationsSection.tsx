"use client";

import { BANK_PROGRAMS, PROGRAMS } from "@/data/programs";
import {
  downloadIcs,
  expiryAdvice,
  expiryInfo,
  programName,
  REMINDER_DAYS,
  useExpirations,
  type ExpiryLot,
  type ExpiryProgramId,
  type ExpiryStage,
} from "@/lib/expirations";
import { brl, num } from "@/lib/format";
import { useTodayIndex } from "@/lib/local-store";
import { useEffect, useState } from "react";
import { Term } from "./Term";

const STAGE_STYLE: Record<ExpiryStage, string> = {
  expired: "bg-bad-soft text-bad",
  week: "bg-bad-soft text-bad",
  month: "bg-warn-soft text-warn",
  soon: "bg-primary-soft text-primary-strong",
  later: "bg-surface-2 text-ink",
};

const PROGRAM_OPTIONS: { id: ExpiryProgramId; name: string }[] = [
  ...Object.values(PROGRAMS).map((p) => ({ id: p.id, name: p.name })),
  ...Object.values(BANK_PROGRAMS).map((b) => ({ id: b.id, name: b.name })),
];

/** Pontos a vencer na Carteira: cadastro manual, prazo, valor em risco, o que fazer e lembrete no calendário. */
export function ExpirationsSection() {
  const { lots, loaded, add, remove } = useExpirations();
  const today = useTodayIndex();
  const [adding, setAdding] = useState(false);

  // Links para /carteira#vencimentos: a seção só existe depois de ler o aparelho, então o navegador não acha a âncora sozinho.
  const ready = loaded && today !== 0;
  useEffect(() => {
    if (ready && window.location.hash === "#vencimentos") document.getElementById("vencimentos")?.scrollIntoView({ block: "start" });
  }, [ready]);

  const sorted = [...lots].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <section id="vencimentos" className="scroll-mt-4">
      <h2 className="text-base font-semibold">Pontos a vencer</h2>
      <p className="text-xs text-ink-muted mb-2">
        Grátis e sem senha. Copie a data do extrato do programa e a gente avisa a {REMINDER_DAYS.join(", ").replace(/, (\d+)$/, " e $1")} dias do <Term k="vencimento">vencimento</Term>.
      </p>

      {!ready ? (
        <div className="skeleton h-24" />
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.length === 0 && !adding && (
            <div className="card p-4 text-sm text-ink">
              Nenhum vencimento cadastrado. No extrato de cada programa aparece &quot;pontos a expirar&quot; com a data: é só copiar aqui.
            </div>
          )}

          {sorted.map((lot) => <LotCard key={lot.id} lot={lot} today={today} onRemove={() => remove(lot.id)} />)}

          {adding ? (
            <AddLotForm onCancel={() => setAdding(false)} onSave={(l) => { add(l); setAdding(false); }} today={today} />
          ) : (
            <button type="button" className="btn-secondary !min-h-[44px] text-sm" onClick={() => setAdding(true)}>+ Adicionar vencimento</button>
          )}
        </div>
      )}
    </section>
  );
}

function LotCard({ lot, today, onRemove }: { lot: ExpiryLot; today: number; onRemove: () => void }) {
  const { days, stage, value } = expiryInfo(lot, today);
  const color = lot.program in PROGRAMS ? PROGRAMS[lot.program as keyof typeof PROGRAMS].color : "#64748b";
  const when = new Date(lot.date + "T12:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  return (
    <article className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-ink-muted flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} aria-hidden />
            {programName(lot.program)}{lot.owner ? ` · ${lot.owner}` : ""}
          </p>
          <p className="text-[22px] font-semibold text-ink-strong leading-tight mt-0.5">{num(lot.points)} pontos</p>
          <p className="text-xs text-ink-muted">
            vencem em {when}{value > 0 && days >= 0 && <span className="whitespace-nowrap"> · ≈ {brl(value)}</span>}
          </p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${STAGE_STYLE[stage]}`}>
          {days < 0 ? "venceu" : days === 0 ? "vence hoje" : `${days} ${days === 1 ? "dia" : "dias"}`}
        </span>
      </div>
      {days <= 90 && <p className="text-sm text-ink mt-3">{expiryAdvice(lot, days)}</p>}
      <div className="flex gap-2 mt-3">
        {days >= 0 && (
          <button type="button" className="btn-secondary flex-1 !min-h-[40px] text-sm" onClick={() => downloadIcs(lot, today)}>
            Lembrete no calendário
          </button>
        )}
        <button type="button" onClick={onRemove} className="btn-secondary !min-h-[40px] px-3 text-sm text-bad" aria-label={`Excluir vencimento de ${programName(lot.program)}`}>Excluir</button>
      </div>
    </article>
  );
}

function AddLotForm({ onSave, onCancel, today }: { onSave: (l: Omit<ExpiryLot, "id" | "createdAt">) => void; onCancel: () => void; today: number }) {
  const [program, setProgram] = useState<ExpiryProgramId>("smiles");
  const [points, setPoints] = useState("");
  const [date, setDate] = useState("");
  const [owner, setOwner] = useState("");
  const minDate = new Date(today * 86400000).toISOString().slice(0, 10);
  const pts = Number(points.replace(/\D/g, "")) || 0;
  const valid = pts > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date);

  return (
    <form
      className="card p-4 flex flex-col gap-3 fade-in"
      onSubmit={(e) => { e.preventDefault(); if (valid) onSave({ program, points: pts, date, owner: owner.trim() || undefined }); }}
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-ink-strong">Programa</span>
        <select className="field" value={program} onChange={(e) => setProgram(e.target.value as ExpiryProgramId)}>
          {PROGRAM_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink-strong">Pontos</span>
          <input className="field" inputMode="numeric" placeholder="Ex.: 12.000" value={pts ? num(pts) : ""} onChange={(e) => setPoints(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink-strong">Vencem em</span>
          <input className="field" type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-ink-strong">De quem <span className="font-normal text-ink-muted">(opcional)</span></span>
        <input className="field" placeholder="Ex.: Ana, Pai" maxLength={24} value={owner} onChange={(e) => setOwner(e.target.value)} />
      </label>
      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1 !min-h-[44px] text-sm" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-primary flex-1 !min-h-[44px] text-sm" disabled={!valid}>Salvar</button>
      </div>
    </form>
  );
}
