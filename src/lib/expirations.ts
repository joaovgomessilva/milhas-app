"use client";

/**
 * Pontos a vencer, informados à mão (fase 1). Grátis, sem senha.
 * Resposta direta ao concorrente: AwardWallet passou datas de vencimento e alertas para o pago em 1/10/2026,
 * e o Oktoplus põe "equipe monitorando seus pontos a vencer" no Premium.
 *
 * Lembretes: nesta fase não há push. O app avisa quando abre e gera um arquivo de calendário (.ics)
 * com alarmes a 90, 60, 30 e 7 dias, que funciona no celular sem backend.
 */
import { BANK_PROGRAMS, PROGRAMS, type BankProgramId, type ProgramId } from "@/data/programs";
import { useLocalValue } from "./local-store";
import { walletValue } from "./valuation";

export type ExpiryProgramId = ProgramId | BankProgramId;

export type ExpiryLot = {
  id: string;
  program: ExpiryProgramId;
  points: number;
  /** YYYY-MM-DD, último dia de validade */
  date: string;
  /** opcional, para família: "Ana", "Pai"... */
  owner?: string;
  createdAt: string;
};

type Store = { lots: ExpiryLot[] };
const KEY = "milhas-app:expirations:v1";
const EMPTY: Store = { lots: [] };

export function useExpirations() {
  const [store, set, loaded] = useLocalValue<Store>(KEY, EMPTY);
  return {
    lots: store.lots,
    loaded,
    add(l: Omit<ExpiryLot, "id" | "createdAt">) {
      const lot: ExpiryLot = { ...l, id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, createdAt: new Date().toISOString() };
      set({ lots: [...store.lots, lot] });
      return lot;
    },
    remove(id: string) {
      set({ lots: store.lots.filter((l) => l.id !== id) });
    },
  };
}

/** Marcos em que avisamos (dias antes do vencimento). */
export const REMINDER_DAYS = [90, 60, 30, 7] as const;

export type ExpiryStage = "expired" | "week" | "month" | "soon" | "later";

export function programName(id: ExpiryProgramId) {
  return id in PROGRAMS ? PROGRAMS[id as ProgramId].name : BANK_PROGRAMS[id as BankProgramId].name;
}

export function isAirlineProgram(id: ExpiryProgramId): id is ProgramId {
  return id in PROGRAMS;
}

const dayIndex = (iso: string) => Math.floor(new Date(iso + "T12:00").getTime() / 86400000);

export function expiryInfo(lot: ExpiryLot, today: number) {
  const days = dayIndex(lot.date) - today;
  const stage: ExpiryStage = days < 0 ? "expired" : days <= 7 ? "week" : days <= 30 ? "month" : days <= 90 ? "soon" : "later";
  // Valor em risco pelo mesmo critério da Carteira (referência; banco já com o melhor bônus ativo).
  const value = walletValue({ [lot.program]: lot.points });
  return { days, stage, value };
}

/** O que fazer, em linguagem simples, conforme o prazo. */
export function expiryAdvice(lot: ExpiryLot, days: number) {
  const name = programName(lot.program);
  if (days < 0) return `Venceu. Alguns programas permitem reativar pontos vencidos pagando uma taxa: vale conferir no site da ${name}.`;
  if (isAirlineProgram(lot.program)) {
    return days <= 30
      ? `Use antes de vencer: emita uma passagem, mesmo curta, ou troque por produtos no site da ${name}. Qualquer movimentação na conta às vezes renova a validade: confira a regra do programa.`
      : `Dá tempo de planejar uma viagem. Busque uma rota e veja se as milhas rendem acima da referência.`;
  }
  return days <= 30
    ? `Transfira para um programa aéreo (de preferência com bônus) ou troque no site da ${name}. Milhas transferidas ganham validade nova no programa de destino.`
    : `Acompanhe o radar de bônus: transferir com bônus antes do vencimento rende mais.`;
}

/** Lotes que merecem aviso (até 90 dias ou já vencidos há até 30 dias), do mais urgente ao menos. */
export function urgentLots(lots: ExpiryLot[], today: number) {
  return lots
    .map((l) => ({ lot: l, ...expiryInfo(l, today) }))
    .filter((x) => x.days <= 90 && x.days >= -30)
    .sort((a, b) => a.days - b.days);
}

const icsDate = (iso: string) => iso.replace(/-/g, "");
const icsEscape = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
/** RFC 5545: linhas com mais de 75 octetos continuam na linha seguinte começando com espaço. */
const icsFold = (line: string) => {
  const out: string[] = [];
  let cur = "", bytes = 0;
  for (const ch of line) {
    const b = new TextEncoder().encode(ch).length;
    if (bytes + b > (out.length ? 74 : 75)) { out.push(cur); cur = ""; bytes = 0; }
    cur += ch; bytes += b;
  }
  out.push(cur);
  return out.join("\r\n ");
};

/**
 * Arquivo de calendário com um evento no dia do vencimento e alarmes a 90/60/30/7 dias.
 * Só inclui os alarmes que ainda estão no futuro.
 */
export function expiryIcs(lot: ExpiryLot, today: number) {
  const name = programName(lot.program);
  const pts = lot.points.toLocaleString("pt-BR");
  const days = dayIndex(lot.date) - today;
  const next = new Date(new Date(lot.date + "T12:00").getTime() + 86400000).toISOString().slice(0, 10);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const title = `Vencem ${pts} pontos ${name}${lot.owner ? ` (${lot.owner})` : ""}`;
  const alarms = REMINDER_DAYS.filter((d) => d < days).map((d) =>
    ["BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsEscape(`${title} em ${d} dias`)}`, `TRIGGER:-P${d}D`, "END:VALARM"].join("\r\n"),
  );
  // Sempre lembra no próprio dia, às 9h.
  alarms.push(["BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsEscape(`${title} hoje`)}`, "TRIGGER:PT9H", "END:VALARM"].join("\r\n"));
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Milhas App//Vencimentos//PT",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${lot.id}@milhas-app`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${icsDate(lot.date)}`,
    `DTEND;VALUE=DATE:${icsDate(next)}`,
    `SUMMARY:${icsEscape(title)}`,
    `DESCRIPTION:${icsEscape(`${expiryAdvice(lot, Math.max(days, 0))}\nLembrete criado pelo Milhas App. Seus dados ficam só no seu aparelho.`)}`,
    ...alarms,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n").split("\r\n").map(icsFold).join("\r\n");
}

export function downloadIcs(lot: ExpiryLot, today: number) {
  const blob = new Blob([expiryIcs(lot, today)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vencimento-${lot.program}-${lot.date}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
