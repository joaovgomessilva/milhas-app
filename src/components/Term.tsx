"use client";

import { GLOSSARY, type GlossaryKey } from "@/data/glossary";
import { useEffect, useState } from "react";

/**
 * Palavra com "o que é isso?" de um toque. Abre um sheet curto com a explicação.
 * Uso: <Term k="milheiro">milheiro</Term>
 */
export function Term({ k, children }: { k: GlossaryKey; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const g = GLOSSARY[k];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="inline-flex items-center gap-0.5 underline decoration-dotted decoration-ink-muted/70 underline-offset-[3px] text-inherit"
        aria-label={`${g.term}: o que é isso?`}
      >
        {children ?? g.term}
        <span aria-hidden className="inline-flex w-3.5 h-3.5 rounded-full bg-surface-2 text-ink-muted text-[9px] font-bold items-center justify-center leading-none">?</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40" onClick={(e) => { e.stopPropagation(); setOpen(false); }}>
          <div role="dialog" aria-label={g.term} className="sheet-enter w-full max-w-lg bg-surface rounded-t-[20px] sm:rounded-[20px] p-5" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">O que é isso?</p>
            <h3 className="text-lg font-semibold mt-1">{g.term}</h3>
            <p className="text-ink-strong font-medium mt-1">{g.short}</p>
            <p className="text-sm text-ink mt-2">{g.body}</p>
            <button type="button" className="btn-primary w-full mt-4" onClick={() => setOpen(false)}>Entendi</button>
          </div>
        </div>
      )}
    </>
  );
}
