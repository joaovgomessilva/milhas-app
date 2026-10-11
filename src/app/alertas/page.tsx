import { Suspense } from "react";
import { AlertsView } from "@/components/AlertsView";

export default function AlertsPage() {
  return (
    <main className="px-4 pt-6 pb-4 flex flex-col gap-5">
      <header>
        <h1 className="text-[26px] font-semibold">Alertas</h1>
        <p className="text-ink-muted mt-1">Rotas que você acompanha, com datas flexíveis e o menor preço já visto.</p>
      </header>
      <Suspense fallback={<div className="skeleton h-32" />}>
        <AlertsView />
      </Suspense>
    </main>
  );
}
