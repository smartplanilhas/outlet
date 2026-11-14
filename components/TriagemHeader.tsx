"use client";

import { useState } from "react";
import type { Triagem } from "@/app/api/triagens/route";

const BRL  = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

interface Props {
  triagem: Triagem;
  onPausar: () => void;
  onFinalizar: () => Promise<void>;
}

export default function TriagemHeader({ triagem, onPausar, onFinalizar }: Props) {
  const [confirm, setConfirm]       = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  async function handleFinalizar() {
    if (!confirm) { setConfirm(true); return; }
    setFinalizing(true);
    await onFinalizar();
    setFinalizing(false);
  }

  const totalOutlet = Number(triagem.total_outlet ?? 0);
  const totalCusto  = Number(triagem.total_custo ?? 0);
  const totalProd   = Number(triagem.total_produtos ?? 0);

  return (
    <div className="bg-blue-600 rounded-2xl px-5 py-4 text-white flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-base leading-tight">
            {triagem.nome || `Triagem #${triagem.id}`}
          </span>
          <span className="text-xs bg-blue-500 px-2 py-0.5 rounded-full font-medium">em andamento</span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-blue-100">
          <span>Desde {DATE.format(new Date(triagem.data_inicio))}</span>
          <span className="hidden sm:inline">·</span>
          <span>
            <strong className="text-white">{totalProd}</strong> produto{totalProd !== 1 ? "s" : ""}
          </span>
          {totalCusto > 0 && (
            <>
              <span className="hidden sm:inline">·</span>
              <span>Custo: <strong className="text-white">{BRL.format(totalCusto)}</strong></span>
            </>
          )}
          {totalOutlet > 0 && (
            <>
              <span className="hidden sm:inline">·</span>
              <span>Outlet: <strong className="text-white text-base">{BRL.format(totalOutlet)}</strong></span>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={onPausar}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
          </svg>
          Pausar
        </button>
        <button
          onClick={handleFinalizar}
          disabled={finalizing}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
            confirm
              ? "bg-green-500 hover:bg-green-400 text-white ring-2 ring-white ring-offset-2 ring-offset-blue-600"
              : "bg-white text-blue-700 hover:bg-blue-50"
          }`}
        >
          {finalizing ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {confirm ? "Confirmar?" : "Finalizar"}
        </button>
      </div>
    </div>
  );
}
