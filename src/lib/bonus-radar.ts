/**
 * Radar de bônus: diz se uma promoção de transferência é boa, normal ou fraca, com a conta à vista.
 *
 * Duas réguas, nesta ordem:
 * 1. Histórico do par (banco → programa): o bônus está no nível do que esse par costuma pagar?
 * 2. Custo do milheiro comprando pontos em promoção: fica abaixo do valor de referência do programa?
 * Uma promoção é "boa" quando passa nas duas; "fraca" quando perde feio em qualquer uma.
 */
import {
  BANK_PROGRAMS,
  PROGRAMS,
  TRANSFER_BONUSES,
  TRANSFER_BONUS_HISTORY,
  type TransferBonus,
} from "@/data/programs";

export type BonusLevel = "good" | "ok" | "weak";

export type BonusAnalysis = {
  bonus: TransferBonus;
  level: BonusLevel;
  label: string;
  /** Uma frase com o motivo principal. */
  summary: string;
  /** Linhas curtas da conta, para o "por quê". */
  reasons: string[];
  /** Milhas por 1.000 pontos do banco. */
  milesPer1000: number;
  /** R$ por 1.000 milhas comprando pontos em promoção e transferindo com o bônus. */
  costPer1000Promo: number;
  /** R$ por 1.000 milhas comprando pontos a preço cheio. */
  costPer1000Full: number;
  referencePer1000: number;
  /** Mediana dos bônus encerrados do mesmo par (null se não houver histórico). */
  typicalBonus: number | null;
  /** Maior bônus encerrado do mesmo par. */
  bestBonus: number | null;
  historyCount: number;
};

const pct = (x: number) => `${Math.round(x * 100)}%`;
const money = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function median(xs: number[]) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function pairHistory(b: Pick<TransferBonus, "from" | "to">) {
  return TRANSFER_BONUS_HISTORY.filter((h) => h.from === b.from && h.to === b.to);
}

export function analyzeBonus(b: TransferBonus): BonusAnalysis {
  const bank = BANK_PROGRAMS[b.from];
  const prog = PROGRAMS[b.to];
  const mult = 1 + b.bonus;
  const milesPer1000 = 1000 * mult;
  const costPer1000Promo = bank.promoBuyPricePer1000 / mult;
  const costPer1000Full = bank.buyPricePer1000 / mult;
  const ref = prog.referenceValuePer1000;

  const history = pairHistory(b).map((h) => h.bonus);
  const typical = median(history);
  const best = history.length ? Math.max(...history) : null;

  const cheap = costPer1000Promo <= ref * 0.8;
  const expensive = costPer1000Promo > ref;
  const aboveTypical = typical == null || b.bonus >= typical;
  const wellBelowTypical = typical != null && b.bonus < typical * 0.8;

  const reasons: string[] = [
    `1.000 pontos ${bank.name} viram ${milesPer1000.toLocaleString("pt-BR")} milhas ${prog.name}.`,
    `Comprando pontos em promoção (~${money(bank.promoBuyPricePer1000)} o milheiro), cada 1.000 milhas sai por ${money(costPer1000Promo)}. A referência ${prog.name} é ${money(ref)}.`,
  ];
  if (typical != null) {
    reasons.push(
      `Nas últimas ${history.length} promoções desse par, o bônus típico foi ${pct(typical)}${best != null && best > typical ? ` e o maior foi ${pct(best)}` : ""}.`,
    );
  } else {
    reasons.push("Ainda não temos histórico desse par para comparar.");
  }

  let level: BonusLevel;
  let summary: string;
  if (cheap && aboveTypical) {
    level = "good";
    summary = best != null && b.bonus >= best
      ? "Igual ou acima do maior bônus recente, e a milha sai bem abaixo da referência."
      : "No nível das melhores promoções desse par, e a milha sai bem abaixo da referência.";
  } else if (expensive || wellBelowTypical) {
    level = "weak";
    summary = wellBelowTypical
      ? `Abaixo do que esse par costuma pagar (${pct(typical!)}). Se puder, espere.`
      : "Mesmo com o bônus, comprar pontos para transferir sai acima da referência.";
  } else {
    level = "ok";
    summary = cheap
      ? "A milha sai barata, mas o bônus está abaixo do típico desse par."
      : "Bônus no nível típico, mas a milha não sai tão barata comprando pontos.";
  }

  return {
    bonus: b,
    level,
    label: level === "good" ? "Bom" : level === "ok" ? "Normal" : "Fraco",
    summary,
    reasons,
    milesPer1000,
    costPer1000Promo,
    costPer1000Full,
    referencePer1000: ref,
    typicalBonus: typical,
    bestBonus: best,
    historyCount: history.length,
  };
}

/** Dias até o fim (0 = termina hoje). `today` é o índice de dia de useTodayIndex. */
export function daysLeft(until: string, today: number) {
  return Math.floor(new Date(until + "T12:00").getTime() / 86400000) - today;
}

/** Promoções ativas analisadas: boas primeiro; dentro do mesmo nível, as que acabam antes. */
export function activeBonusRadar(today: number) {
  const order: Record<BonusLevel, number> = { good: 0, ok: 1, weak: 2 };
  return TRANSFER_BONUSES.filter((b) => today === 0 || daysLeft(b.until, today) >= 0)
    .map(analyzeBonus)
    .sort((a, b) => order[a.level] - order[b.level] || a.bonus.until.localeCompare(b.bonus.until));
}

/** Encerradas, mais recentes primeiro. */
export function recentEndedBonuses(limit = 6) {
  return [...TRANSFER_BONUS_HISTORY].sort((a, b) => b.until.localeCompare(a.until)).slice(0, limit);
}
