export const dynamic = "force-dynamic";

import sql, { ensureTable } from "@/lib/db";
import NavBar from "@/components/NavBar";
import VendaCard, { type VendaRow } from "@/components/VendaCard";
import VendasFiltros from "@/components/VendasFiltros";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type Periodo = "hoje" | "ontem" | "semana" | "mes" | "";

const PAY_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro", credito: "Crédito", debito: "Débito", pix: "PIX",
};
const PAY_COLORS: Record<string, string> = {
  dinheiro: "bg-green-50 text-green-700 border-green-200",
  credito:  "bg-blue-50 text-blue-700 border-blue-200",
  debito:   "bg-indigo-50 text-indigo-700 border-indigo-200",
  pix:      "bg-teal-50 text-teal-700 border-teal-200",
};

function getDateRange(periodo: Periodo) {
  const now = new Date();
  if (periodo === "hoje") {
    return { from: new Date(now.getFullYear(), now.getMonth(), now.getDate()), to: null };
  }
  if (periodo === "ontem") {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
      to:   new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    };
  }
  if (periodo === "semana") {
    const dow  = now.getDay();
    const diff = now.getDate() - dow + (dow === 0 ? -6 : 1);
    return { from: new Date(now.getFullYear(), now.getMonth(), diff), to: null };
  }
  if (periodo === "mes") {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: null };
  }
  return { from: null, to: null };
}

async function getVendas(periodo: Periodo, pgto: string, conta: string): Promise<VendaRow[]> {
  await ensureTable();
  const { from, to } = getDateRange(periodo);

  let rows: VendaRow[];

  if (!from) {
    rows = await sql`
      SELECT v.*, COUNT(i.id)::int AS total_itens
      FROM vendas v
      LEFT JOIN venda_itens i ON i.venda_id = v.id
      GROUP BY v.id
      ORDER BY v.data_venda DESC
      LIMIT 500
    ` as VendaRow[];
  } else if (!to) {
    rows = await sql`
      SELECT v.*, COUNT(i.id)::int AS total_itens
      FROM vendas v
      LEFT JOIN venda_itens i ON i.venda_id = v.id
      WHERE v.data_venda >= ${from.toISOString()}
      GROUP BY v.id
      ORDER BY v.data_venda DESC
      LIMIT 500
    ` as VendaRow[];
  } else {
    rows = await sql`
      SELECT v.*, COUNT(i.id)::int AS total_itens
      FROM vendas v
      LEFT JOIN venda_itens i ON i.venda_id = v.id
      WHERE v.data_venda >= ${from.toISOString()} AND v.data_venda < ${to.toISOString()}
      GROUP BY v.id
      ORDER BY v.data_venda DESC
      LIMIT 500
    ` as VendaRow[];
  }

  if (pgto)  rows = rows.filter(r => r.forma_pagamento === pgto);
  if (conta) rows = rows.filter(r => r.conta === conta);

  return rows;
}

export default async function VendasPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; pgto?: string; conta?: string }>;
}) {
  const { periodo: p, pgto = "", conta = "" } = await searchParams;
  const periodo = (["hoje", "ontem", "semana", "mes"].includes(p ?? "") ? p : "") as Periodo;

  const vendas = await getVendas(periodo, pgto, conta);

  const totalReceita  = vendas.reduce((s, v) => s + Number(v.total), 0);
  const totalDesconto = vendas.reduce((s, v) => s + Number(v.desconto ?? 0), 0);
  const ticketMedio   = vendas.length > 0 ? totalReceita / vendas.length : 0;

  const porPgto = vendas.reduce<Record<string, number>>((acc, v) => {
    const k = v.forma_pagamento || "outros";
    acc[k] = (acc[k] ?? 0) + Number(v.total);
    return acc;
  }, {});

  const porConta = vendas.reduce<Record<string, number>>((acc, v) => {
    if (v.conta) acc[v.conta] = (acc[v.conta] ?? 0) + Number(v.total);
    return acc;
  }, {});

  return (
    <div className="flex flex-col min-h-screen">

      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">Consulta de Vendas</h1>
              <p className="text-xs text-gray-400 leading-tight">Logística Outlet</p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <NavBar active="/vendas" />
          </nav>
        </div>
      </header>

      <main className="flex-1 py-6">
        <div className="max-w-4xl mx-auto px-4 flex flex-col gap-5">

          {/* Filtros */}
          <VendasFiltros periodo={periodo} pgto={pgto} conta={conta} />

          {/* Cards de totais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Vendas</span>
              <p className="text-3xl font-bold text-gray-800 mt-1">{vendas.length}</p>
            </div>

            <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-4">
              <span className="text-xs font-semibold text-green-500 uppercase tracking-wide">Receita</span>
              <p className="text-2xl font-bold text-green-700 mt-1">{BRL.format(totalReceita)}</p>
            </div>

            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-4">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Ticket Médio</span>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {vendas.length > 0 ? BRL.format(ticketMedio) : "—"}
              </p>
              {vendas.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">por venda</p>
              )}
            </div>

            {totalDesconto > 0 && (
              <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4">
                <span className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Descontos</span>
                <p className="text-2xl font-bold text-orange-600 mt-1">{BRL.format(totalDesconto)}</p>
              </div>
            )}

            {Object.entries(porConta).map(([k, v]) => (
              <div key={k} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{k}</span>
                <p className="text-2xl font-bold text-gray-700 mt-1">{BRL.format(v)}</p>
              </div>
            ))}
          </div>

          {/* Breakdown por pagamento */}
          {Object.keys(porPgto).length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {Object.entries(porPgto).map(([k, v]) => (
                <div
                  key={k}
                  className={`rounded-xl border px-4 py-2 flex items-center gap-3 ${PAY_COLORS[k] ?? "bg-gray-50 text-gray-700 border-gray-200"}`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    {PAY_LABELS[k] ?? k}
                  </span>
                  <span className="font-bold">{BRL.format(v)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Lista de vendas */}
          {vendas.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🧾</p>
              <p className="font-medium">Nenhuma venda encontrada</p>
              <p className="text-sm mt-1">Tente outro filtro ou período</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {vendas.map(v => <VendaCard key={v.id} v={v} />)}
            </div>
          )}

        </div>
      </main>

      <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-400">
        Logística Outlet — Consulta de Vendas
      </footer>
    </div>
  );
}
