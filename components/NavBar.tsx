"use client";

import { useEffect, useRef, useState } from "react";

const LINKS = [
  { href: "/",               label: "Triagem"  },
  { href: "/triagens",       label: "Histórico" },
  { href: "/produtos",       label: "Produtos" },
  { href: "/consulta",       label: "Consulta" },
  { href: "/vendas",         label: "Vendas" },
  { href: "/reels",          label: "Reels",   reels: true },
  { href: "/venda",          label: "PDV",     pdv: true },
  { href: "/configuracoes",  label: "Config" },
] as const;

interface Props {
  active: string;
  triagemSlot?: React.ReactNode; // TriagemSwitcher no desktop
}

export default function NavBar({ active, triagemSlot }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} className="relative flex items-center">

      {/* ── Desktop ── */}
      <nav className="hidden sm:flex items-center gap-1">
        {LINKS.map(l => {
          if (l.href === "/" && triagemSlot) return <div key="/">{triagemSlot}</div>;
          const isActive = active === l.href;
          const isPdv    = "pdv"   in l && l.pdv;
          const isReels  = "reels" in l && l.reels;
          return (
            <a key={l.href} href={l.href}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                isActive && isPdv   ? "text-green-700 bg-green-50" :
                isActive && isReels ? "text-pink-700 bg-pink-50" :
                isActive            ? "text-blue-600 bg-blue-50" :
                isPdv               ? "text-green-700 bg-green-50 hover:bg-green-100 font-semibold" :
                isReels             ? "text-pink-600 hover:bg-pink-50 font-semibold" :
                                      "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}>
              {l.label}
            </a>
          );
        })}
      </nav>

      {/* ── Mobile hamburger ── */}
      <div className="sm:hidden">
        <button
          onClick={() => setOpen(o => !o)}
          className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Menu"
        >
          {open ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 overflow-hidden py-1.5">
            {LINKS.map(l => {
              const isActive = active === l.href;
              const isPdv    = "pdv"   in l && l.pdv;
              const isReels  = "reels" in l && l.reels;
              return (
                <a key={l.href} href={l.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    isActive && isPdv   ? "bg-green-50 text-green-700 font-semibold" :
                    isActive && isReels ? "bg-pink-50 text-pink-700 font-semibold" :
                    isActive            ? "bg-blue-50 text-blue-600 font-semibold" :
                    isPdv               ? "text-green-700 hover:bg-green-50 font-semibold" :
                    isReels             ? "text-pink-600 hover:bg-pink-50 font-semibold" :
                                          "text-gray-700 hover:bg-gray-50"
                  }`}>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isActive && isPdv   ? "bg-green-500" :
                    isActive && isReels ? "bg-pink-500" :
                    isActive            ? "bg-blue-500" :
                    isPdv               ? "bg-green-400" :
                    isReels             ? "bg-pink-400" :
                                          "bg-gray-300"
                  }`} />
                  {l.label}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
