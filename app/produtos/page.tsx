export const dynamic = "force-dynamic";

import sql, { ensureTable } from "@/lib/db";
import type { ProdutoTriagem } from "@/app/api/triagem/route";
import EditableRow from "@/components/EditableRow";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

async function getProdutos(): Promise<ProdutoTriagem[]> {
  await ensureTable();
  const rows = await sql`SELECT * FROM produtos_triagem ORDER BY data_triagem DESC LIMIT 200`;
  return rows as ProdutoTriagem[];
}

export default async function ProdutosPage() {
  const produtos = await getProdutos();

  const totalQtd = produtos.reduce((s, p) => s + Number(p.quantidade ?? 1), 0);
  const totalRefML = produtos.reduce((s, p) => s + Number(p.preco_referencia ?? 0) * Number(p.quantidade ?? 1), 0);
  const totalCusto = produtos.reduce((s, p) => s + Number(p.custo ?? 0) * Number(p.quantidade ?? 1), 0);
  const totalOutlet = produtos.reduce((s, p) => s + Number(p.preco ?? 0) * Number(p.quantidade ?? 1), 0);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">Logística Outlet</h1>
              <p className="text-xs text-gray-400 leading-tight">Triagem de produtos</p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <a href="/" className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">Triagem</a>
            <a href="/produtos" className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">Produtos</a>
            <a href="/consulta" className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">Consulta</a>
          </nav>
        </div>
      </header>

      <main className="flex-1 py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">{produtos.length} produto{produtos.length !== 1 ? "s" : ""} triado{produtos.length !== 1 ? "s" : ""}</h2>
            <a href="/" className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
              + Nova triagem
            </a>
          </div>

          {/* Cards de totais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Estoque</span>
              <span className="text-3xl font-bold text-gray-800">{totalQtd}</span>
              <span className="text-xs text-gray-400">{produtos.length} produto{produtos.length !== 1 ? "s" : ""} · {totalQtd} unidade{totalQtd !== 1 ? "s" : ""}</span>
            </div>
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 flex flex-col gap-1">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Ref. Mercado Livre</span>
              <span className="text-2xl font-bold text-blue-700">{BRL.format(totalRefML)}</span>
              <span className="text-xs text-gray-400">valor de mercado</span>
            </div>
            <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5 flex flex-col gap-1">
              <span className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Custo total</span>
              <span className="text-2xl font-bold text-orange-600">{BRL.format(totalCusto)}</span>
              <span className="text-xs text-gray-400">quanto custou</span>
            </div>
            <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5 flex flex-col gap-1">
              <span className="text-xs font-semibold text-green-500 uppercase tracking-wide">Preço outlet</span>
              <span className="text-2xl font-bold text-green-700">{BRL.format(totalOutlet)}</span>
              <span className="text-xs text-gray-400">valor a receber</span>
            </div>
          </div>

          {produtos.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">📦</p>
              <p className="text-sm">Nenhum produto triado ainda.</p>
              <a href="/" className="mt-4 inline-block text-blue-600 text-sm hover:underline">Iniciar triagem →</a>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-center w-10">#</th>
                    <th className="px-4 py-3 text-left w-14">Foto</th>
                    <th className="px-4 py-3 text-left">Descrição</th>
                    <th className="px-4 py-3 text-left w-28 hidden sm:table-cell">Código</th>
                    <th className="px-4 py-3 text-left w-28 hidden sm:table-cell">Endereço</th>
                    <th className="px-4 py-3 text-center w-16">Qtd</th>
                    <th className="px-4 py-3 text-right w-28">Ref. ML</th>
                    <th className="px-4 py-3 text-right w-24 hidden md:table-cell">Custo</th>
                    <th className="px-4 py-3 text-right w-28">Outlet</th>
                    <th className="px-4 py-3 text-right w-36 hidden lg:table-cell">Data</th>
                    <th className="px-2 py-3 w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {produtos.map((p) => (
                    <EditableRow key={p.id} p={p} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-400">
        Logística Outlet — Triagem e Pesquisa de Preços
      </footer>
    </div>
  );
}
