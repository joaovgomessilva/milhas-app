"use client";

import { useLocalValue } from "./local-store";
import type { Wallet } from "./valuation";

const KEY = "milhas-app:wallet:v1";
const EMPTY: Wallet = {};

/** Saldos informados à mão (fase 1). Persistem só no navegador. */
export function useWallet() {
  const [wallet, update, loaded] = useLocalValue<Wallet>(KEY, EMPTY);
  return { wallet, update, loaded };
}
