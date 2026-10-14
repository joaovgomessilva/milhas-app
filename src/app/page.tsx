import { Suspense } from "react";
import { SearchForm } from "@/components/SearchForm";
import { HowItWorks } from "@/components/HowItWorks";
import { ExpiryNotice } from "@/components/ExpiryNotice";
import { BonusRadarCard } from "@/components/BonusRadarCard";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="px-4 pt-6 pb-4 flex flex-col gap-6">
      <header>
        <p className="text-sm font-medium text-primary">Milhas App · versão de teste</p>
        <h1 className="text-[28px] font-semibold mt-1">Para onde você quer ir?</h1>
        <p className="text-ink-muted mt-1">Compare o preço em dinheiro e em milhas dia a dia, e veja quando vale a pena usar seus pontos.</p>
      </header>
      <ExpiryNotice />
      <HowItWorks />
      <Suspense>
        <SearchForm />
      </Suspense>
      <Link href="/explorar" className="card p-4 flex items-center gap-3 active:scale-[0.98] transition-transform">
        <span className="w-10 h-10 rounded-full bg-miles-soft text-miles flex items-center justify-center shrink-0" aria-hidden>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-ink-strong">Não sabe para onde?</span>
          <span className="block text-sm text-ink-muted">Veja todos os destinos do mais barato ao mais caro, em R$ e em milhas, e quais cabem nos seus pontos.</span>
        </span>
        <span className="text-ink-muted" aria-hidden>›</span>
      </Link>
      <BonusRadarCard />
    </main>
  );
}
