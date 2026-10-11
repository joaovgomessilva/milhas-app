import { PromosList } from "@/components/PromosList";

export default function PromosPage() {
  return (
    <main className="px-4 pt-6 pb-4 flex flex-col gap-5">
      <header>
        <h1 className="text-[26px] font-semibold">Promoções de transferência</h1>
      </header>
      <PromosList />
    </main>
  );
}
