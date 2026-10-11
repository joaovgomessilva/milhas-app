"use client";

import { BANK_PROGRAMS, PROGRAMS, TRANSFER_BONUSES, type BankProgramId, type ProgramId } from "@/data/programs";
import { brl, num } from "@/lib/format";
import { walletValue, type Wallet } from "@/lib/valuation";
import { useWallet } from "@/lib/wallet-store";
import { eraseAllLocalData } from "@/lib/privacy";
import { useState } from "react";
import { Term } from "./Term";

export function WalletView() {
  const { wallet, update, loaded } = useWallet();
  const total = walletValue(wallet);
  const setVal = (k: keyof Wallet, raw: string) => update({ ...wallet, [k]: Number(raw.replace(/\D/g, "")) || 0 });

  const [confirm, setConfirm] = useState(false);
  if (!loaded) return <div className="skeleton h-40" />;

  return (
    <>
      <section className="card p-4 bg-primary text-on-primary" style={{ background: "var(--primary)" }}>
        <p className="text-sm opacity-80">Valor estimado dos seus pontos</p>
        <p className="text-[32px] font-semibold leading-tight mt-1">{brl(total)}</p>
        <p className="text-xs opacity-80 mt-1">Pelo valor de referência de cada programa, já contando o melhor bônus ativo para pontos de banco.</p>
      </section>

      <Group title="Programas aéreos" hint="Milhas que emitem passagem direto.">
        {Object.values(PROGRAMS).map((p) => (
          <Row key={p.id} id={p.id} name={p.name} color={p.color} value={wallet[p.id] ?? 0} onChange={(v) => setVal(p.id, v)} meta={`≈ ${brl(((wallet[p.id] ?? 0) / 1000) * p.referenceValuePer1000)} · referência ${brl(p.referenceValuePer1000)}/mil`} />
        ))}
      </Group>

      <Group title="Pontos de banco e cartão" hint="Viram milhas quando você transfere. Com bônus, rendem mais.">
        {Object.values(BANK_PROGRAMS).map((b) => {
          const best = TRANSFER_BONUSES.filter((t) => t.from === b.id).sort((x, y) => y.bonus - x.bonus)[0];
          return (
            <Row key={b.id} id={b.id} name={b.name} color="#64748b" value={wallet[b.id] ?? 0} onChange={(v) => setVal(b.id, v)} meta={best ? `bônus ativo: +${Math.round(best.bonus * 100)}% para ${PROGRAMS[best.to].name}` : "sem bônus ativo"} />
          );
        })}
      </Group>

      <p className="text-xs text-ink-muted">
        <Term k="referencia">Valor de referência</Term> é quanto 1.000 milhas costumam render. Os saldos ficam só neste aparelho. Na próxima fase, a atualização poderá ser automática, sem guardar a sua senha dos programas.
      </p>

      <section className="card p-4">
        <h2 className="text-base font-semibold">Seus dados</h2>
        <p className="text-sm text-ink-muted mt-1">Tudo que o app guarda (saldos, alertas, buscas) fica neste aparelho. Você apaga quando quiser, na hora.</p>
        {!confirm ? (
          <button type="button" className="btn-secondary mt-3 !min-h-[40px] text-sm" onClick={() => setConfirm(true)}>Apagar meus dados</button>
        ) : (
          <div className="mt-3 rounded-[12px] bg-bad-soft p-3 fade-in">
            <p className="text-sm font-medium text-ink-strong">Apagar tudo deste aparelho?</p>
            <p className="text-xs text-ink mt-0.5">Essa ação não pode ser desfeita.</p>
            <div className="flex gap-2 mt-3">
              <button type="button" className="btn-secondary flex-1 !min-h-[40px] text-sm" onClick={() => setConfirm(false)}>Cancelar</button>
              <button type="button" className="flex-1 min-h-[40px] rounded-[14px] bg-bad text-white text-sm font-semibold" onClick={() => { eraseAllLocalData(); update({}); setConfirm(false); }}>Apagar</button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function Group({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="text-xs text-ink-muted mb-2">{hint}</p>
      <div className="card divide-y divide-border">{children}</div>
    </section>
  );
}

function Row({ id, name, color, value, onChange, meta }: { id: ProgramId | BankProgramId; name: string; color: string; value: number; onChange: (v: string) => void; meta: string }) {
  return (
    <div className="p-3 flex items-center gap-3">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} aria-hidden />
      <label htmlFor={`w-${id}`} className="flex-1 min-w-0">
        <span className="block font-medium text-ink-strong">{name}</span>
        <span className="block text-xs text-ink-muted truncate">{meta}</span>
      </label>
      <input
        id={`w-${id}`}
        inputMode="numeric"
        className="field !w-32 text-right"
        placeholder="0"
        value={value ? num(value) : ""}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`Saldo ${name}`}
      />
    </div>
  );
}
