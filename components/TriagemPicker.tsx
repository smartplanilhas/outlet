"use client";

import { useEffect, useState } from "react";
import type { Triagem } from "@/app/api/triagens/route";

const BRL  = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

interface Props {
  onStart: (t: Triagem) => void;
}

export default function TriagemPicker({ onStart }: Props) {
  const [ativas, setAtivas]     = useState<Triagem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [nome, setNome]         = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/triagens?status=ativa")
      .then(r => r.json())
      .then(setAtivas)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/triagens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar.");
      onStart({ ...data, total_produtos: 0, total_outlet: 0, total_custo: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-4 flex flex-col gap-6">

      {/* Nova triagem */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Nova Triagem</h2>
          <p className="text-sm text-gray-400 mt-0.5">Dê um nome para identificar este lote (opcional)</p>
        </div>
        <div className="flex gap-3">
          <input
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
            placeholder='Ex: "Lote Shopee Nov/26"'
            className="flex-1 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none px-4 py-3 text-sm transition-colors"
          />
          <button
            onClick={handleCreate}
            disabled={creating}
            className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap flex items-center gap-2"
          >
            {creating
              ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            }
            Iniciar
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      {/* Triagens em andamento */}
      {!loading && ativas.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">Em andamento</h3>
          {ativas.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4 hover:border-blue-200 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">
                  {t.nome || `Triagem #${t.id}`}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>{DATE.format(new Date(t.data_inicio))}</span>
                  <span>·</span>
                  <span>{t.total_produtos ?? 0} produto{(t.total_produtos ?? 0) !== 1 ? "s" : ""}</span>
                  {(t.total_outlet ?? 0) > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-green-600 font-medium">{BRL.format(Number(t.total_outlet))}</span>
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => onStart(t)}
                className="px-4 py-2 bg-blue-50 text-blue-700 text-sm font-semibold rounded-xl hover:bg-blue-100 transition-colors whitespace-nowrap flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Continuar
              </button>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <div className="inline-block w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
