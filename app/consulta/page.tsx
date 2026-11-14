export const dynamic = "force-dynamic";

import sql, { ensureTable } from "@/lib/db";
import type { ProdutoTriagem } from "@/app/api/triagem/route";
import Image from "next/image";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

async function buscar(q: string): Promise<ProdutoTriagem[]> {
  await ensureTable();
  const termo = q.trim();
  const isNumerico = /^\d+$/.test(termo);

  if (isNumerico) {
    // busca por ID ou por código numérico
    const rows = await sql`
      SELECT * FROM produtos_triagem
      WHERE id = ${parseInt(termo)} OR LOWER(codigo) = LOWER(${termo})
      ORDER BY data_triagem DESC
    `;
    return rows as ProdutoTriagem[];
  } else {
    // busca só por código
    const rows = await sql`
      SELECT * FROM produtos_triagem
      WHERE LOWER(codigo) = LOWER(${termo})
      ORDER BY data_triagem DESC
    `;
    return rows as ProdutoTriagem[];
  }
}

export default async function ConsultaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const termo = q?.trim() ?? "";
  const resultados = termo ? await buscar(termo) : [];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
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
            <a href="/produtos" className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">Produtos</a>
            <a href="/consulta" className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">Consulta</a>
          </nav>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col gap-6">

          {/* Campo de busca */}
          <form method="GET" className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-600">
              Consultar por ID ou Código de barras
            </label>
            <div className="flex gap-3">
              <input
                name="q"
                defaultValue={termo}
                autoFocus
                autoComplete="off"
                placeholder="Digite o ID (#42) ou o código de barras do produto..."
                className="flex-1 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none px-4 py-3 text-base font-mono transition-colors"
              />
              <button type="submit"
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Buscar
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Ex: <code className="bg-gray-100 px-1 rounded">42</code> para buscar pelo ID, ou <code className="bg-gray-100 px-1 rounded">7891234567890</code> para código de barras.
            </p>
          </form>

          {/* Resultados */}
          {termo && resultados.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="font-medium">Nenhum produto encontrado</p>
              <p className="text-sm mt-1">para <strong>{termo}</strong></p>
            </div>
          )}

          {resultados.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex gap-5 p-5">
                {/* Foto */}
                {p.foto_url ? (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image src={p.foto_url} alt={p.descricao} fill className="object-contain p-1" unoptimized />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-300">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-mono text-gray-400">#{p.id}</span>
                      <h2 className="text-base font-bold text-gray-800 leading-snug">{p.descricao}</h2>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <a href={`/etiqueta/${p.id}`} target="_blank" rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 font-semibold rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Etiqueta
                      </a>
                      <a href={`/produtos`}
                        className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                        Ver todos
                      </a>
                    </div>
                  </div>

                  {/* Códigos */}
                  <div className="flex flex-wrap gap-2">
                    {p.codigo && (
                      <span className="text-xs bg-gray-100 text-gray-600 font-mono px-2 py-0.5 rounded">
                        Cód: {p.codigo}
                      </span>
                    )}
                    {p.codigo_ml && (
                      <span className="text-xs bg-yellow-50 text-yellow-700 font-mono px-2 py-0.5 rounded">
                        ML: {p.codigo_ml}
                      </span>
                    )}
                    {p.quantidade && p.quantidade > 1 && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">
                        Qtd: {p.quantidade}
                      </span>
                    )}
                    {p.endereco && (
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold">
                        📍 {p.endereco}
                      </span>
                    )}
                  </div>

                  {/* Preços */}
                  <div className="flex gap-4 mt-1">
                    <div>
                      <p className="text-xs text-gray-400">Preço outlet</p>
                      <p className="text-xl font-bold text-green-700">
                        {p.preco ? BRL.format(Number(p.preco)) : "—"}
                      </p>
                    </div>
                    {p.preco_referencia && (
                      <div>
                        <p className="text-xs text-gray-400">Ref. ML</p>
                        <p className="text-sm font-semibold text-blue-600">
                          {BRL.format(Number(p.preco_referencia))}
                        </p>
                      </div>
                    )}
                    {p.custo && (
                      <div>
                        <p className="text-xs text-gray-400">Custo</p>
                        <p className="text-sm font-semibold text-orange-600">
                          {BRL.format(Number(p.custo))}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rodapé */}
              <div className="border-t border-gray-100 px-5 py-2 bg-gray-50 text-xs text-gray-400">
                Triado em {DATE.format(new Date(p.data_triagem))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
