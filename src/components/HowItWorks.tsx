"use client";

import { useLocalValue } from "@/lib/local-store";

const STEPS = [
  { n: 1, title: "Escolha a rota e o mês", body: "Você vê o preço de todos os dias de uma vez, em dinheiro e em milhas." },
  { n: 2, title: "Toque num dia", body: "Aparecem os voos e a Dica: usar milhas, pagar em dinheiro ou transferir com bônus, com a conta aberta." },
  { n: 3, title: "Confira na companhia", body: "O botão \"Ver na companhia\" abre a busca já preenchida. A compra é lá, com segurança. A gente não pede sua senha de nada." },
];

/** Cartão "Como funciona" na primeira visita. Some depois que a pessoa toca em "Entendi". */
export function HowItWorks() {
  const [state, set, hydrated] = useLocalValue<{ dismissed: boolean }>("milhas-app:onboarding:v1", { dismissed: false });
  if (!hydrated || state.dismissed) return null;
  return (
    <section className="card p-4 border border-primary/30 fade-in" aria-label="Como funciona">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Como funciona</p>
      <ol className="mt-2 flex flex-col gap-3">
        {STEPS.map((s) => (
          <li key={s.n} className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-primary-soft text-primary-strong text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5" aria-hidden>{s.n}</span>
            <div>
              <p className="font-medium text-ink-strong text-sm">{s.title}</p>
              <p className="text-sm text-ink">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="btn-secondary w-full mt-4 !min-h-[40px] text-sm" onClick={() => set({ dismissed: true })}>Entendi</button>
    </section>
  );
}
