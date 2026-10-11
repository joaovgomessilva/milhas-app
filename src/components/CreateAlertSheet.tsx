"use client";

import { airportByCode } from "@/data/airports";
import { PROGRAMS, type CabinId, type ProgramId } from "@/data/programs";
import { useAlerts } from "@/lib/alerts-store";
import { monthLabel } from "@/lib/format";
import { useEffect, useState } from "react";

type Props = {
  from: string;
  to: string;
  month: string;
  passengers: number;
  cabin: CabinId;
  programs: ProgramId[];
  suggestedCash: number | null;
  suggestedMiles: number | null;
  onClose: () => void;
};

export function CreateAlertSheet(p: Props) {
  const { add } = useAlerts();
  const [flex, setFlex] = useState<"month" | "any" | "window">("month");
  const [dateFrom, setDateFrom] = useState(`${p.month}-01`);
  const [dateTo, setDateTo] = useState(`${p.month}-07`);
  const [maxCash, setMaxCash] = useState<number>(p.suggestedCash ? Math.floor(p.suggestedCash * 0.9 / 10) * 10 : 0);
  const [maxMiles, setMaxMiles] = useState<number>(p.suggestedMiles ? Math.floor(p.suggestedMiles * 0.9 / 1000) * 1000 : 0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && p.onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [p]);

  const windowOk = flex !== "window" || (dateFrom && dateTo && dateFrom <= dateTo);
  const valid = (maxCash > 0 || maxMiles > 0) && windowOk;

  function save() {
    if (!valid) return;
    add({ from: p.from, to: p.to, month: flex === "any" ? "any" : p.month, passengers: p.passengers, cabin: p.cabin, programs: p.programs, maxCash, maxMiles, ...(flex === "window" ? { dateFrom, dateTo } : {}) });
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={p.onClose}>
      <div role="dialog" aria-label="Criar alerta" className="sheet-enter w-full max-w-lg bg-surface rounded-t-[20px] sm:rounded-[20px] p-5 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="text-center py-2 fade-in">
            <div className="w-12 h-12 rounded-full bg-good-soft text-good mx-auto flex items-center justify-center" aria-hidden>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>
            </div>
            <h3 className="text-lg font-semibold mt-3">Alerta criado</h3>
            <p className="text-sm text-ink-muted mt-1">Veja em Alertas o preço atual e o menor já visto. A verificação roda quando você abre o app.</p>
            <button type="button" className="btn-primary w-full mt-4" onClick={p.onClose}>Fechar</button>
          </div>
        ) : (
          <>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Novo alerta</p>
              <h3 className="text-lg font-semibold mt-1">{airportByCode(p.from)?.city ?? p.from} → {airportByCode(p.to)?.city ?? p.to}</h3>
              <p className="text-sm text-ink-muted">{p.passengers} {p.passengers > 1 ? "pessoas" : "pessoa"} · {p.programs.map((x) => PROGRAMS[x].name).join(", ")}</p>
            </div>

            <div>
              <span className="label">Quando</span>
              <div className="segmented grid-cols-3" role="group">
                <button type="button" aria-pressed={flex === "month"} onClick={() => setFlex("month")}>{monthLabel(p.month).split(" ")[0]}</button>
                <button type="button" aria-pressed={flex === "window"} onClick={() => setFlex("window")}>Entre datas</button>
                <button type="button" aria-pressed={flex === "any"} onClick={() => setFlex("any")}>Qualquer</button>
              </div>
              {flex === "window" ? (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label htmlFor="al-from" className="label">De</label>
                    <input id="al-from" type="date" className="field" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="al-to" className="label">Até</label>
                    <input id="al-to" type="date" className="field" value={dateTo} min={dateFrom} onChange={(e) => setDateTo(e.target.value)} />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-ink-muted mt-1.5">{flex === "any" ? "Olha os próximos 6 meses inteiros." : "Olha todos os dias deste mês."}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="al-cash" className="label">Avisar se R$ ≤</label>
                <input id="al-cash" inputMode="numeric" className="field" placeholder="0" value={maxCash || ""} onChange={(e) => setMaxCash(Number(e.target.value.replace(/\D/g, "")) || 0)} />
              </div>
              <div>
                <label htmlFor="al-miles" className="label">Avisar se milhas ≤</label>
                <input id="al-miles" inputMode="numeric" className="field" placeholder="0" value={maxMiles || ""} onChange={(e) => setMaxMiles(Number(e.target.value.replace(/\D/g, "")) || 0)} />
              </div>
            </div>
            <p className="text-xs text-ink-muted -mt-2">Sugerimos 10% abaixo do menor preço de hoje. Preencha um ou os dois.</p>

            <button type="button" className="btn-primary w-full" disabled={!valid} onClick={save}>Criar alerta</button>
          </>
        )}
      </div>
    </div>
  );
}
