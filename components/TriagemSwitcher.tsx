"use client";

import { useEffect, useRef, useState } from "react";
import type { Triagem } from "@/app/api/triagens/route";

const BRL  = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

interface Props {
  current: Triagem;
  onSelect: (t: Triagem) => void;
  onNew: () => void;
}

export default function TriagemSwitcher({ current, onSelect, onNew }: Props) {
  const [open, setOpen]       = useState(false);
  const [sessions, setSessions] = useState<Triagem[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function handleOpen() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setLoading(true);
    try {
      const res  = await fetch("/api/triagens?status=ativa");
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  const others = sessions.filter(s => s.id !== current.id);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5 max-w-[160px]"
      >
        <span className="truncate">{current.nome || `Triagem #${current.id}`}</span>
        <svg
          className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden">

          {/* Sessão atual */}
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-0.5">Sessão atual</p>
            <p className="font-semibold text-blue-800 text-sm truncate">{current.nome || `Triagem #${current.id}`}</p>
            <p className="text-xs text-blue-400 mt-0.5">
              Desde {DATE.format(new Date(current.data_inicio))}
              {" · "}
              <strong className="text-blue-600">{current.total_produtos ?? 0}</strong> produto{(current.total_produtos ?? 0) !== 1 ? "s" : ""}
              {(current.total_outlet ?? 0) > 0 && (
                <> · {BRL.format(Number(current.total_outlet))}</>
              )}
            </p>
          </div>

          {/* Outras sessões em andamento */}
          {loading && (
            <div className="px-4 py-3 text-xs text-gray-400 flex items-center gap-2">
              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              Carregando...
            </div>
          )}

          {!loading && others.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Outras em andamento
              </p>
              {others.map(s => (
                <button
                  key={s.id}
                  onClick={() => { onSelect(s); setOpen(false); }}
                  className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate group-hover:text-blue-700 transition-colors">
                      {s.nome || `Triagem #${s.id}`}
                    </p>
                    <p className="text-xs text-gray-400">
                      {DATE.format(new Date(s.data_inicio))}
                      {" · "}
                      {s.total_produtos ?? 0} produto{(s.total_produtos ?? 0) !== 1 ? "s" : ""}
                      {(s.total_outlet ?? 0) > 0 && ` · ${BRL.format(Number(s.total_outlet))}`}
                    </p>
                  </div>
                  <span className="text-xs text-blue-500 font-semibold flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    Ir →
                  </span>
                </button>
              ))}
              <div className="border-t border-gray-100 mx-3 my-1" />
            </div>
          )}

          {/* Nova triagem */}
          <button
            onClick={() => { onNew(); setOpen(false); }}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-blue-600"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-semibold">Nova triagem</span>
          </button>
        </div>
      )}
    </div>
  );
}
