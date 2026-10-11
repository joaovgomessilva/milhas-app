"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Buscar", icon: SearchIcon },
  { href: "/alertas", label: "Alertas", icon: BoltIcon },
  { href: "/carteira", label: "Carteira", icon: WalletIcon },
  { href: "/aprender", label: "Aprender", icon: BookIcon },
] as const;

export function TabBar() {
  const path = usePathname();
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 bg-surface/95 backdrop-blur border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto max-w-lg grid grid-cols-4">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === "/" || path.startsWith("/resultados") : href === "/alertas" ? path.startsWith("/alertas") || path.startsWith("/promocoes") : path.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-1 h-[64px] text-[11px] font-medium transition-colors ${
                  active ? "text-primary" : "text-ink-muted"
                }`}
              >
                <Icon filled={active} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type IconProps = { filled: boolean };
const base = { width: 24, height: 24, viewBox: "0 0 24 24", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function SearchIcon({ filled }: IconProps) {
  return (
    <svg {...base} fill="none" stroke="currentColor" aria-hidden>
      <circle cx="11" cy="11" r="7" fill={filled ? "currentColor" : "none"} fillOpacity={filled ? 0.2 : 0} />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
function WalletIcon({ filled }: IconProps) {
  return (
    <svg {...base} fill="none" stroke="currentColor" aria-hidden>
      <rect x="3" y="6" width="18" height="13" rx="3" fill={filled ? "currentColor" : "none"} fillOpacity={filled ? 0.2 : 0} />
      <path d="M3 10h18M16 14.5h2" />
    </svg>
  );
}
function BoltIcon({ filled }: IconProps) {
  return (
    <svg {...base} fill={filled ? "currentColor" : "none"} fillOpacity={filled ? 0.2 : 0} stroke="currentColor" aria-hidden>
      <path d="M13 3 5 14h6l-1 7 8-11h-6l1-7z" />
    </svg>
  );
}
function BookIcon({ filled }: IconProps) {
  return (
    <svg {...base} fill="none" stroke="currentColor" aria-hidden>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" fill={filled ? "currentColor" : "none"} fillOpacity={filled ? 0.2 : 0} />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" />
    </svg>
  );
}
