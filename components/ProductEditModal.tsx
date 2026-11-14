"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { ProdutoTriagem } from "@/app/api/triagem/route";
import type { Triagem } from "@/app/api/triagens/route";
import { CATEGORIAS } from "@/lib/categorias";

const DATE = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit",
});

function fmt(v: number | null | undefined) {
  return v != null ? String(v).replace(".", ",") : "";
}

interface Props {
  p: ProdutoTriagem;
  triagens: Triagem[];
  onClose: () => void;
  onSaved: () => void;
}

export default function ProductEditModal({ p, triagens, onClose, onSaved }: Props) {
  const [fields, setFields] = useState({
    descricao:        p.descricao,
    catalogo:         !!p.catalogo,
    categoria:        p.categoria ?? "",
    foto_url:         p.foto_url ?? "",
    codigo:           p.codigo ?? "",
    endereco:         p.endereco ?? "",
    quantidade:       String(p.quantidade ?? 1),
    preco_referencia: fmt(p.preco_referencia as unknown as number),
    custo:            fmt(p.custo as unknown as number),
    preco:            fmt(p.preco as unknown as number),
    triagem_id:       p.triagem_id as number | null,
  });
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handlePhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro no upload.");
      setFields(f => ({ ...f, foto_url: data.url }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erro no upload.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  function parse(v: string) {
    const n = parseFloat(v.replace(",", "."));
    return isNaN(n) ? null : n;
  }

  async function handleSave() {
    if (!fields.descricao.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/triagem?id=${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao:        fields.descricao.trim(),
          catalogo:         fields.catalogo,
          foto_url:         fields.foto_url || null,
          categoria:        fields.categoria || null,
          codigo:           fields.codigo || null,
          endereco:         fields.endereco || null,
          quantidade:       parseInt(fields.quantidade) || 1,
          preco_referencia: parse(fields.preco_referencia),
          custo:            parse(fields.custo),
          preco:            parse(fields.preco),
          triagem_id:       fields.triagem_id,
        }),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none px-3 py-2.5 text-sm transition-colors bg-white";

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-bold text-gray-800 text-base">Editar produto</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              <span className="font-mono">#{p.id}</span>
              {" · "}
              {DATE.format(new Date(p.data_triagem))}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Corpo */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">

          {/* Foto + Descrição */}
          <div className="flex gap-4">
            {/* Área de foto com upload */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors flex items-center justify-center group"
                title="Clique para tirar foto ou fazer upload"
              >
                {fields.foto_url ? (
                  <>
                    <Image src={fields.foto_url} alt="foto" fill className="object-contain p-1" unoptimized />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </>
                ) : uploading ? (
                  <svg className="w-6 h-6 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-gray-400">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-[9px] text-center leading-tight">Foto</span>
                  </div>
                )}
              </button>
              {fields.foto_url && !uploading && (
                <button
                  type="button"
                  onClick={() => setFields(f => ({ ...f, foto_url: "" }))}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  Remover
                </button>
              )}
              {uploadError && <p className="text-xs text-red-500 text-center">{uploadError}</p>}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoFile}
              />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Descrição</label>
              <textarea
                rows={3}
                value={fields.descricao}
                onChange={(e) => setFields(f => ({ ...f, descricao: e.target.value }))}
                className={inp + " resize-none"}
                autoFocus
              />
            </div>
          </div>

          {/* Catálogo público */}
          <button
            type="button"
            onClick={() => setFields(f => ({ ...f, catalogo: !f.catalogo }))}
            className={`flex items-center gap-3 w-full rounded-xl border-2 px-4 py-3 transition-colors text-left ${
              fields.catalogo
                ? "border-orange-400 bg-orange-50"
                : "border-gray-200 bg-white hover:border-orange-300"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              fields.catalogo ? "bg-orange-500" : "bg-gray-200"
            }`}>
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <p className={`font-semibold text-sm ${fields.catalogo ? "text-orange-700" : "text-gray-500"}`}>
                {fields.catalogo ? "Publicado no catálogo" : "Fora do catálogo"}
              </p>
              <p className="text-xs text-gray-400">
                {fields.catalogo ? "Visível em /catalogo com botão de WhatsApp" : "Clique para publicar na vitrine pública"}
              </p>
            </div>
            <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              fields.catalogo ? "border-orange-500 bg-orange-500" : "border-gray-300"
            }`}>
              {fields.catalogo && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </button>

          {/* Categoria */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-purple-500 uppercase tracking-wide flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Categoria
            </label>
            <select
              value={fields.categoria}
              onChange={(e) => setFields(f => ({ ...f, categoria: e.target.value }))}
              className={inp}
            >
              <option value="">— Sem categoria —</option>
              {CATEGORIAS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Código · Endereço · Quantidade */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Código</label>
              <input
                value={fields.codigo}
                onChange={(e) => setFields(f => ({ ...f, codigo: e.target.value }))}
                placeholder="—"
                className={inp + " font-mono"}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Endereço</label>
              <input
                value={fields.endereco}
                onChange={(e) => setFields(f => ({ ...f, endereco: e.target.value }))}
                placeholder="ex: A2"
                className={inp}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Qtd</label>
              <input
                value={fields.quantidade}
                onChange={(e) => setFields(f => ({ ...f, quantidade: e.target.value }))}
                inputMode="numeric"
                placeholder="1"
                className={inp + " text-center"}
              />
            </div>
          </div>

          {/* Preços */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Ref. ML</label>
              <input
                value={fields.preco_referencia}
                onChange={(e) => setFields(f => ({ ...f, preco_referencia: e.target.value }))}
                inputMode="decimal"
                placeholder="0,00"
                className={inp + " font-mono text-blue-700"}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Custo</label>
              <input
                value={fields.custo}
                onChange={(e) => setFields(f => ({ ...f, custo: e.target.value }))}
                inputMode="decimal"
                placeholder="0,00"
                className={inp + " font-mono text-orange-600"}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-green-500 uppercase tracking-wide">Outlet</label>
              <input
                value={fields.preco}
                onChange={(e) => setFields(f => ({ ...f, preco: e.target.value }))}
                inputMode="decimal"
                placeholder="0,00"
                className={inp + " font-mono font-semibold text-green-700"}
              />
            </div>
          </div>

          {/* Triagem */}
          {triagens.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Triagem</label>
              <select
                value={fields.triagem_id ?? ""}
                onChange={(e) => setFields(f => ({
                  ...f,
                  triagem_id: e.target.value ? parseInt(e.target.value) : null,
                }))}
                className={inp}
              >
                <option value="">Sem triagem</option>
                {triagens.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.status === "ativa" ? "● " : "✓ "}
                    {t.nome || `Triagem #${t.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Info extra read-only */}
          {p.codigo_ml && (
            <p className="text-xs text-gray-400">
              Mercado Livre:{" "}
              <span className="font-mono bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded">
                {p.codigo_ml}
              </span>
            </p>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !fields.descricao.trim()}
            className="px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Salvando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Salvar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
