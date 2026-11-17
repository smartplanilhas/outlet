export const dynamic = "force-dynamic";

import sql, { ensureTable } from "@/lib/db";
import NavBar from "@/components/NavBar";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type RowCategoria = {
  categoria: string | null;
  total_produtos: number;
  total_unidades: number;
  total_ref_ml: number;
  custo_estimado: number;
  com_catalogo: number;
  com_ml: number;
};

async function getDashboardData() {
  await ensureTable();

  const [resumo, porCategoria] = await Promise.all([
    sql`
      SELECT
        COUNT(*)::int                                              AS total_produtos,
        COALESCE(SUM(quantidade), 0)::int                         AS total_unidades,
        COALESCE(SUM(preco_referencia * quantidade), 0)           AS total_ref_ml,
        COALESCE(SUM(preco_referencia * quantidade * 0.4), 0)     AS custo_estimado,
        COUNT(*) FILTER (WHERE catalogo = true)::int              AS com_catalogo,
        COUNT(*) FILTER (WHERE venda_ml = true)::int              AS com_ml,
        COUNT(*) FILTER (WHERE catalogo = false OR catalogo IS NULL)::int AS sem_catalogo,
        COUNT(*) FILTER (WHERE venda_ml = false OR venda_ml IS NULL)::int AS sem_ml
      FROM produtos_triagem
      WHERE quantidade > 0 OR quantidade IS NULL
    `,
    sql`
      SELECT
        COALESCE(categoria, 'Sem categoria')                      AS categoria,
        COUNT(*)::int                                             AS total_produtos,
        COALESCE(SUM(quantidade), 0)::int                         AS total_unidades,
        COALESCE(SUM(preco_referencia * quantidade), 0)           AS total_ref_ml,
        COALESCE(SUM(preco_referencia * quantidade * 0.4), 0)     AS custo_estimado,
        COUNT(*) FILTER (WHERE catalogo = true)::int              AS com_catalogo,
        COUNT(*) FILTER (WHERE venda_ml = true)::int              AS com_ml
      FROM produtos_triagem
      WHERE quantidade > 0 OR quantidade IS NULL
      GROUP BY COALESCE(categoria, 'Sem categoria')
      ORDER BY total_ref_ml DESC
    `,
  ]);

  return {
    resumo: resumo[0] as {
      total_produtos: number;
      total_unidades: number;
      total_ref_ml: number;
      custo_estimado: number;
      com_catalogo: number;
      com_ml: number;
      sem_catalogo: number;
      sem_ml: number;
    },
    porCategoria: porCategoria as RowCategoria[],
  };
}

function BarFill({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default async function DashboardPage() {
  const { resumo, porCategoria } = await getDashboardData();

  const maxRefML = porCategoria[0]?.total_ref_ml ?? 1;

  const pctCatalogo = resumo.total_produtos > 0
    ? Math.round((resumo.com_catalogo / resumo.total_produtos) * 100)
    : 0;
  const pctML = resumo.total_produtos > 0
    ? Math.round((resumo.com_ml / resumo.total_produtos) * 100)
    : 0;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">Dashboard de Produtos</h1>
              <p className="text-xs text-gray-400 leading-tight">Visão geral do estoque</p>
            </div>
          </div>
          <NavBar active="/dashboard" />
        </div>
      </header>

      <main className="flex-1 py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col gap-6">

          {/* Cards resumo */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Produtos</span>
              <span className="text-3xl font-bold text-gray-800">{resumo.total_produtos}</span>
              <span className="text-xs text-gray-400">{resumo.total_unidades} unidades</span>
            </div>

            <a href="/catalogo" className="bg-white rounded-2xl border border-yellow-100 shadow-sm p-5 flex flex-col gap-1 hover:border-yellow-300 hover:shadow-md transition-all group">
              <span className="text-xs font-semibold text-yellow-500 uppercase tracking-wide">Catálogo ML</span>
              <span className="text-3xl font-bold text-yellow-600">{resumo.com_catalogo}</span>
              <span className="text-xs text-gray-400 group-hover:text-yellow-500 transition-colors">{pctCatalogo}% do total · ver →</span>
            </a>

            <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-5 flex flex-col gap-1">
              <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">Venda ML</span>
              <span className="text-3xl font-bold text-indigo-600">{resumo.com_ml}</span>
              <span className="text-xs text-gray-400">{pctML}% do total</span>
            </div>

            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 flex flex-col gap-1 md:col-span-1">
              <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Ref. ML total</span>
              <span className="text-xl font-bold text-blue-700 leading-tight">{BRL.format(Number(resumo.total_ref_ml))}</span>
              <span className="text-xs text-gray-400">preço de mercado</span>
            </div>

            <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5 flex flex-col gap-1 md:col-span-1">
              <span className="text-xs font-semibold text-orange-500 uppercase tracking-wide">Custo est. (40%)</span>
              <span className="text-xl font-bold text-orange-600 leading-tight">{BRL.format(Number(resumo.custo_estimado))}</span>
              <span className="text-xs text-gray-400">40% da Ref. ML</span>
            </div>
          </div>

          {/* ML vs Avulso + Catálogo vs Sem catálogo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Venda ML */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Canal de venda</h3>
              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-indigo-700">Mercado Livre</span>
                    <span className="text-gray-600 font-semibold">{resumo.com_ml} produtos</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${pctML}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{pctML}%</span>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-500">Loja / outros</span>
                    <span className="text-gray-600 font-semibold">{resumo.sem_ml} produtos</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-300 rounded-full transition-all"
                      style={{ width: `${100 - pctML}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{100 - pctML}%</span>
                </div>
              </div>
            </div>

            {/* Catálogo */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Tipo de anúncio</h3>
              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-yellow-600">Catálogo ML</span>
                    <span className="text-gray-600 font-semibold">{resumo.com_catalogo} produtos</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: `${pctCatalogo}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{pctCatalogo}%</span>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-500">Avulso / sem catálogo</span>
                    <span className="text-gray-600 font-semibold">{resumo.sem_catalogo} produtos</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-300 rounded-full transition-all"
                      style={{ width: `${100 - pctCatalogo}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{100 - pctCatalogo}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Por categoria */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Por categoria</h3>
              <span className="text-xs text-gray-400">{porCategoria.length} categorias</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-5 py-3 text-left">Categoria</th>
                    <th className="px-4 py-3 text-center w-20">Prods</th>
                    <th className="px-4 py-3 text-center w-20">Unid.</th>
                    <th className="px-4 py-3 text-center w-20 hidden sm:table-cell">Catálogo</th>
                    <th className="px-4 py-3 text-center w-20 hidden sm:table-cell">ML</th>
                    <th className="px-4 py-3 text-right w-36">Ref. ML</th>
                    <th className="px-4 py-3 text-right w-36">Custo est. (40%)</th>
                    <th className="px-4 py-3 w-28 hidden md:table-cell"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {porCategoria.map((row) => (
                    <tr key={row.categoria} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-800">
                        <a
                          href={`/produtos?categoria=${encodeURIComponent(row.categoria ?? "")}`}
                          className="hover:text-indigo-600 transition-colors"
                        >
                          {row.categoria ?? "Sem categoria"}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700 font-semibold">{row.total_produtos}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{row.total_unidades}</td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        {row.com_catalogo > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">
                            {row.com_catalogo}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        {row.com_ml > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                            {row.com_ml}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-700">
                        {BRL.format(Number(row.total_ref_ml))}
                      </td>
                      <td className="px-4 py-3 text-right text-orange-600">
                        {BRL.format(Number(row.custo_estimado))}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <BarFill value={Number(row.total_ref_ml)} max={maxRefML} color="bg-blue-300" />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200 text-sm font-bold">
                    <td className="px-5 py-3 text-gray-700">Total</td>
                    <td className="px-4 py-3 text-center text-gray-800">{resumo.total_produtos}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{resumo.total_unidades}</td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell text-yellow-700">{resumo.com_catalogo}</td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell text-indigo-700">{resumo.com_ml}</td>
                    <td className="px-4 py-3 text-right text-blue-700">{BRL.format(Number(resumo.total_ref_ml))}</td>
                    <td className="px-4 py-3 text-right text-orange-600">{BRL.format(Number(resumo.custo_estimado))}</td>
                    <td className="px-4 py-3 hidden md:table-cell" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      </main>

      <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-400">
        Logística Outlet — Dashboard de Produtos
      </footer>
    </div>
  );
}
