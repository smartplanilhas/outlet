"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { ProdutoTriagem } from "@/app/api/triagem/route";
import DeleteButton from "./DeleteButton";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

function fmt(v: number | null | undefined) {
  return v != null ? String(v).replace(".", ",") : "";
}

export default function EditableRow({ p }: { p: ProdutoTriagem }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState({
    descricao: p.descricao,
    codigo: p.codigo ?? "",
    quantidade: String(p.quantidade ?? 1),
    preco_referencia: fmt(p.preco_referencia as unknown as number),
    custo: fmt(p.custo as unknown as number),
    preco: fmt(p.preco as unknown as number),
  });
  const router = useRouter();

  function parse(v: string) {
    const n = parseFloat(v.replace(",", "."));
    return isNaN(n) ? null : n;
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`/api/triagem?id=${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: fields.descricao,
          codigo: fields.codigo || null,
          quantidade: parseInt(fields.quantidade) || 1,
          preco_referencia: parse(fields.preco_referencia),
          custo: parse(fields.custo),
          preco: parse(fields.preco),
        }),
      });
      router.refresh();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setFields({
      descricao: p.descricao,
      codigo: p.codigo ?? "",
      quantidade: String(p.quantidade ?? 1),
      preco_referencia: fmt(p.preco_referencia as unknown as number),
      custo: fmt(p.custo as unknown as number),
      preco: fmt(p.preco as unknown as number),
    });
    setEditing(false);
  }

  const cell = "px-2 py-1.5 w-full rounded-lg border border-blue-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none text-sm font-mono transition-colors";

  if (editing) {
    return (
      <tr className="bg-blue-50 border-b border-blue-100">
        <td className="px-4 py-2 text-center">
          <span className="text-xs font-mono font-semibold text-gray-400">#{p.id}</span>
        </td>
        <td className="px-4 py-2">
          {p.foto_url ? (
            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              <Image src={p.foto_url} alt={p.descricao} fill className="object-contain" unoptimized />
            </div>
          ) : <div className="w-10 h-10 rounded-lg bg-gray-100" />}
        </td>
        <td className="px-4 py-2">
          <input value={fields.descricao} onChange={(e) => setFields(f => ({ ...f, descricao: e.target.value }))}
            className={cell + " mb-1"} />
          <span className="text-xs text-gray-400 font-mono">{p.codigo_ml}</span>
        </td>
        <td className="px-4 py-2 hidden sm:table-cell">
          <input value={fields.codigo} onChange={(e) => setFields(f => ({ ...f, codigo: e.target.value }))}
            placeholder="código" className={cell} />
        </td>
        <td className="px-4 py-2 text-center">
          <input value={fields.quantidade} onChange={(e) => setFields(f => ({ ...f, quantidade: e.target.value }))}
            inputMode="numeric" placeholder="1" className={cell + " text-center w-14"} />
        </td>
        <td className="px-4 py-2 text-right">
          <input value={fields.preco_referencia} onChange={(e) => setFields(f => ({ ...f, preco_referencia: e.target.value }))}
            inputMode="decimal" placeholder="0,00" className={cell + " text-right w-28"} />
        </td>
        <td className="px-4 py-2 text-right hidden md:table-cell">
          <input value={fields.custo} onChange={(e) => setFields(f => ({ ...f, custo: e.target.value }))}
            inputMode="decimal" placeholder="0,00" className={cell + " text-right w-24"} />
        </td>
        <td className="px-4 py-2 text-right">
          <input value={fields.preco} onChange={(e) => setFields(f => ({ ...f, preco: e.target.value }))}
            inputMode="decimal" placeholder="0,00" className={cell + " text-right w-28 font-semibold text-green-700"} />
        </td>
        <td className="px-4 py-2 hidden lg:table-cell" />
        <td className="px-2 py-2">
          <div className="flex flex-col gap-1">
            <button onClick={handleSave} disabled={saving}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition-colors">
              {saving ? "..." : "Salvar"}
            </button>
            <button onClick={handleCancel}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
              Cancelar
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-gray-800 line-clamp-2 leading-snug">{p.descricao}</p>
        {p.codigo_ml && <span className="text-xs text-gray-400 font-mono">{p.codigo_ml}</span>}
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <span className="font-mono text-xs text-gray-500">{p.codigo ?? "—"}</span>
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
          <button onClick={() => setEditing(true)}
            className="p-1.5 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            title="Editar">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <DeleteButton id={p.id} />
        </div>
      </td>
    </tr>
  );
}
