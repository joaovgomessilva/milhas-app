"use client";

import { CABINS, PROGRAMS, type CabinId, type ProgramId } from "@/data/programs";
import { monthLabel, shiftMonth } from "@/lib/format";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocalValue } from "@/lib/local-store";
import { AirportField } from "./AirportField";

const KEY = "milhas-app:last-search";

type FormState = {
  from: string;
  to: string;
  month: string;
  passengers: number;
  cabin: CabinId;
  budget: number; // 0 = sem limite
  programs: ProgramId[];
};

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const DEFAULT: FormState = {
  from: "GRU",
  to: "REC",
  month: shiftMonth(currentMonth(), 1),
  passengers: 1,
  cabin: "economy",
  budget: 0,
  programs: ["smiles", "latampass", "tudoazul"],
};

export function SearchForm() {
  const router = useRouter();
  const [saved, save] = useLocalValue<FormState>(KEY, DEFAULT);
  const [draft, setS] = useState<FormState | null>(null);
  const s = draft ?? saved;
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setS({ ...s, [k]: v });

  const months = Array.from({ length: 10 }, (_, i) => shiftMonth(currentMonth(), i));
  const valid = s.from && s.to && s.from !== s.to && s.programs.length > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    save(s);
    const p = new URLSearchParams({
      from: s.from, to: s.to, month: s.month, pax: String(s.passengers), cabin: s.cabin,
      budget: String(s.budget), programs: s.programs.join(","),
    });
    router.push(`/resultados?${p.toString()}`);
  }

  return (
    <form onSubmit={submit} className="card p-4 flex flex-col gap-5">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
        <AirportField label="Origem" value={s.from} onChange={(v) => set("from", v)} exclude={s.to} />
        <button
          type="button"
          aria-label="Inverter origem e destino"
          className="btn-secondary !min-h-[48px] w-12 px-0 mb-0"
          onClick={() => setS({ ...s, from: s.to, to: s.from })}
        >
          <SwapIcon />
        </button>
        <AirportField label="Destino" value={s.to} onChange={(v) => set("to", v)} exclude={s.from} />
      </div>

      <div>
        <label htmlFor="month" className="label">Mês da viagem</label>
        <select id="month" className="field" value={s.month} onChange={(e) => set("month", e.target.value)}>
          {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
        <p className="text-xs text-ink-muted mt-1.5">Você vê o preço de cada dia do mês e escolhe a data na próxima tela.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="label">Passageiros</span>
          <div className="flex items-center gap-1 bg-surface-2 rounded-[10px] p-1">
            <Stepper aria="Menos passageiros" onClick={() => set("passengers", Math.max(1, s.passengers - 1))}>−</Stepper>
            <span className="flex-1 text-center font-semibold text-ink-strong" aria-live="polite">{s.passengers}</span>
            <Stepper aria="Mais passageiros" onClick={() => set("passengers", Math.min(9, s.passengers + 1))}>+</Stepper>
          </div>
        </div>
        <div>
          <label htmlFor="cabin" className="label">Classe</label>
          <select id="cabin" className="field" value={s.cabin} onChange={(e) => set("cabin", e.target.value as CabinId)}>
            {CABINS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="budget" className="label">Quanto você aceita pagar por pessoa (opcional)</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted">R$</span>
          <input
            id="budget"
            inputMode="numeric"
            className="field pl-11"
            placeholder="Sem limite"
            value={s.budget || ""}
            onChange={(e) => set("budget", Number(e.target.value.replace(/\D/g, "")) || 0)}
          />
        </div>
        <p className="text-xs text-ink-muted mt-1.5">Dias acima desse valor aparecem apagados no calendário.</p>
      </div>

      <div>
        <span className="label">Programas que você tem ou quer considerar</span>
        <div className="flex flex-wrap gap-2">
          {Object.values(PROGRAMS).map((p) => {
            const on = s.programs.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                className="chip"
                data-on={on}
                aria-pressed={on}
                onClick={() => set("programs", on ? s.programs.filter((x) => x !== p.id) : [...s.programs, p.id])}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: p.color }} aria-hidden />
                {p.name}
              </button>
            );
          })}
        </div>
        {s.programs.length === 0 && <p className="text-xs text-bad mt-1.5">Escolha pelo menos um programa.</p>}
      </div>

      <button type="submit" className="btn-primary w-full" disabled={!valid}>
        Ver calendário de preços
      </button>
    </form>
  );
}

function Stepper({ children, onClick, aria }: { children: React.ReactNode; onClick: () => void; aria: string }) {
  return (
    <button type="button" aria-label={aria} onClick={onClick} className="w-11 h-10 rounded-lg bg-surface text-ink-strong text-xl font-medium shadow-soft active:scale-95 transition-transform">
      {children}
    </button>
  );
}

function SwapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" />
    </svg>
  );
}
