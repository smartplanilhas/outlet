"use client";

import { useState } from "react";

const BRL  = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const DATE = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit",
});

const PAY_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro", credito: "Crédito", debito: "Débito", pix: "PIX",
};
const PAY_COLORS: Record<string, string> = {
  dinheiro: "bg-green-100 text-green-700",
  credito:  "bg-blue-100 text-blue-700",
  debito:   "bg-indigo-100 text-indigo-700",
  pix:      "bg-teal-100 text-teal-700",
};

interface VendaItem {
  id: number;
  descricao: string;
  categoria: string | null;
  preco_unitario: number;
  quantidade: number;
  subtotal: number;
}

export interface VendaRow {
  id: number;
  data_venda: string;
  subtotal: number;
  desconto: number;
  total: number;
  forma_pagamento: string;
  valor_pago: number;
  troco: number;
  origem_venda: string | null;
  conta: string | null;
  total_itens: number;
}

export default function VendaCard({ v }: { v: VendaRow }) {
  const [expanded, setExpanded] = useState(false);
  const [itens, setItens]       = useState<VendaItem[] | null>(null);
  const [loading, setLoading]   = useState(false);

  async function toggle() {
    if (!expanded && itens === null) {
      setLoading(true);
      try {
        const res  = await fetch(`/api/venda?id=${v.id}`);
        const data = await res.json();
        setItens(data.itens ?? []);
      } finally {
        setLoading(false);
      }
    }
    setExpanded(e => !e);
  }

  const pgColor = PAY_COLORS[v.forma_pagamento] ?? "bg-gray-100 text-gray-600";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

      {/* Linha principal — clicável */}
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
      >
        {/* ID + data */}
        <div className="flex-shrink-0 text-left min-w-[72px]">
          <span className="text-xs font-mono text-gray-400">#{v.id}</span>
          <p className="text-[11px] text-gray-400 mt-0.5 whitespace-nowrap leading-tight">
            {DATE.format(new Date(v.data_venda))}
          </p>
        </div>

        {/* Chips de info */}
        <div className="flex-1 flex flex-wrap gap-1.5 items-center">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pgColor}`}>
            {PAY_LABELS[v.forma_pagamento] ?? v.forma_pagamento}
          </span>
          {v.origem_venda && (
            <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
              {v.origem_venda}
            </span>
          )}
          {v.conta && (
            <span className="text-xs bg-gray-800 text-white px-2 py-0.5 rounded-full font-bold">
              {v.conta}
            </span>
          )}
          <span className="text-xs text-gray-400">
            {v.total_itens} item{v.total_itens !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Total + chevron */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <div className="text-right">
            {Number(v.desconto) > 0 && (
              <p className="text-[11px] text-gray-400 line-through leading-none">
                {BRL.format(Number(v.subtotal))}
              </p>
            )}
            <p className="font-bold text-green-700 text-base leading-tight">
              {BRL.format(Number(v.total))}
            </p>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expanded ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Itens expandidos */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 flex flex-col gap-2">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-2">Carregando...</p>
          ) : itens && itens.length > 0 ? (
            <>
              {itens.map(item => (
                <div key={item.id} className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 leading-snug">
                      {item.quantidade > 1 && (
                        <span className="font-mono text-gray-400 mr-1">{item.quantidade}×</span>
                      )}
                      {item.descricao}
                    </p>
                    {item.categoria && (
                      <span className="text-xs text-purple-500">{item.categoria}</span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-800">
                      {BRL.format(Number(item.subtotal))}
                    </p>
                    {item.quantidade > 1 && (
                      <p className="text-xs text-gray-400">
                        {BRL.format(Number(item.preco_unitario))} cada
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {Number(v.desconto) > 0 && (
                <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
                  <span className="text-orange-600">Desconto</span>
                  <span className="text-orange-600 font-medium">
                    − {BRL.format(Number(v.desconto))}
                  </span>
                </div>
              )}

              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-sm">
                <span className="text-gray-600">Total</span>
                <span className="text-green-700">{BRL.format(Number(v.total))}</span>
              </div>

              {Number(v.troco) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Troco</span>
                  <span className="font-medium">{BRL.format(Number(v.troco))}</span>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center py-2">Nenhum item registrado.</p>
          )}
        </div>
      )}
    </div>
  );
}
