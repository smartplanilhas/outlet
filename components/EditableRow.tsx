"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { ProdutoTriagem } from "@/app/api/triagem/route";
import type { Triagem } from "@/app/api/triagens/route";
import DeleteButton from "./DeleteButton";
import ProductEditModal from "./ProductEditModal";

const BRL  = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

// ─── Atribuição rápida de triagem ─────────────────────────────────────────────
function TriagemQuickAssign({
  produtoId,
  triagemId,
  triagens,
  onDone,
}: {
  produtoId: number;
  triagemId: number | null;
  triagens: Triagem[];
  onDone: () => void;
}) {
  const [open, setOpen]     = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = triagens.find(t => t.id === triagemId);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  async function assign(id: number | null) {
    setSaving(true);
    try {
      await fetch(`/api/triagem?id=${produtoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triagem_id: id }),
      });
      setOpen(false);
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div ref={ref} className="relative inline-block mt-0.5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={saving}
        className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
          current
            ? "bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium"
            : "text-gray-300 hover:text-blue-500 hover:bg-blue-50"
        }`}
      >
        {saving ? "..." : current ? (current.nome || `Triagem #${current.id}`) : "Atribuir triagem"}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-60 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
          {triagens.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-gray-400">Nenhuma triagem criada.</p>
          ) : (
            triagens.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => assign(t.id)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                  t.id === triagemId ? "bg-blue-50" : ""
                }`}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  t.status === "ativa" ? "bg-green-400" : "bg-gray-300"
                }`} />
                <span className="text-sm text-gray-800 truncate flex-1">
                  {t.nome || `Triagem #${t.id}`}
                </span>
                {t.id === triagemId && (
                  <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))
          )}
          {triagemId !== null && (
            <>
              <div className="border-t border-gray-100" />
              <button
                type="button"
                onClick={() => assign(null)}
                className="w-full px-3 py-2 text-left text-xs text-red-500 hover:bg-red-50 transition-colors"
              >
                Remover triagem
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Linha da tabela ──────────────────────────────────────────────────────────
export default function EditableRow({ p, triagens = [] }: { p: ProdutoTriagem; triagens?: Triagem[] }) {
  const [showModal, setShowModal]       = useState(false);
  const [inCatalog, setInCatalog]       = useState(!!p.catalogo);
  const [togglingCat, setTogglingCat]   = useState(false);
  const router = useRouter();

  async function toggleCatalog() {
    setTogglingCat(true);
    const next = !inCatalog;
    setInCatalog(next);
    try {
      await fetch(`/api/triagem?id=${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalogo: next }),
      });
      router.refresh();
    } catch {
      setInCatalog(!next);
    } finally {
      setTogglingCat(false);
    }
  }

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors group">
        <td className="px-4 py-3 text-center">
          <span className="text-xs font-mono font-semibold text-gray-400">#{p.id}</span>
        </td>

        <td className="px-4 py-3">
          {p.foto_url ? (
            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              <Image src={p.foto_url} alt={p.descricao} fill className="object-contain" unoptimized />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </td>

        <td className="px-4 py-3">
          <p className="font-medium text-gray-800 line-clamp-2 leading-snug">{p.descricao}</p>
          {p.categoria && (
            <span className="inline-block text-xs bg-purple-50 text-purple-700 font-medium px-1.5 py-0.5 rounded mt-0.5">
              {p.categoria}
            </span>
          )}
          {p.codigo_ml && <span className="block text-xs text-gray-400 font-mono mt-0.5">{p.codigo_ml}</span>}
          {triagens.length > 0 && (
            <TriagemQuickAssign
              produtoId={p.id}
              triagemId={p.triagem_id}
              triagens={triagens}
              onDone={() => router.refresh()}
            />
          )}
        </td>

        <td className="px-4 py-3 hidden sm:table-cell">
          <span className="font-mono text-xs text-gray-500">{p.codigo ?? "—"}</span>
        </td>

        <td className="px-4 py-3 hidden sm:table-cell">
          {p.endereco
            ? <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg">{p.endereco}</span>
            : <span className="text-xs text-gray-300">—</span>}
        </td>

        <td className="px-4 py-3 text-center">
          <span className="font-semibold text-gray-700">{p.quantidade ?? 1}</span>
        </td>

        <td className="px-4 py-3 text-right">
          <span className="text-blue-600 font-semibold">
            {p.preco_referencia ? BRL.format(Number(p.preco_referencia)) : "—"}
          </span>
        </td>

        <td className="px-4 py-3 text-right hidden md:table-cell">
          <span className="text-gray-600">{p.custo ? BRL.format(Number(p.custo)) : "—"}</span>
        </td>

        <td className="px-4 py-3 text-right">
          <span className="text-green-700 font-bold">{p.preco ? BRL.format(Number(p.preco)) : "—"}</span>
        </td>

        <td className="px-4 py-3 text-right hidden lg:table-cell">
          <span className="text-gray-400 text-xs">{DATE.format(new Date(p.data_triagem))}</span>
        </td>

        <td className="px-2 py-3">
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={toggleCatalog}
              disabled={togglingCat}
              title={inCatalog ? "Remover do catálogo" : "Publicar no catálogo"}
              className={`p-1.5 rounded-lg transition-colors ${
                inCatalog
                  ? "text-orange-500 bg-orange-50 hover:bg-orange-100"
                  : "text-gray-300 hover:text-orange-400 hover:bg-orange-50"
              }`}
            >
              <svg className="w-4 h-4" fill={inCatalog ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="p-1.5 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <a
              href={`/etiqueta/${p.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-300 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
              title="Imprimir etiqueta"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </a>
            <DeleteButton id={p.id} />
          </div>
        </td>
      </tr>

      {showModal && createPortal(
        <ProductEditModal
          p={p}
          triagens={triagens}
          onClose={() => setShowModal(false)}
          onSaved={() => { router.refresh(); setShowModal(false); }}
        />,
        document.body
      )}
    </>
  );
}
