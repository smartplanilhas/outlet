"use client";

import { useRef, useState } from "react";
import type { MLItem } from "@/app/api/search/route";
import Image from "next/image";

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

export default function TriageForm() {
  // campos do produto
  const [codigo, setCodigo] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [custo, setCusto] = useState("");
  const [preco, setPreco] = useState("");
  const [mlRef, setMlRef] = useState<MLRef | null>(null);

  // busca ML
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // importar por código ML
  const [mlCode, setMlCode] = useState("");
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState<string | null>(null);

  // salvar
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const precoRef = useRef<HTMLInputElement>(null);

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
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSearched(false);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(description.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro desconhecido.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar.");
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }

  async function handleMlCode(e?: React.MouseEvent | React.KeyboardEvent) {
    e?.preventDefault();
    if (!mlCode.trim()) return;
    setMlLoading(true);
    setMlError(null);
    try {
      const res = await fetch(`/api/ml-item?id=${encodeURIComponent(mlCode.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao buscar código ML.");
      if (data.name) setDescription(data.name);
      if (data.thumbnail) setPhoto(data.thumbnail);
      applyMlRef({ id: data.id ?? mlCode.trim(), title: data.name, price: data.price ?? null, permalink: "", thumbnail: data.thumbnail });
      setMlCode("");
      setSavedId(null);
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
    setResult(null);
    setSearched(false);
    setError(null);
    setSavedId(null);
    if (fileRef.current) fileRef.current.value = "";
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => precoRef.current?.focus(), 300);
  }

  async function handleSave() {
    if (!description.trim()) return;
    setSaving(true);
    setSavedId(null);
    setError(null);
    try {
      const payload = {
        codigo: codigo.trim() || undefined,
        descricao: description.trim(),
        foto_url: photo?.startsWith("http") ? photo : undefined,
        codigo_ml: mlRef?.id || undefined,
        preco_referencia: mlRef?.price ?? undefined,
        custo: custo ? parseFloat(custo.replace(",", ".")) : undefined,
        preco: preco ? parseFloat(preco.replace(",", ".")) : undefined,
      };
      const res = await fetch("/api/triagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSavedId(data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  function handleClear() {
    setCodigo("");
    setDescription("");
    setPhoto(null);
    setCusto("");
    setPreco("");
    setMlRef(null);
    setResult(null);
    setError(null);
    setSearched(false);
    setSavedId(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const hasResults = result?.mode === "google" && result.items.length > 0;
  const needsSetup = searched && result?.mode === "link";

  return (
    <div ref={formRef} className="w-full max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">

      <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col gap-5">

        {/* Linha 1: Importar do ML — campo principal */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              placeholder="Cole o código MLB ou a URL completa do produto..."
              className="flex-1 rounded-xl border-2 border-yellow-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 outline-none px-4 py-3 text-sm font-mono transition-colors"
            />
            <button type="button" onClick={handleMlCode} disabled={mlLoading || !mlCode.trim()}
              className="px-5 py-3 rounded-xl bg-yellow-400 text-gray-900 text-sm font-bold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap">
              {mlLoading
                ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              }
              Importar
            </button>
          </div>
          {mlError && <p className="text-xs text-red-500 mt-1">{mlError}</p>}
        </div>

        {/* Linha 2: Foto + Descrição */}
        <div className="flex flex-col sm:flex-row gap-5 border-t border-gray-100 pt-4">
          <div className="flex flex-col gap-2 sm:w-48 flex-shrink-0">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Foto</label>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="relative w-full aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors bg-gray-50 hover:bg-blue-50 overflow-hidden flex items-center justify-center">
              {photo ? (
                <Image src={photo} alt="Produto" fill className="object-cover" unoptimized={photo.startsWith("http")} />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400 select-none">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                  <span className="text-xs text-center px-2">Clique para foto</span>
                </div>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            {photo && (
              <button type="button" onClick={() => { setPhoto(null); if (fileRef.current) fileRef.current.value = ""; }}
                className="text-xs text-red-500 hover:text-red-700 self-start">Remover</button>
            )}
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <label htmlFor="desc" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Descrição</label>
            <textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nome do produto (preenchido automaticamente ao importar do ML)"
              rows={5}
              className="flex-1 resize-none rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none px-4 py-3 text-sm leading-relaxed transition-colors"
            />
            {mlRef && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Importado do Mercado Livre
                {mlRef.permalink && (
                  <a href={mlRef.permalink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-1">ver anúncio →</a>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Linha 3: Código + Preços */}
        <div className="flex flex-col sm:flex-row gap-4 border-t border-gray-100 pt-4">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Código (leitor)
            </label>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Leia o código de barras ou digite..."
              className="rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none px-3 py-2.5 text-sm font-mono transition-colors"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1 w-36">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ref. ML (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                value={mlRef?.price ? String(mlRef.price) : ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value.replace(",", "."));
                  setMlRef((prev) => prev ? { ...prev, price: isNaN(val) ? null : val } : { id: "", title: "", price: isNaN(val) ? null : val, permalink: "", thumbnail: "" });
                  if (!isNaN(val)) setPreco((Math.round(val * 0.8 * 100) / 100).toFixed(2).replace(".", ","));
                }}
                placeholder="0,00"
                className="rounded-lg border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none px-3 py-2.5 text-sm font-mono text-blue-700 font-semibold transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1 w-32">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Custo (R$)</label>
              <input type="text" inputMode="decimal" value={custo} onChange={(e) => setCusto(e.target.value)}
                placeholder="0,00"
                className="rounded-lg border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none px-3 py-2.5 text-sm font-mono transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1 w-36">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                Preço outlet
                {mlRef?.price && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs font-semibold">80%</span>}
              </label>
              <input ref={precoRef} type="text" inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)}
                placeholder="0,00"
                className="rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none px-3 py-2.5 text-sm font-mono font-semibold text-green-700 transition-colors"
              />
              {mlRef?.price && (
                <button type="button"
                  onClick={() => setPreco((Math.round(mlRef.price! * 0.8 * 100) / 100).toFixed(2).replace(".", ","))}
                  className="text-xs text-green-600 hover:underline self-start">recalcular 80%</button>
              )}
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3 justify-between items-center flex-wrap border-t border-gray-100 pt-4">
          <div className="flex items-center gap-3">
            {savedId && (
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Salvo #{ savedId}
              </span>
            )}
            {(codigo || description || searched) && (
              <button type="button" onClick={handleClear}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                Limpar
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading || !description.trim()}
              className="px-5 py-2.5 rounded-xl border border-blue-300 text-blue-600 text-sm font-semibold hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
              {loading
                ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Buscando...</>
                : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>Buscar no ML</>
              }
            </button>

            <button type="button" onClick={handleSave} disabled={saving || !description.trim()}
              className="px-6 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
              {saving
                ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Salvando...</>
                : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>Salvar produto</>
              }
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}
      </form>

      {/* Resultados ML */}
      {hasResults && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-700">
              {result.items.length} produtos encontrados no Mercado Livre
            </h2>
            <a href={result.searchUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline">Ver todos no ML →</a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {result.items.map((item, idx) => (
              <a key={idx} href={item.permalink} target="_blank" rel="noopener noreferrer"
                className="bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all overflow-hidden flex flex-col group">
                {item.thumbnail ? (
                  <div className="relative aspect-square bg-gray-50">
                    <Image src={item.thumbnail} alt={item.title} fill className="object-contain p-2" unoptimized />
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="p-3 flex flex-col gap-1 flex-1">
                  <p className="text-xs text-gray-600 leading-snug line-clamp-3 flex-1">{item.title}</p>
                  <div className="mt-1">
                    {item.price
                      ? <span className="text-blue-700 font-bold text-sm">{BRL.format(item.price)}</span>
                      : <span className="text-xs text-gray-400 italic">Preço não disponível</span>
                    }
                  </div>
                </div>
                <div className="px-3 pb-3 flex gap-2">
                  <button type="button"
                    onClick={(e) => { e.preventDefault(); handleSelectItem(item); }}
                    className="flex-1 text-xs bg-blue-600 text-white rounded-lg py-1.5 hover:bg-blue-700 transition-colors font-medium">
                    Usar este
                  </button>
                  <a href={item.permalink} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center">ML →</a>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {searched && result?.mode === "google" && result.items.length === 0 && !error && (
        <div className="text-center py-10 text-gray-400 text-sm">
          Nenhum resultado. Tente uma descrição mais curta ou diferente.
        </div>
      )}

      {needsSetup && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">Busca por texto não configurada</p>
          <p className="text-xs text-amber-700">
            Use o campo <strong>Importar do ML pelo código</strong> (ex: MLB59905419) para buscar descrição e foto diretamente.
            Para busca por texto, configure <code className="bg-amber-100 px-1 rounded">GOOGLE_API_KEY</code> e <code className="bg-amber-100 px-1 rounded">GOOGLE_CX</code> no .env.local.
          </p>
        </div>
      )}
    </div>
  );
}
