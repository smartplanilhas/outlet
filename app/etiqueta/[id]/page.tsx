import sql, { ensureTable } from "@/lib/db";
import type { ProdutoTriagem } from "@/app/api/triagem/route";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

async function getProduto(id: string): Promise<ProdutoTriagem | null> {
  await ensureTable();
  const rows = await sql`SELECT * FROM produtos_triagem WHERE id = ${parseInt(id)}`;
  return (rows[0] as ProdutoTriagem) ?? null;
}

export default async function EtiquetaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const produto = await getProduto(id);
  if (!produto) notFound();

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: white; font-family: Arial, sans-serif; }
        @media screen {
          body { background: #f3f4f6; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; gap: 16px; padding: 24px; }
          .no-print { display: flex; }
        }
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .label { box-shadow: none !important; border: 1px solid #000 !important; page-break-inside: avoid; }
        }
      `}</style>

      {/* Botões — só na tela */}
      <div className="no-print" style={{ gap: 8 }}>
        <PrintButton />
        <a href="/produtos" style={{ padding: "10px 24px", background: "#e5e7eb", color: "#374151", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
          ← Voltar
        </a>
      </div>

      {/* Etiqueta */}
      <div className="label" style={{
        width: 320,
        padding: "16px 20px",
        border: "2px solid #1e3a5f",
        borderRadius: 10,
        background: "white",
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}>
        {/* Cabeçalho */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", paddingBottom: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 13, color: "#1e3a5f", textTransform: "uppercase", letterSpacing: 1 }}>
            Logística Outlet
          </span>
          <span style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>
            #{produto.id}
          </span>
        </div>

        {/* Descrição */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
            {produto.descricao}
          </p>
          {produto.codigo && (
            <p style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace", marginTop: 3 }}>
              Cód: {produto.codigo}
            </p>
          )}
          {produto.codigo_ml && (
            <p style={{ fontSize: 10, color: "#9ca3af", fontFamily: "monospace" }}>
              ML: {produto.codigo_ml}
            </p>
          )}
        </div>

        {/* Preços */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", background: "#f0fdf4", borderRadius: 8, padding: "10px 12px" }}>
          <div>
            <p style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>Preço</p>
            <p style={{ fontSize: 28, fontWeight: 900, color: "#166534", lineHeight: 1 }}>
              {produto.preco ? BRL.format(Number(produto.preco)) : "—"}
            </p>
          </div>
          {produto.preco_referencia && (
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 9, color: "#9ca3af" }}>Ref. ML</p>
              <p style={{ fontSize: 12, color: "#2563eb", fontWeight: 600 }}>
                {BRL.format(Number(produto.preco_referencia))}
              </p>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e5e7eb", paddingTop: 7 }}>
          {produto.quantidade && produto.quantidade > 1 && (
            <span style={{ fontSize: 10, color: "#6b7280" }}>Qtd: {produto.quantidade}</span>
          )}
          <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: "auto" }}>
            {DATE.format(new Date(produto.data_triagem))}
          </span>
        </div>
      </div>

    </>
  );
}
