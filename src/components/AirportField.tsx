"use client";

import { AIRPORTS, airportByCode } from "@/data/airports";
import { useId, useState } from "react";

type Props = { label: string; value: string; onChange: (code: string) => void; exclude?: string };

export function AirportField({ label, value, onChange, exclude }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const current = airportByCode(value);

  const results = AIRPORTS.filter((a) => a.code !== exclude).filter((a) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return a.code.toLowerCase().includes(s) || a.city.toLowerCase().includes(s) || a.name.toLowerCase().includes(s);
  });

  return (
    <div className="relative min-w-0">
      <label htmlFor={id} className="label">{label}</label>
      <button
        id={id}
        type="button"
        className="field text-left flex items-center justify-between gap-2 min-w-0"
        onClick={() => { setOpen(true); setQ(""); }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {current ? (
          <span className="flex items-baseline gap-2 min-w-0">
            <span className="font-semibold text-ink-strong">{current.code}</span>
            <span className="text-ink-muted truncate text-sm">{current.city}</span>
          </span>
        ) : (
          <span className="text-ink-muted">Escolha o aeroporto</span>
        )}
        <ChevronIcon />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="sheet-enter w-full max-w-lg bg-surface rounded-t-[20px] sm:rounded-[20px] p-4 max-h-[85dvh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={label}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">{label}</h2>
              <button type="button" className="btn-secondary !min-h-[36px] px-3 text-sm" onClick={() => setOpen(false)}>Fechar</button>
            </div>
            <input
              autoFocus
              className="field mb-3"
              placeholder="Cidade ou código (ex.: GRU)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Buscar aeroporto"
            />
            <ul role="listbox" className="overflow-y-auto -mx-1 px-1 divide-y divide-border">
              {results.map((a) => (
                <li key={a.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={a.code === value}
                    className="w-full text-left py-3 flex items-center gap-3 min-h-[52px]"
                    onClick={() => { onChange(a.code); setOpen(false); }}
                  >
                    <span className="w-12 shrink-0 text-center font-semibold text-ink-strong bg-surface-2 rounded-lg py-1 text-sm">{a.code}</span>
                    <span className="min-w-0">
                      <span className="block text-ink-strong font-medium">{a.city}</span>
                      <span className="block text-sm text-ink-muted truncate">{a.name}{a.country === "INTL" ? " · Internacional" : ""}</span>
                    </span>
                  </button>
                </li>
              ))}
              {results.length === 0 && <li className="py-6 text-center text-ink-muted">Nenhum aeroporto encontrado.</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-ink-muted shrink-0" aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
