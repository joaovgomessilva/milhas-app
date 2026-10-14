import { PromosList } from "@/components/PromosList";

export default function PromosPage() {
  return (
    <main className="px-4 pt-6 pb-4 flex flex-col gap-5">
      <header>
        <h1 className="text-[26px] font-semibold">Radar de bônus</h1>
        <p className="text-ink-muted mt-1">Promoções de transferência com veredito: vale ou não vale, e por quê.</p>
      </header>
      <PromosList />
    </main>
  );
}
