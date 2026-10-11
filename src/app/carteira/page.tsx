import { WalletView } from "@/components/WalletView";

export default function WalletPage() {
  return (
    <main className="px-4 pt-6 pb-4 flex flex-col gap-5">
      <header>
        <h1 className="text-[26px] font-semibold">Carteira</h1>
        <p className="text-ink-muted mt-1">Informe seus saldos. Com eles, as dicas dizem quando usar, transferir ou guardar.</p>
      </header>
      <WalletView />
    </main>
  );
}
