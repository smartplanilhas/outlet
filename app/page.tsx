"use client";

import { useCallback, useEffect, useState } from "react";
import TriageForm from "@/components/TriageForm";
import TriagemPicker from "@/components/TriagemPicker";
import TriagemHeader from "@/components/TriagemHeader";
import TriagemSwitcher from "@/components/TriagemSwitcher";
import NavBar from "@/components/NavBar";
import type { Triagem } from "@/app/api/triagens/route";

export default function Home() {
  const [triagemAtiva, setTriagemAtiva] = useState<Triagem | null>(null);
  const [hydrated, setHydrated]         = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem("triagem_ativa_id");
    if (!savedId) { setHydrated(true); return; }

    fetch(`/api/triagens?id=${savedId}`)
      .then(r => r.json())
      .then(data => {
        if (data?.status === "ativa") {
          setTriagemAtiva({
            ...data,
            total_produtos: Number(data.total_produtos ?? 0),
            total_outlet:   Number(data.total_outlet   ?? 0),
            total_custo:    Number(data.total_custo    ?? 0),
          });
        } else {
          localStorage.removeItem("triagem_ativa_id");
        }
      })
      .catch(() => localStorage.removeItem("triagem_ativa_id"))
      .finally(() => setHydrated(true));
  }, []);

  const handleStart = useCallback((t: Triagem) => {
    localStorage.setItem("triagem_ativa_id", String(t.id));
    setTriagemAtiva({
      ...t,
      total_produtos: Number(t.total_produtos ?? 0),
      total_outlet:   Number(t.total_outlet   ?? 0),
      total_custo:    Number(t.total_custo    ?? 0),
    });
  }, []);

  const handlePausar = useCallback(() => {
    localStorage.removeItem("triagem_ativa_id");
    setTriagemAtiva(null);
  }, []);

  const handleFinalizar = useCallback(async () => {
    if (!triagemAtiva) return;
    await fetch(`/api/triagens?id=${triagemAtiva.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "finalizada" }),
    });
    localStorage.removeItem("triagem_ativa_id");
    window.location.href = `/produtos?triagem=${triagemAtiva.id}`;
  }, [triagemAtiva]);

  const handleProductSaved = useCallback((preco: number, custo: number, qty: number) => {
    setTriagemAtiva(prev => prev ? {
      ...prev,
      total_produtos: prev.total_produtos! + 1,
      total_outlet:   Number(prev.total_outlet)   + preco * qty,
      total_custo:    Number(prev.total_custo)    + custo * qty,
    } : prev);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">Logística Outlet</h1>
              <p className="text-xs text-gray-400 leading-tight">Triagem de produtos</p>
            </div>
          </div>
          <NavBar
            active="/"
            triagemSlot={triagemAtiva && hydrated ? (
              <TriagemSwitcher current={triagemAtiva} onSelect={handleStart} onNew={handlePausar} />
            ) : undefined}
          />
        </div>
      </header>

      <main className="flex-1 py-6">
        {!hydrated ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !triagemAtiva ? (
          <TriagemPicker onStart={handleStart} />
        ) : (
          <>
            <div className="w-full max-w-5xl mx-auto px-4 mb-4">
              <TriagemHeader
                triagem={triagemAtiva}
                onPausar={handlePausar}
                onFinalizar={handleFinalizar}
              />
            </div>
            <TriageForm triagemId={triagemAtiva.id} onProductSaved={handleProductSaved} />
          </>
        )}
      </main>

      <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-400">
        Logística Outlet — Triagem e Pesquisa de Preços
      </footer>
    </div>
  );
}
