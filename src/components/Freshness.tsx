"use client";

import type { PriceMeta } from "@/lib/providers/types";
import { useSyncExternalStore } from "react";
import { Term } from "./Term";

/** Minuto atual (0 no servidor) para calcular "há X min" sem quebrar a prerenderização. */
function useMinute() {
  const get = () => Math.floor(Date.now() / 60000);
  return useSyncExternalStore(
    (cb) => { const id = setInterval(cb, 30000); return () => clearInterval(id); },
    get,
    () => 0,
  );
}

export function relativeTime(iso: string, nowMinute: number) {
  if (!nowMinute) return "";
  const diff = nowMinute - Math.floor(new Date(iso).getTime() / 60000);
  if (diff < 1) return "agora mesmo";
  if (diff < 60) return `há ${diff} min`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} d`;
}

/** Linha "Fonte · verificado há X" com o estado da fonte. */
export function Freshness({ meta, compact = false }: { meta: PriceMeta; compact?: boolean }) {
  const minute = useMinute();
  const rel = relativeTime(meta.checkedAt, minute);
  const tone = meta.status === "ok" ? "bg-good" : meta.status === "unstable" ? "bg-warn" : "bg-bad";
  const label = meta.status === "ok" ? "fonte ok" : meta.status === "unstable" ? "fonte instável" : "fonte fora do ar";
  return (
    <p className={`flex items-center gap-1.5 text-ink-muted ${compact ? "text-[11px]" : "text-xs"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${tone}`} aria-hidden />
      <span className="sr-only">{label}. </span>
      <Term k="fonte">{meta.source}</Term>
      {rel && <span>· verificado {rel}</span>}
    </p>
  );
}
