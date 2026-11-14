export const dynamic = "force-dynamic";
export const metadata = {
  title: "Catálogo — Tudo Outlet",
  description: "Produtos com preços especiais de outlet. Fale pelo WhatsApp e garanta o seu!",
};

import sql, { ensureTable } from "@/lib/db";
import Image from "next/image";
import type { ProdutoTriagem } from "@/app/api/triagem/route";

const BRL  = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const WA   = "5515997612670";

function waLink(p: ProdutoTriagem) {
  const msg = `Olá! Tenho interesse em:\n*${p.descricao}*\nPreço: ${BRL.format(Number(p.preco))}\n\nVi no catálogo da Tudo Outlet 🏷️`;
  return `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
}

function desconto(ref: number | null, preco: number) {
  if (!ref || ref <= preco) return null;
  return Math.round((1 - preco / ref) * 100);
}

interface CatCount { categoria: string; count: number }

async function getData(cat?: string) {
  await ensureTable();

  const base = cat
    ? await sql`
        SELECT * FROM produtos_triagem
        WHERE catalogo = true AND preco IS NOT NULL AND COALESCE(quantidade, 1) > 0
          AND categoria = ${cat}
        ORDER BY data_triagem DESC LIMIT 300`
    : await sql`
        SELECT * FROM produtos_triagem
        WHERE catalogo = true AND preco IS NOT NULL AND COALESCE(quantidade, 1) > 0
        ORDER BY data_triagem DESC LIMIT 300`;

  const cats = await sql`
    SELECT categoria, COUNT(*)::int AS count
    FROM produtos_triagem
    WHERE catalogo = true AND preco IS NOT NULL AND COALESCE(quantidade, 1) > 0
      AND categoria IS NOT NULL
    GROUP BY categoria ORDER BY count DESC`;

  return { produtos: base as ProdutoTriagem[], categorias: cats as CatCount[] };
}

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const { produtos, categorias } = await getData(cat);

  return (
    <div className="min-h-screen bg-gray-100" style={{ fontFamily: "system-ui, sans-serif" }}>

      {/* ── Hero ── */}
      <div className="bg-black text-white">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col items-center text-center gap-3">
          {/* Logo text */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">TUDO</span>
            <span
              className="text-3xl sm:text-4xl font-black tracking-tight text-white px-3 py-0.5 rounded-lg"
              style={{ background: "#e31e24" }}
            >
              OUTLET
            </span>
          </div>
          <p className="text-gray-400 text-sm sm:text-base">
            Produtos selecionados com preços especiais
          </p>
          <a
            href={`https://wa.me/${WA}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold px-5 py-2.5 rounded-full text-sm transition-colors mt-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.133.558 4.133 1.535 5.874L.057 23.882l6.198-1.449A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.652-.52-5.165-1.428l-.371-.22-3.676.859.892-3.573-.242-.379A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            (15) 99761-2670
          </a>
          <p className="text-gray-500 text-xs">{produtos.length} produto{produtos.length !== 1 ? "s" : ""} disponíveis</p>
        </div>
      </div>

      {/* ── Filtro de categorias ── */}
      {categorias.length > 0 && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
              <a
                href="/catalogo"
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                  !cat
                    ? "text-white border-transparent"
                    : "border-gray-300 text-gray-600 hover:border-gray-400 bg-white"
                }`}
                style={!cat ? { background: "#e31e24", borderColor: "#e31e24" } : {}}
              >
                Todos ({produtos.length})
              </a>
              {categorias.map(c => (
                <a
                  key={c.categoria}
                  href={`/catalogo?cat=${encodeURIComponent(c.categoria)}`}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors whitespace-nowrap ${
                    cat === c.categoria
                      ? "text-white border-transparent"
                      : "border-gray-300 text-gray-600 hover:border-gray-400 bg-white"
                  }`}
                  style={cat === c.categoria ? { background: "#e31e24", borderColor: "#e31e24" } : {}}
                >
                  {c.categoria} ({c.count})
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Grid de produtos ── */}
      <div className="max-w-5xl mx-auto px-3 py-6">
        {produtos.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">🏷️</p>
            <p className="font-semibold">Nenhum produto disponível nesta categoria.</p>
            <a href="/catalogo" className="mt-3 inline-block text-sm" style={{ color: "#e31e24" }}>
              Ver todos os produtos →
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {produtos.map(p => {
              const pct = desconto(p.preco_referencia as unknown as number, Number(p.preco));
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex flex-col"
                >
                  {/* Foto */}
                  <div className="relative bg-gray-100 aspect-square">
                    {p.foto_url ? (
                      <Image
                        src={p.foto_url}
                        alt={p.descricao}
                        fill
                        className="object-contain p-2"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {/* Badge de desconto */}
                    {pct && (
                      <div
                        className="absolute top-2 right-2 text-white text-xs font-black px-2 py-0.5 rounded-full shadow"
                        style={{ background: "#e31e24" }}
                      >
                        -{pct}%
                      </div>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="p-3 flex flex-col gap-2 flex-1">
                    {p.categoria && (
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-wide line-clamp-1">
                        {p.categoria}
                      </span>
                    )}
                    <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-3 flex-1">
                      {p.descricao}
                    </p>

                    {/* Preços */}
                    <div>
                      {p.preco_referencia && Number(p.preco_referencia) > Number(p.preco) && (
                        <p className="text-xs text-gray-400 line-through">
                          {BRL.format(Number(p.preco_referencia))}
                        </p>
                      )}
                      <p className="text-xl font-black" style={{ color: "#e31e24" }}>
                        {BRL.format(Number(p.preco))}
                      </p>
                    </div>

                    {/* Botão WhatsApp */}
                    <a
                      href={waLink(p)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 active:bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors mt-auto"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.133.558 4.133 1.535 5.874L.057 23.882l6.198-1.449A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.652-.52-5.165-1.428l-.371-.22-3.676.859.892-3.573-.242-.379A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                      </svg>
                      Tenho interesse!
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="bg-black text-white mt-6 py-8 px-4 text-center">
        <p className="text-xs text-gray-500 mb-3">Dúvidas? Fale diretamente pelo WhatsApp</p>
        <a
          href={`https://wa.me/${WA}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 font-bold px-6 py-3 rounded-full transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.133.558 4.133 1.535 5.874L.057 23.882l6.198-1.449A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.652-.52-5.165-1.428l-.371-.22-3.676.859.892-3.573-.242-.379A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
          (15) 99761-2670
        </a>
        <p className="text-gray-600 text-xs mt-4">© Tudo Outlet — todos os direitos reservados</p>
      </div>
    </div>
  );
}
