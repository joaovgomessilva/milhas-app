"use client";

/** Apaga tudo que o app guardou neste aparelho. Funciona na hora, sem e-mail nem espera. */
export function eraseAllLocalData() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith("milhas-app:")) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {}
}
