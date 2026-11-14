export const dynamic = "force-dynamic";

import sql, { ensureTable } from "@/lib/db";
import ContinuarButton from "@/components/ContinuarButton";
import TriagemActions from "@/components/TriagemActions";
import NavBar from "@/components/NavBar";

const BRL  = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

interface TriagemRow {
  id: number;
  nome: string | null;
  status: "ativa" | "finalizada";
  data_inicio: string;
  data_fim: string | null;
  total_produtos: number;
  total_unidades: number;
  total_outlet: number;
  total_custo: number;
}

async function getTriagens(): Promise<TriagemRow[]> {
  await ensureTable();
  const rows = await sql`
    SELECT t.*,
      COUNT(p.id)::int                           AS total_produtos,
      COALESCE(SUM(p.quantidade), 0)::int        AS total_unidades,
      COALESCE(SUM(p.preco  * p.quantidade), 0)  AS total_outlet,
      COALESCE(SUM(p.custo  * p.quantidade), 0)  AS total_custo
    FROM triagens t
    LEFT JOIN produtos_triagem p ON p.triagem_id = t.id
    GROUP BY t.id
    ORDER BY t.data_inicio DESC
  `;
  return rows as TriagemRow[];
}

export default async function TriagensPage() {
  const triagens = await getTriagens();

  const ativas     = triagens.filter(t => t.status === "ativa");
  const finalizadas = triagens.filter(t => t.status === "finalizada");
  const grandTotal  = finalizadas.reduce((s, t) => s + Number(t.total_outlet), 0);
  const grandCusto  = finalizadas.reduce((s, t) => s + Number(t.total_custo), 0);

  return (
    <div className="flex flex-col min-h-screen">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
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
          <nav className="flex items-center gap-1">
            <NavBar active="/triagens" />
          </nav>
        </div>
      </header>

      <main className="flex-1 py-6">
        <div className="max-w-4xl mx-auto px-4 flex flex-col gap-6">

          {/* Título + botão */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Histórico de Triagens</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {ativas.length > 0 && (
                  <span className="text-green-600 font-medium">{ativas.length} em andamento · </span>
                )}
                {finalizadas.length} finalizada{finalizadas.length !== 1 ? "s" : ""}
              </p>
            </div>
            <a href="/"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
              + Nova triagem
            </a>
          </div>

          {/* Cards de totais (finalizadas) */}
          {finalizadas.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Triagens</span>
                <span className="text-2xl font-bold text-gray-800">{finalizadas.length}</span>
                <span className="text-xs text-gray-400">finalizadas</span>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Produtos</span>
                <span className="text-2xl font-bold text-gray-800">
                  {finalizadas.reduce((s, t) => s + t.total_produtos, 0)}
                </span>
                <span className="text-xs text-gray-400">
                  {finalizadas.reduce((s, t) => s + t.total_unidades, 0)} unidades
                </span>
              </div>
              <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4 flex flex-col gap-1">
                <span className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Custo total</span>
                <span className="text-xl font-bold text-orange-600">{BRL.format(grandCusto)}</span>
                <span className="text-xs text-gray-400">nas finalizadas</span>
              </div>
              <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-4 flex flex-col gap-1">
                <span className="text-xs font-semibold text-green-500 uppercase tracking-wide">Outlet total</span>
                <span className="text-xl font-bold text-green-700">{BRL.format(grandTotal)}</span>
                <span className="text-xs text-gray-400">nas finalizadas</span>
              </div>
            </div>
          )}

          {/* Lista de triagens */}
          {triagens.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-sm">Nenhuma triagem criada ainda.</p>
              <a href="/" className="mt-4 inline-block text-blue-600 text-sm hover:underline">
                Iniciar primeira triagem →
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {triagens.map(t => {
                const outlet = Number(t.total_outlet);
                const custo  = Number(t.total_custo);
                const margem = outlet > 0 && custo > 0
                  ? Math.round(((outlet - custo) / outlet) * 100)
                  : null;

                return (
                  <div
                    key={t.id}
                    className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-shadow hover:shadow-md ${
                      t.status === "ativa" ? "border-blue-200" : "border-gray-200"
                    }`}
                  >
                    <div className="p-5 flex flex-col sm:flex-row gap-4 items-start">

                      {/* Info principal */}
                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                            t.status === "ativa"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              t.status === "ativa" ? "bg-green-500" : "bg-gray-400"
                            }`} />
                            {t.status === "ativa" ? "Em andamento" : "Finalizada"}
                          </span>
                          {margem !== null && t.status === "finalizada" && (
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                              {margem}% margem
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="font-bold text-gray-800 text-base">
                            {t.nome || `Triagem #${t.id}`}
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {t.status === "ativa"
                              ? <>Iniciada em {DATE.format(new Date(t.data_inicio))}</>
                              : <>{DATE.format(new Date(t.data_inicio))} → {t.data_fim ? DATE.format(new Date(t.data_fim)) : "—"}</>
                            }
                          </p>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                          <span>
                            <strong className="text-gray-800">{t.total_produtos}</strong>
                            {" "}produto{t.total_produtos !== 1 ? "s" : ""}
                          </span>
                          {t.total_unidades !== t.total_produtos && (
                            <>
                              <span className="text-gray-200">·</span>
                              <span>
                                <strong className="text-gray-800">{t.total_unidades}</strong> unidades
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Totais */}
                      <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          {custo > 0 && (
                            <p className="text-xs text-orange-500 font-medium">
                              Custo {BRL.format(custo)}
                            </p>
                          )}
                          <p className={`font-bold ${
                            outlet > 0 ? "text-green-700 text-xl" : "text-gray-300 text-sm"
                          }`}>
                            {outlet > 0 ? BRL.format(outlet) : "sem preço"}
                          </p>
                          {outlet > 0 && (
                            <p className="text-xs text-gray-400">total outlet</p>
                          )}
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-2">
                          {t.status === "ativa" && (
                            <ContinuarButton id={t.id} />
                          )}
                          <a
                            href={`/produtos?triagem=${t.id}`}
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Ver produtos
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Rodapé com ações */}
                    <div className="border-t border-gray-100 px-5 py-2.5 bg-gray-50 flex items-center justify-between gap-3 flex-wrap">
                      <TriagemActions id={t.id} nome={t.nome} status={t.status} />
                    </div>
                  </div>
                );
              })}
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
