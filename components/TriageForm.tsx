"use client";

import { useEffect, useRef, useState } from "react";
import type { MLItem } from "@/app/api/search/route";
import type { ProdutoTriagem } from "@/app/api/triagem/route";
import Image from "next/image";
import { CATEGORIAS } from "@/lib/categorias";
import { compressImage } from "@/lib/image";
import { STATUS_OPTIONS, type ProdutoStatus } from "@/lib/status";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface SearchResult {
  items: MLItem[];
  searchUrl: string;
  mode: "google" | "link";
}

interface MLRef {
  id: string;
  title: string;
  price: number | null;
  permalink: string;
  thumbnail: string;
}

interface Props {
  triagemId?: number;
  onProductSaved?: (preco: number, custo: number, qty: number) => void;
}

export default function TriageForm({ triagemId, onProductSaved }: Props) {
  const [codigo, setCodigo]         = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto]           = useState<string | null>(null);
  const [categoria, setCategoria]   = useState("");
  const [custo, setCusto]           = useState("");
  const [preco, setPreco]           = useState("");
  const [status, setStatus]         = useState<ProdutoStatus>("");
  const [vendaML, setVendaML]       = useState(false);
  const [mlRef, setMlRef]           = useState<MLRef | null>(null);

  const [result, setResult]         = useState<SearchResult | null>(null);
  const [loading, setLoading]       = useState(false);
  const [searched, setSearched]     = useState(false);

  const [mlCode, setMlCode]         = useState("");
  const [mlLoading, setMlLoading]   = useState(false);
  const [mlError, setMlError]       = useState<string | null>(null);

  const [saving, setSaving]         = useState(false);
  const [savedInfo, setSavedInfo]   = useState<{ id: number; descricao: string } | null>(null);
  const [error, setError]           = useState<string | null>(null);

  // Detecção de produto existente pelo código
  const [existingMatch, setExistingMatch]   = useState<ProdutoTriagem | null>(null);
  const [incrementing, setIncrementing]     = useState(false);
  const [incrementDone, setIncrementDone]   = useState<{ qty: number; desc: string } | null>(null);

  // Busca manual de produto existente
  const [showBusca, setShowBusca]           = useState(false);
  const [buscaQuery, setBuscaQuery]         = useState("");
  const [buscaResults, setBuscaResults]     = useState<ProdutoTriagem[]>([]);
  const [buscaLoading, setBuscaLoading]     = useState(false);

  const fileRef  = useRef<HTMLInputElement>(null);
  const formRef  = useRef<HTMLDivElement>(null);
  const precoRef = useRef<HTMLInputElement>(null);

  // Busca manual por descrição/código
  useEffect(() => {
    setBuscaResults([]);
    if (!buscaQuery.trim()) return;
    const t = setTimeout(async () => {
      setBuscaLoading(true);
      try {
        const res  = await fetch(`/api/triagem?busca=${encodeURIComponent(buscaQuery.trim())}`);
        const data = await res.json();
        setBuscaResults(Array.isArray(data) ? data : []);
      } finally {
        setBuscaLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [buscaQuery]);

  // Busca produto existente ao digitar/escanear o código
  useEffect(() => {
    setExistingMatch(null);
    setIncrementDone(null);
    if (!codigo.trim()) return;
    const t = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/triagem?codigo=${encodeURIComponent(codigo.trim())}`);
        const data = await res.json();
        setExistingMatch(Array.isArray(data) && data.length > 0 ? data[0] : null);
      } catch { /* silencioso */ }
    }, 400);
    return () => clearTimeout(t);
  }, [codigo]);

  function applyMlRef(ref: MLRef) {
    setMlRef(ref);
    if (ref.price) {
      const outlet = Math.round(ref.price * 0.8 * 100) / 100;
      setPreco(outlet.toFixed(2).replace(".", ","));
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const compressed = await compressImage(reader.result as string);
      setPhoto(compressed);
    };
    reader.readAsDataURL(file);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setLoading(true); setError(null); setResult(null); setSearched(false);
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(description.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro desconhecido.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar.");
    } finally {
      setLoading(false); setSearched(true);
    }
  }

  async function handleMlCode(e?: React.MouseEvent | React.KeyboardEvent) {
    e?.preventDefault();
    if (!mlCode.trim()) return;
    setMlLoading(true); setMlError(null);
    try {
      const res  = await fetch(`/api/ml-item?id=${encodeURIComponent(mlCode.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao buscar código ML.");
      if (data.name) setDescription(data.name);
      if (data.thumbnail) setPhoto(data.thumbnail);
      applyMlRef({ id: data.id ?? mlCode.trim(), title: data.name, price: data.price ?? null, permalink: "", thumbnail: data.thumbnail ?? "" });
      if (data.partial) setMlError("Nome extraído da URL — confirme e adicione preço/foto manualmente.");
      setMlCode(""); setSavedInfo(null);
      precoRef.current?.focus();
    } catch (err) {
      setMlError(err instanceof Error ? err.message : "Erro ao buscar.");
    } finally {
      setMlLoading(false);
    }
  }

  function handleSelectItem(item: MLItem) {
    setDescription(item.title);
    if (item.thumbnail) setPhoto(item.thumbnail);
    applyMlRef({ id: item.id, title: item.title, price: item.price, permalink: item.permalink, thumbnail: item.thumbnail });
    setResult(null); setSearched(false); setError(null); setSavedInfo(null);
    if (fileRef.current) fileRef.current.value = "";
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => precoRef.current?.focus(), 300);
  }

  async function handleSave() {
    if (!description.trim()) return;
    setSaving(true); setSavedInfo(null); setError(null);
    try {
      const precoNum = preco ? parseFloat(preco.replace(",", ".")) : 0;
      const custoNum = custo ? parseFloat(custo.replace(",", ".")) : 0;
      const payload  = {
        codigo:           codigo.trim() || undefined,
        descricao:        description.trim(),
        foto_url:         photo || undefined, // data URL comprimido ou URL do ML
        codigo_ml:        mlRef?.id || undefined,
        preco_referencia: mlRef?.price ?? undefined,
        custo:            custoNum || undefined,
        preco:            precoNum || undefined,
        triagem_id:       triagemId ?? undefined,
        categoria:        categoria || undefined,
        status:           status || undefined,
        venda_ml:         vendaML || undefined,
      };
      const res  = await fetch("/api/triagem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSavedInfo({ id: data.id, descricao: description.trim() });
      onProductSaved?.(precoNum, custoNum, 1);
      setTimeout(() => {
        handleClear();
      }, 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleIncrement() {
    if (!existingMatch) return;
    setIncrementing(true);
    try {
      const newQty = (existingMatch.quantidade ?? 1) + 1;
      await fetch(`/api/triagem?id=${existingMatch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantidade: newQty }),
      });
      setIncrementDone({ qty: newQty, desc: existingMatch.descricao });
      setExistingMatch(null);
      onProductSaved?.(Number(existingMatch.preco ?? 0), Number(existingMatch.custo ?? 0), 1);
      setTimeout(() => { setIncrementDone(null); setCodigo(""); }, 2500);
    } finally {
      setIncrementing(false);
    }
  }

  function handleClear() {
    setCodigo(""); setDescription(""); setPhoto(null); setCategoria("");
    setCusto(""); setPreco(""); setMlRef(null); setResult(null);
    setError(null); setSearched(false); setSavedInfo(null);
    setStatus(""); setVendaML(false);
    setExistingMatch(null); setIncrementDone(null); setSavedInfo(null);
    setShowBusca(false); setBuscaQuery(""); setBuscaResults([]);
    if (fileRef.current) fileRef.current.value = "";
  }

  const hasResults = result?.mode === "google" && result.items.length > 0;
  const needsSetup = searched && result?.mode === "link";

  return (
    <div ref={formRef} className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-4 flex flex-col gap-4">

      <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col divide-y divide-gray-100">

        {/* ── Importar do ML ── */}
        <div className="p-4">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
            <svg className="w-3.5 h-3.5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Importar do Mercado Livre
          </label>
          <div className="flex gap-2">
            <input
              autoFocus
              value={mlCode}
              onChange={(e) => { setMlCode(e.target.value); setMlError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleMlCode(e); } }}
              placeholder="Código MLB ou URL do produto..."
              className="flex-1 min-w-0 rounded-xl border-2 border-yellow-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 outline-none px-3 py-2.5 text-sm font-mono transition-colors"
            />
            <button
              type="button"
              onClick={handleMlCode}
              disabled={mlLoading || !mlCode.trim()}
              className="px-4 py-2.5 rounded-xl bg-yellow-400 text-gray-900 text-sm font-bold hover:bg-yellow-500 disabled:opacity-50 transition-colors flex items-center gap-1.5 flex-shrink-0"
            >
              {mlLoading
                ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
              }
              <span className="hidden sm:inline">Importar</span>
            </button>
          </div>
          {mlError && <p className="text-xs text-red-500 mt-1.5">{mlError}</p>}
        </div>

        {/* ── Foto + Descrição ── */}
        <div className="p-4 flex gap-3">
          {/* Foto — tamanho fixo em mobile */}
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors bg-gray-50 hover:bg-blue-50 overflow-hidden flex items-center justify-center"
            >
              {photo ? (
                <Image src={photo} alt="Produto" fill className="object-cover" unoptimized />
              ) : (
                <div className="flex flex-col items-center gap-1 text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"/>
                  </svg>
                  <span className="text-[10px] text-center leading-tight">Foto</span>
                </div>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            {photo && (
              <button
                type="button"
                onClick={() => { setPhoto(null); if (fileRef.current) fileRef.current.value = ""; }}
                className="text-[10px] text-red-400 hover:text-red-600 self-center"
              >
                Remover
              </button>
            )}
          </div>

          {/* Descrição */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <label htmlFor="desc" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Descrição</label>
            <textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nome do produto..."
              rows={4}
              className="flex-1 resize-none rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none px-3 py-2.5 text-sm leading-relaxed transition-colors"
            />
            {mlRef && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <svg className="w-3 h-3 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                <span>ML importado</span>
                {mlRef.permalink && (
                  <a href={mlRef.permalink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-0.5">ver →</a>
                )}
              </p>
            )}
          </div>
        </div>

        {/* ── Categoria ── */}
        <div className="px-4 py-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
            </svg>
            Categoria
          </label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full rounded-xl border border-gray-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none px-3 py-2.5 text-sm bg-white transition-colors text-gray-700"
          >
            <option value="">— Selecionar —</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* ── Status ── */}
        <div className="px-4 py-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Status do produto
          </label>
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => setStatus(o.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border-2 transition-all ${
                  status === o.value
                    ? o.value === ""
                      ? "border-gray-400 bg-gray-100 text-gray-700"
                      : o.color
                    : "border-gray-200 text-gray-400 hover:border-gray-400"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Mercado Livre ── */}
        <div className="px-4 py-3">
          <button
            type="button"
            onClick={() => setVendaML(v => !v)}
            className={`flex items-center gap-3 w-full rounded-xl border-2 px-4 py-2.5 transition-colors text-left ${
              vendaML ? "border-yellow-400 bg-yellow-50" : "border-gray-200 bg-white hover:border-yellow-300"
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              vendaML ? "bg-yellow-400" : "bg-gray-200"
            }`}>
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
            </div>
            <span className={`text-sm font-semibold ${vendaML ? "text-yellow-700" : "text-gray-500"}`}>
              {vendaML ? "Anúncio no Mercado Livre" : "Marcar como anúncio ML"}
            </span>
            <div className={`ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              vendaML ? "border-yellow-500 bg-yellow-500" : "border-gray-300"
            }`}>
              {vendaML && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                </svg>
              )}
            </div>
          </button>
        </div>

        {/* ── Código ── */}
        <div className="px-4 py-3 flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
              </svg>
              Código de barras
            </label>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Leia ou digite o código..."
              className="w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none px-3 py-2.5 text-sm font-mono transition-colors"
            />
          </div>

          {/* Produto já existe — opção de incrementar */}
          {existingMatch && !incrementDone && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3 flex flex-col gap-2.5">
              <div className="flex items-start gap-3">
                {existingMatch.foto_url && (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white flex-shrink-0 border border-amber-200">
                    <Image src={existingMatch.foto_url} alt="" fill className="object-contain p-0.5" unoptimized />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">Produto já cadastrado</p>
                  <p className="text-sm font-medium text-gray-800 leading-snug mt-0.5 line-clamp-2">
                    {existingMatch.descricao}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <span className="font-mono">#{existingMatch.id}</span>
                    {" · estoque atual: "}
                    <strong>{existingMatch.quantidade ?? 1}</strong> unid.
                    {existingMatch.preco ? ` · ${BRL.format(Number(existingMatch.preco))}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={incrementing}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  {incrementing ? "..." : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                      </svg>
                      +1 → {(existingMatch.quantidade ?? 1) + 1} em estoque
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setExistingMatch(null)}
                  className="px-3 py-2 rounded-xl border border-gray-300 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
                >
                  Criar novo
                </button>
              </div>
            </div>
          )}

          {/* Confirmação de incremento */}
          {incrementDone && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-green-700">Quantidade atualizada!</p>
                <p className="text-xs text-green-600 truncate">
                  {incrementDone.desc} — agora {incrementDone.qty} unid. em estoque
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Buscar produto existente ── */}
        <div className="px-4 py-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => { setShowBusca(v => !v); setBuscaQuery(""); setBuscaResults([]); setExistingMatch(null); }}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            {showBusca ? "Fechar busca" : "Buscar produto existente"}
          </button>

          {showBusca && (
            <div className="mt-2.5 flex flex-col gap-2">
              <div className="relative">
                <input
                  autoFocus
                  value={buscaQuery}
                  onChange={e => setBuscaQuery(e.target.value)}
                  placeholder="Nome, código ou ID do produto..."
                  className="w-full rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none pl-9 pr-3 py-2.5 text-sm transition-colors"
                />
                <svg className="w-4 h-4 text-blue-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                {buscaLoading && (
                  <svg className="w-4 h-4 animate-spin text-blue-400 absolute right-2.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                )}
              </div>

              {buscaQuery && !buscaLoading && buscaResults.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">Nenhum produto encontrado.</p>
              )}

              {buscaResults.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setExistingMatch(p);
                    setShowBusca(false);
                    setBuscaQuery("");
                    setBuscaResults([]);
                  }}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                >
                  {p.foto_url ? (
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image src={p.foto_url} alt="" fill className="object-contain p-0.5" unoptimized />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-1">{p.descricao}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      <span className="font-mono">#{p.id}</span>
                      {p.codigo && <span className="ml-1 font-mono">{p.codigo}</span>}
                      {" · "}{p.quantidade ?? 1} em estoque
                      {p.preco ? ` · ${BRL.format(Number(p.preco))}` : ""}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Preços ── */}
        <div className="px-4 py-3 flex flex-col gap-3">
          {/* Ref ML + Custo lado a lado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Ref. ML</label>
              <input
                type="text"
                inputMode="decimal"
                value={mlRef?.price ? String(mlRef.price) : ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value.replace(",", "."));
                  setMlRef(prev => prev
                    ? { ...prev, price: isNaN(val) ? null : val }
                    : { id: "", title: "", price: isNaN(val) ? null : val, permalink: "", thumbnail: "" });
                  if (!isNaN(val)) setPreco((Math.round(val * 0.8 * 100) / 100).toFixed(2).replace(".", ","));
                }}
                placeholder="0,00"
                className="w-full rounded-xl border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none px-3 py-2.5 text-sm font-mono text-blue-700 font-semibold transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Custo</label>
              <input
                type="text"
                inputMode="decimal"
                value={custo}
                onChange={(e) => setCusto(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-xl border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none px-3 py-2.5 text-sm font-mono transition-colors"
              />
            </div>
          </div>

          {/* Preço outlet — destaque */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-green-600 uppercase tracking-wide flex items-center gap-1.5">
              Preço Outlet
              {mlRef?.price && (
                <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold">80% do ML</span>
              )}
            </label>
            <input
              ref={precoRef}
              type="text"
              inputMode="decimal"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-xl border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none px-4 py-3 text-lg font-black text-green-700 transition-colors"
            />
            {mlRef?.price && (
              <button
                type="button"
                onClick={() => setPreco((Math.round(mlRef.price! * 0.8 * 100) / 100).toFixed(2).replace(".", ","))}
                className="text-xs text-green-600 hover:underline self-start"
              >
                ↺ recalcular 80%
              </button>
            )}
          </div>
        </div>

        {/* ── Botões ── */}
        <div className="p-4 flex flex-col gap-3">

          {/* Banner de sucesso */}
          {savedInfo ? (
            <div className="w-full rounded-2xl bg-green-500 text-white px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base leading-tight">Produto salvo!</p>
                <p className="text-sm text-green-100 truncate mt-0.5">{savedInfo.descricao}</p>
                <p className="text-xs text-green-200 mt-0.5">#{savedInfo.id} · limpando em instantes...</p>
              </div>
            </div>
          ) : (
            /* Salvar — botão principal full width */
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !description.trim()}
              className="w-full py-3.5 rounded-2xl bg-green-600 text-white font-bold text-base hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Salvando...</>
              ) : (
                <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>Salvar produto</>
              )}
            </button>
          )}

          {/* Limpar + Buscar ML */}
          {!savedInfo && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(codigo || description || searched) && (
                  <button type="button" onClick={handleClear} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                    Limpar
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || !description.trim()}
                className="px-4 py-2 rounded-xl border border-blue-300 text-blue-600 text-sm font-semibold hover:bg-blue-50 disabled:opacity-40 transition-colors flex items-center gap-1.5"
              >
                {loading
                  ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                }
                Buscar ML
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}
        </div>
      </form>

      {/* ── Resultados ML ── */}
      {hasResults && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              {result.items.length} resultados no Mercado Livre
            </h2>
            <a href={result.searchUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline">Ver todos →</a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {result.items.map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all overflow-hidden flex flex-col">
                {item.thumbnail ? (
                  <div className="relative aspect-square bg-gray-50">
                    <Image src={item.thumbnail} alt={item.title} fill className="object-contain p-2" unoptimized />
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                )}
                <div className="p-2.5 flex flex-col gap-1 flex-1">
                  <p className="text-xs text-gray-600 leading-snug line-clamp-3 flex-1">{item.title}</p>
                  {item.price
                    ? <span className="text-blue-700 font-bold text-sm">{BRL.format(item.price)}</span>
                    : <span className="text-xs text-gray-400 italic">Sem preço</span>
                  }
                </div>
                <div className="px-2.5 pb-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectItem(item)}
                    className="w-full text-xs bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Usar este
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {searched && result?.mode === "google" && result.items.length === 0 && !error && (
        <div className="text-center py-8 text-gray-400 text-sm">
          Nenhum resultado. Tente uma descrição mais curta.
        </div>
      )}

      {needsSetup && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold mb-0.5">Busca por texto não configurada</p>
          <p className="text-xs text-amber-700">
            Use <strong>Importar do ML</strong> com o código (ex: MLB59905419) para buscar direto.
          </p>
        </div>
      )}
    </div>
  );
}
