"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Valor persistido no localStorage, lido via useSyncExternalStore.
 * No servidor (e na hidratação) devolve `fallback`; no cliente, o valor salvo.
 */
const listeners = new Map<string, Set<() => void>>();
const cache = new Map<string, { raw: string | null; parsed: unknown }>();

function read<T>(key: string, fallback: T): T {
  let raw: string | null = null;
  try { raw = localStorage.getItem(key); } catch {}
  const c = cache.get(key);
  if (c && c.raw === raw) return c.parsed as T;
  let parsed: T = fallback;
  if (raw != null) {
    try { parsed = { ...fallback, ...JSON.parse(raw) } as T; } catch {}
  }
  cache.set(key, { raw, parsed });
  return parsed;
}

function emit(key: string) {
  listeners.get(key)?.forEach((l) => l());
}

export function useLocalValue<T extends object>(key: string, fallback: T): [T, (next: T) => void, boolean] {
  const subscribe = useCallback((cb: () => void) => {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key)!.add(cb);
    const onStorage = (e: StorageEvent) => e.key === key && cb();
    window.addEventListener("storage", onStorage);
    return () => { listeners.get(key)!.delete(cb); window.removeEventListener("storage", onStorage); };
  }, [key]);

  const value = useSyncExternalStore(subscribe, () => read(key, fallback), () => fallback);
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);

  const set = useCallback((next: T) => {
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
    emit(key);
  }, [key]);

  return [value, set, hydrated];
}

/**
 * Dia atual (no fuso do aparelho) como número inteiro, seguro para usar durante o render.
 * Mesma escala de `Math.floor(new Date("YYYY-MM-DDT12:00").getTime() / 86400000)`, então a diferença
 * entre os dois é o número de dias do calendário local (sem virar o dia às 21h no Brasil).
 * No servidor devolve 0 (desconhecido): a UI mostra um placeholder até hidratar.
 */
export function useTodayIndex() {
  const day = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
  return useSyncExternalStore(() => () => {}, day, () => 0);
}
