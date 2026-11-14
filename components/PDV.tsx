"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { ProdutoTriagem } from "@/app/api/triagem/route";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type PayMethod = "dinheiro" | "credito" | "debito" | "pix";

interface CartItem {
  produtoId: number;
  descricao: string;
  categoria: string | null;
  fotoUrl: string | null;
  preco: number;
  qty: number;
}

interface SaleResult {
  id: number;
  subtotal: number;
  desconto: number;
  total: number;
  forma_pagamento: string;
  valor_pago: number;
  troco: number;
  itens: CartItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PAY_LABELS: Record<PayMethod, string> = {
  dinheiro: "Dinheiro",
  credito:  "Crédito",
  debito:   "Débito",
  pix:      "PIX",
};

const PAY_COLORS: Record<PayMethod, string> = {
  dinheiro: "border-green-500  bg-green-50  text-green-700",
  credito:  "border-blue-500   bg-blue-50   text-blue-700",
  debito:   "border-indigo-500 bg-indigo-50 text-indigo-700",
  pix:      "border-teal-500   bg-teal-50   text-teal-700",
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function PDV() {
  // Search
  const [search, setSearch]     = useState("");
  const [results, setResults]   = useState<ProdutoTriagem[]>([]);
  const [searching, setSearching] = useState(false);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Discount
  const [discInput, setDiscInput]   = useState("");
  const [discType, setDiscType]     = useState<"%" | "R$">("%");
  const [valorCombinado, setValorCombinado] = useState("");

  // Payment
  const [payment, setPayment]     = useState<PayMethod | "">("");
  const [valorPago, setValorPago] = useState("");

  // Finalização
  const [finalizing, setFinalizing] = useState(false);
  const [sale, setSale]             = useState<SaleResult | null>(null);
  const [error, setError]           = useState<string | null>(null);

  const searchRef   = useRef<HTMLInputElement>(null);
  const valorPagoRef = useRef<HTMLInputElement>(null);

  // ── Cálculos ──
  const subtotal  = cart.reduce((s, i) => s + i.preco * i.qty, 0);
  const vcNum     = parseFloat(valorCombinado.replace(",", ".") || "0");
  const vcActive  = valorCombinado.trim() !== "" && !isNaN(vcNum) && vcNum > 0 && vcNum < subtotal;
  const discRaw   = parseFloat(discInput.replace(",", ".") || "0");
  const discAmt   = vcActive
    ? subtotal - vcNum
    : isNaN(discRaw) ? 0 : discType === "%" ? subtotal * discRaw / 100 : discRaw;
  const total     = vcActive ? vcNum : Math.max(0, subtotal - discAmt);
  const discPct   = subtotal > 0 && discAmt > 0 ? Math.round((discAmt / subtotal) * 100) : 0;
  const paid      = parseFloat(valorPago.replace(",", ".") || "0");
  const troco     = payment === "dinheiro" && paid > total ? paid - total : 0;
  const canFinalize = cart.length > 0 && payment !== ""
    && (payment !== "dinheiro" || paid >= total);

  // ── Busca com debounce ──
  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/triagem?q=${encodeURIComponent(search.trim())}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } finally {
        setSearching(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [search]);

  // ── Autofocus após venda ──
  useEffect(() => {
    if (!sale) searchRef.current?.focus();
  }, [sale]);

  // ── Focar valor pago ao selecionar dinheiro ──
  useEffect(() => {
    if (payment === "dinheiro") setTimeout(() => valorPagoRef.current?.focus(), 50);
  }, [payment]);

  function addToCart(p: ProdutoTriagem) {
    if (!p.preco) return;
    setCart(prev => {
      const idx = prev.findIndex(i => i.produtoId === p.id);
      if (idx >= 0) return prev.map((i, n) => n === idx ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, {
        produtoId: p.id,
        descricao: p.descricao,
        categoria: p.categoria,
        fotoUrl:   p.foto_url,
        preco:     Number(p.preco),
        qty:       1,
      }];
    });
    setSearch("");
    setResults([]);
    searchRef.current?.focus();
  }

  function updateQty(id: number, delta: number) {
    setCart(prev => prev.map(i => i.produtoId === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  }

  function setQty(id: number, v: string) {
    const n = parseInt(v);
    if (!isNaN(n) && n >= 1) setCart(prev => prev.map(i => i.produtoId === id ? { ...i, qty: n } : i));
  }

  function removeFromCart(id: number) {
    setCart(prev => prev.filter(i => i.produtoId !== id));
  }

  function handleSearchKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (results.length > 0) addToCart(results[0]);
    }
    if (e.key === "Escape") { setSearch(""); setResults([]); }
  }

  async function handleFinalize() {
    if (!canFinalize) return;
    setFinalizing(true);
    setError(null);
    try {
      const res = await fetch("/api/venda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtotal,
          desconto:        discAmt,
          total,
          forma_pagamento: payment,
          valor_pago:      payment === "dinheiro" ? paid : total,
          troco:           payment === "dinheiro" ? troco : 0,
          itens: cart.map(i => ({
            produto_id:     i.produtoId,
            descricao:      i.descricao,
            categoria:      i.categoria,
            preco_unitario: i.preco,
            quantidade:     i.qty,
            subtotal:       i.preco * i.qty,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSale({ id: data.id, subtotal, desconto: discAmt, total, forma_pagamento: payment,
                valor_pago: payment === "dinheiro" ? paid : total,
                troco: payment === "dinheiro" ? troco : 0,
                itens: [...cart] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao finalizar.");
    } finally {
      setFinalizing(false);
    }
  }

  function handleNewSale() {
    setCart([]); setDiscInput(""); setDiscType("%"); setValorCombinado("");
    setPayment(""); setValorPago(""); setSale(null); setError(null);
  }

  // ── Render: receipt após venda ─────────────────────────────────────────────
  if (sale) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="bg-white rounded-2xl shadow-xl border border-green-200 w-full max-w-md p-6 flex flex-col gap-5">
          <div className="text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Venda Finalizada!</h2>
            <p className="text-sm text-gray-400 font-mono">#{sale.id}</p>
          </div>

          {/* Itens */}
          <div className="border-t border-b border-gray-100 py-3 flex flex-col gap-1.5">
            {sale.itens.map((i, n) => (
              <div key={n} className="flex justify-between text-sm">
                <span className="text-gray-700 flex-1 mr-2 truncate">
                  {i.qty > 1 && <span className="font-mono text-gray-400 mr-1">{i.qty}×</span>}
                  {i.descricao}
                </span>
                <span className="font-semibold text-gray-800 flex-shrink-0">{BRL.format(i.preco * i.qty)}</span>
              </div>
            ))}
          </div>

          {/* Totais */}
          <div className="flex flex-col gap-1.5 text-sm">
            {sale.desconto > 0 && (
              <>
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span><span>{BRL.format(sale.subtotal)}</span>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>Desconto</span><span>− {BRL.format(sale.desconto)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-bold text-lg text-gray-800 pt-1 border-t border-gray-100 mt-1">
              <span>Total</span><span className="text-green-700">{BRL.format(sale.total)}</span>
            </div>
            <div className="flex justify-between text-gray-500 text-xs">
              <span>Pagamento</span>
              <span className="font-medium">{PAY_LABELS[sale.forma_pagamento as PayMethod] ?? sale.forma_pagamento}</span>
            </div>
            {sale.troco > 0 && (
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Troco</span><span>{BRL.format(sale.troco)}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleNewSale}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-base"
          >
            Nova Venda
          </button>
        </div>
      </div>
    );
  }

  // ── Render: PDV ────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0">

      {/* ── Painel esquerdo: busca ── */}
      <div className="lg:w-2/5 flex flex-col gap-3 p-4 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="relative">
          <input
            ref={searchRef}
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleSearchKey}
            placeholder="Buscar produto ou ler código de barras..."
            className="w-full rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none pl-10 pr-4 py-3 text-sm transition-colors"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searching && (
            <svg className="w-4 h-4 animate-spin text-blue-400 absolute right-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          )}
        </div>

        {!search && (
          <p className="text-xs text-gray-400 text-center py-8">
            Digite o nome, código ou leia o código de barras
          </p>
        )}

        {search && results.length === 0 && !searching && (
          <p className="text-sm text-gray-400 text-center py-6">Nenhum produto encontrado.</p>
        )}

        <div className="flex flex-col gap-2">
          {results.map(p => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
            >
              {p.foto_url ? (
                <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  <Image src={p.foto_url} alt={p.descricao} fill className="object-contain p-0.5" unoptimized />
                </div>
              ) : (
                <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2 group-hover:text-blue-700">{p.descricao}</p>
                {p.categoria && (
                  <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded mt-0.5 inline-block">{p.categoria}</span>
                )}
                {(p.quantidade ?? 1) > 1 && (
                  <span className="text-xs text-gray-400 ml-1">{p.quantidade} em estoque</span>
                )}
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="font-bold text-green-700 text-base">{BRL.format(Number(p.preco))}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Painel direito: carrinho + pagamento ── */}
      <div className="lg:w-3/5 flex flex-col bg-gray-50 overflow-y-auto">

        {/* Carrinho */}
        <div className="flex-1 p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
              Carrinho
              {cart.length > 0 && (
                <span className="ml-2 bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {cart.reduce((s, i) => s + i.qty, 0)}
                </span>
              )}
            </h2>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-red-400 hover:text-red-600 transition-colors">
                Limpar tudo
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center py-10 text-gray-300">
              <div>
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                <p className="text-sm">Busque produtos ao lado</p>
              </div>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.produtoId} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 leading-snug truncate">{item.descricao}</p>
                  {item.categoria && (
                    <span className="text-xs text-purple-500">{item.categoria}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => updateQty(item.produtoId, -1)}
                    className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-base font-bold">
                    −
                  </button>
                  <input
                    value={item.qty}
                    onChange={e => setQty(item.produtoId, e.target.value)}
                    className="w-10 text-center text-sm font-bold border border-gray-200 rounded-lg py-1 outline-none focus:border-blue-400"
                    inputMode="numeric"
                  />
                  <button onClick={() => updateQty(item.produtoId, 1)}
                    className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-base font-bold">
                    +
                  </button>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right w-24">
                    <p className="font-bold text-gray-800">{BRL.format(item.preco * item.qty)}</p>
                    {item.qty > 1 && (
                      <p className="text-xs text-gray-400">{BRL.format(item.preco)} × {item.qty}</p>
                    )}
                  </div>
                  <button onClick={() => removeFromCart(item.produtoId)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Área de pagamento */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 bg-white p-4 flex flex-col gap-4">

            {/* Desconto rápido */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Desconto</label>
              <div className="flex gap-1.5 flex-wrap">
                {(["5", "10", "20", "50"] as const).map(v => (
                  <button key={v}
                    onClick={() => { setDiscInput(v); setDiscType("%"); setValorCombinado(""); }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      !vcActive && discInput === v && discType === "%" ? "bg-orange-500 border-orange-500 text-white" : "border-gray-300 text-gray-500 hover:border-orange-400 hover:text-orange-600"
                    }`}>
                    {v}%
                  </button>
                ))}
                <div className="flex flex-1 rounded-xl border border-gray-300 overflow-hidden min-w-[80px]">
                  <input
                    value={vcActive ? "" : discInput}
                    onChange={e => { setDiscInput(e.target.value); setValorCombinado(""); }}
                    inputMode="decimal"
                    placeholder="0"
                    className="flex-1 px-3 py-1.5 text-sm outline-none min-w-0"
                  />
                  <button onClick={() => { setDiscType(t => t === "%" ? "R$" : "%"); setValorCombinado(""); }}
                    className="px-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 border-l border-gray-300 transition-colors min-w-[36px]">
                    {discType}
                  </button>
                </div>
              </div>

              {/* Valor combinado */}
              <div className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 transition-colors ${
                vcActive ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50"
              }`}>
                <div className="flex flex-col flex-1 min-w-0">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 leading-none mb-1">
                    Ou — valor combinado com o cliente
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm font-mono">R$</span>
                    <input
                      value={valorCombinado}
                      onChange={e => { setValorCombinado(e.target.value); setDiscInput(""); }}
                      inputMode="decimal"
                      placeholder={subtotal > 0 ? subtotal.toFixed(2).replace(".", ",") : "0,00"}
                      className="flex-1 min-w-0 bg-transparent outline-none text-sm font-mono font-semibold text-blue-700 placeholder:text-gray-300"
                    />
                    {valorCombinado && (
                      <button onClick={() => setValorCombinado("")} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                {vcActive && (
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-bold text-orange-600">-{discPct}%</p>
                    <p className="text-xs text-orange-500">-{BRL.format(discAmt)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Totais */}
            <div className="flex flex-col gap-1 text-sm">
              {discAmt > 0 && (
                <>
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span><span>{BRL.format(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-orange-600 font-medium">
                    <span>
                      {vcActive
                        ? `Negociado (−${discPct}%)`
                        : `Desconto (${discType === "%" ? `${discInput}%` : BRL.format(discAmt)})`
                      }
                    </span>
                    <span>− {BRL.format(discAmt)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-bold text-xl text-gray-800 pt-1">
                <span>Total</span>
                <span className="text-green-700">{BRL.format(total)}</span>
              </div>
            </div>

            {/* Forma de pagamento */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Forma de Pagamento</label>
              <div className="grid grid-cols-4 gap-2">
                {(["dinheiro", "credito", "debito", "pix"] as PayMethod[]).map(m => (
                  <button key={m}
                    onClick={() => setPayment(m)}
                    className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                      payment === m ? PAY_COLORS[m] + " scale-[1.03] shadow-sm" : "border-gray-200 text-gray-500 hover:border-gray-400"
                    }`}>
                    {m === "dinheiro" && "💵 "}
                    {m === "credito"  && "💳 "}
                    {m === "debito"   && "🏧 "}
                    {m === "pix"      && "📱 "}
                    {PAY_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>

            {/* Valor pago (dinheiro) */}
            {payment === "dinheiro" && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor recebido</label>
                    <input
                      ref={valorPagoRef}
                      value={valorPago}
                      onChange={e => setValorPago(e.target.value)}
                      inputMode="decimal"
                      placeholder={BRL.format(total)}
                      className="mt-1 w-full rounded-xl border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none px-4 py-2.5 text-base font-mono font-bold text-green-700 transition-colors"
                    />
                  </div>
                  {troco > 0 && (
                    <div className="text-right flex-shrink-0 bg-green-50 rounded-xl px-4 py-2.5 border border-green-200">
                      <p className="text-xs text-green-500 font-semibold uppercase tracking-wide">Troco</p>
                      <p className="text-xl font-bold text-green-700">{BRL.format(troco)}</p>
                    </div>
                  )}
                </div>
                {/* Teclas de atalho */}
                <div className="flex gap-1.5">
                  {[total, Math.ceil(total / 10) * 10, Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100]
                    .filter((v, i, a) => a.indexOf(v) === i && v >= total)
                    .slice(0, 4)
                    .map(v => (
                      <button key={v}
                        onClick={() => setValorPago(v.toFixed(2).replace(".", ","))}
                        className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
                        {BRL.format(v)}
                      </button>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Erros */}
            {error && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
            )}

            {/* Botão finalizar */}
            <button
              onClick={handleFinalize}
              disabled={!canFinalize || finalizing}
              className="w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md"
            >
              {finalizing ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              )}
              {finalizing ? "Finalizando..." : `Finalizar  ·  ${BRL.format(total)}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
