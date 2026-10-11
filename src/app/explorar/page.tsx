import { Suspense } from "react";
import { ExploreView } from "@/components/ExploreView";

export default function ExplorePage() {
  return (
    <main className="px-4 pt-6 pb-4 flex flex-col gap-4">
      <header>
        <h1 className="text-[26px] font-semibold">Para onde dá para ir?</h1>
        <p className="text-ink-muted mt-1">Todos os destinos a partir da sua cidade, do mais barato ao mais caro. Com seus saldos na Carteira, mostramos o que já cabe nas suas milhas.</p>
      </header>
      <Suspense>
        <ExploreView />
      </Suspense>
    </main>
  );
}
