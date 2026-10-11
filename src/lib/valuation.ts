/**
 * Motor de recomendação: "vale a pena usar milhas?"
 *
 * Regra central: custo implícito do milheiro = (preço em dinheiro − taxas) / (milhas / 1000).
 * Se esse custo é MAIOR que o valor de referência do programa, as milhas rendem mais
 * que o normal nessa emissão → vale usar (ou até comprar/transferir com bônus).
 * Se é MENOR, as milhas estão sendo "gastas caras" → pague em dinheiro e guarde-as.
 */
import {
  BANK_PROGRAMS,
  PROGRAMS,
  TRANSFER_BONUSES,
  type BankProgramId,
  type ProgramId,
  type TransferBonus,
} from "@/data/programs";
import type { MilesFare } from "./providers/types";

export type Wallet = Partial<Record<ProgramId | BankProgramId, number>>;

export type Verdict = "use-miles" | "pay-cash" | "transfer" | "buy-transfer";

export type Recommendation = {
  verdict: Verdict;
  title: string;
  /** Explicação em 2–3 frases, linguagem simples. */
  explanation: string;
  /** Custo implícito do milheiro nesta emissão (R$/1.000). */
  impliedPer1000: number;
  referencePer1000: number;
  /** Quanto a pessoa economiza escolhendo a recomendação em vez da alternativa (R$ por passageiro). */
  savings: number;
  /** Custo total estimado da opção recomendada em R$ (inclui taxas e, se houver, compra de pontos). */
  totalCost: number;
  /** Equivalente em R$ das milhas gastas, pelo valor de referência. */
  milesValue: number;
  bonus?: TransferBonus;
  /** pontos do banco necessários, já considerando o bônus */
  bankPointsNeeded?: number;
  bankProgram?: BankProgramId;
};

export const activeBonusesFor = (program: ProgramId, today = new Date()) =>
  TRANSFER_BONUSES.filter((b) => b.to === program && new Date(b.until + "T23:59:59") >= today).sort(
    (a, b) => b.bonus - a.bonus,
  );

export function recommend(cash: number, fare: MilesFare, wallet: Wallet, today = new Date()): Recommendation {
  const program = PROGRAMS[fare.program];
  const ref = program.referenceValuePer1000;
  const milheiros = fare.miles / 1000;
  const implied = Math.max(0, (cash - fare.taxes) / milheiros);
  const milesValue = milheiros * ref;
  const milesTotalEquivalent = milesValue + fare.taxes;
  const has = (wallet[fare.program] ?? 0) >= fare.miles;

  const fmt = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  // 1) Tem milhas e a emissão rende acima da referência → usar.
  if (has && implied >= ref) {
    return {
      verdict: "use-miles",
      title: "Vale usar suas milhas",
      explanation: `Nesta emissão cada 1.000 milhas ${program.name} valem ${brl(implied)}, acima da referência de ${brl(ref)}. Pagar em dinheiro custaria ${brl(cash)}; com milhas você paga só ${brl(fare.taxes)} de taxas.`,
      impliedPer1000: implied,
      referencePer1000: ref,
      savings: cash - milesTotalEquivalent,
      totalCost: fare.taxes,
      milesValue,
    };
  }

  // 2) Não tem milhas, mas há bônus de transferência que torna a compra vantajosa.
  const bonus = activeBonusesFor(fare.program, today)[0];
  if (!has && bonus) {
    const bank = BANK_PROGRAMS[bonus.from];
    const bankPointsNeeded = Math.ceil(fare.miles / (1 + bonus.bonus) / 100) * 100;
    const hasBank = (wallet[bonus.from] ?? 0) >= bankPointsNeeded;
    const buyCost = (bankPointsNeeded / 1000) * bank.promoBuyPricePer1000;
    if (hasBank && implied >= ref * 0.8) {
      return {
        verdict: "transfer",
        title: `Transfira ${bank.name} → ${program.name} com ${Math.round(bonus.bonus * 100)}% de bônus`,
        explanation: `Com o bônus, ${fmt(bankPointsNeeded)} pontos ${bank.name} viram ${fmt(fare.miles)} milhas ${program.name}. Você usa pontos que já tem e paga apenas ${brl(fare.taxes)} de taxas em vez de ${brl(cash)}. A promoção vale até ${new Date(bonus.until + "T12:00").toLocaleDateString("pt-BR")}.`,
        impliedPer1000: implied,
        referencePer1000: ref,
        savings: cash - fare.taxes - (bankPointsNeeded / 1000) * (bank.promoBuyPricePer1000 * 0.6),
        totalCost: fare.taxes,
        milesValue,
        bonus,
        bankPointsNeeded,
        bankProgram: bonus.from,
      };
    }
    const total = buyCost + fare.taxes;
    if (total < cash * 0.85) {
      return {
        verdict: "buy-transfer",
        title: "Compre pontos em promoção e transfira com bônus",
        explanation: `Comprando ${fmt(bankPointsNeeded)} pontos ${bank.name} a cerca de ${brl(bank.promoBuyPricePer1000)} o milheiro (${brl(buyCost)}) e transferindo com ${Math.round(bonus.bonus * 100)}% de bônus, você emite por ${brl(total)} com taxas, contra ${brl(cash)} em dinheiro. Só faça isso se a compra estiver mesmo em promoção.`,
        impliedPer1000: implied,
        referencePer1000: ref,
        savings: cash - total,
        totalCost: total,
        milesValue,
        bonus,
        bankPointsNeeded,
        bankProgram: bonus.from,
      };
    }
  }

  // 3) Tem milhas mas a emissão rende pouco → guardar.
  if (has) {
    return {
      verdict: "pay-cash",
      title: "Pague em dinheiro e guarde as milhas",
      explanation: `Aqui cada 1.000 milhas ${program.name} valeriam só ${brl(implied)}, abaixo da referência de ${brl(ref)}. Suas ${fmt(fare.miles)} milhas valem cerca de ${brl(milesValue)} em uma emissão melhor. Pagar ${brl(cash)} agora é o uso mais eficiente.`,
      impliedPer1000: implied,
      referencePer1000: ref,
      savings: milesTotalEquivalent - cash,
      totalCost: cash,
      milesValue,
    };
  }

  // 4) Não tem milhas e não há promoção boa → dinheiro.
  return {
    verdict: "pay-cash",
    title: "Pague em dinheiro",
    explanation: `Você não tem ${fmt(fare.miles)} milhas ${program.name} e não há bônus de transferência que compense comprar pontos agora. O preço em dinheiro, ${brl(cash)}, é a opção mais simples. Cadastre seus saldos na Carteira para recomendações melhores.`,
    impliedPer1000: implied,
    referencePer1000: ref,
    savings: 0,
    totalCost: cash,
    milesValue,
  };
}

/** Valor estimado da carteira em R$ pelo valor de referência (não pelo valor de venda). */
export function walletValue(wallet: Wallet) {
  let total = 0;
  for (const p of Object.values(PROGRAMS)) total += ((wallet[p.id] ?? 0) / 1000) * p.referenceValuePer1000;
  for (const b of Object.values(BANK_PROGRAMS)) {
    // ponto de banco vale o que vira em milhas com o melhor bônus ativo
    const best = TRANSFER_BONUSES.filter((t) => t.from === b.id).sort((x, y) => y.bonus - x.bonus)[0];
    const mult = best ? 1 + best.bonus : 1;
    const ref = best ? PROGRAMS[best.to].referenceValuePer1000 : 20;
    total += ((wallet[b.id] ?? 0) * mult / 1000) * ref;
  }
  return total;
}
