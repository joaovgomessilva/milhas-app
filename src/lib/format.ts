export const brl = (n: number, digits = 0) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: digits, minimumFractionDigits: digits });

export const num = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

/** 12.500 → "12,5 mil" para caber no calendário */
export const compactMiles = (n: number) => {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k.toLocaleString("pt-BR", { maximumFractionDigits: k < 10 ? 1 : 0 })} mil`;
  }
  return num(n);
};

/** Para células do calendário: sem "R$" (a legenda indica), "12,5 mil" acima de 10 mil. */
export const compactBrl = (n: number) => {
  if (n >= 10000) return `${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return num(n);
};

export const duration = (min: number) => `${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}`;

export const MONTHS_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  const name = MONTHS_PT[m - 1];
  return `${name[0].toUpperCase()}${name.slice(1)} ${y}`;
};

export const longDate = (iso: string) =>
  new Date(iso + "T12:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

export const shiftMonth = (ym: string, delta: number) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
