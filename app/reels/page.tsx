"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import NavBar from "@/components/NavBar";
import { ABERTURAS, type AberturaKey } from "@/lib/aberturas";

interface Roteiro {
  abertura_fala:   string;
  corpo_fala:      string;
  fechamento_fala: string;
  textos_tela: { abertura: string; vantagens: string[]; chamada: string[] };
  legenda:   string;
  hashtags:  string[];
}

interface Trabalho {
  id:               number;
  produto_id:       number;
  status:           "pendente" | "gerando" | "aguardando_video" | "pronto" | "aprovado" | "publicado" | "erro";
  abertura:         AberturaKey | null;
  estilo_foto:      string | null;
  roteiro_narracao: string | null;
  legenda:          string | null;
  hashtags:         string[] | null;
  audio_url:        string | null;
  video_url:        string | null;
  capa_url:         string | null;
  instagram_link:   string | null;
  erro:             string | null;
  cta:              string[] | null;
  custo_estimado:   { claude: number; elevenlabs: number; total: number } | null;
  tipo:             "video" | "imagem";
  criado_em:        string;
  atualizado_em:    string;
  descricao:        string;
  foto_url:         string | null;
}

const CTA_OPTIONS = [
  { value: "comenta_eu_quero", label: "Comenta EU QUERO" },
  { value: "whatsapp",         label: "Chama no WhatsApp" },
  { value: "catalogo_bio",     label: "Link da bio" },
  { value: "venha_loja",       label: "Venha à loja" },
] as const;

const STATUS_LABEL: Record<Trabalho["status"], string> = {
  pendente:         "Pendente",
  gerando:          "Gerando mídia…",
  aguardando_video: "Renderizando vídeo…",
  pronto:           "Pronto para revisar",
  aprovado:         "Aprovado",
  publicado:        "Publicado",
  erro:             "Erro",
};

const STATUS_COLOR: Record<Trabalho["status"], string> = {
  pendente:         "bg-gray-100 text-gray-600",
  gerando:          "bg-blue-100 text-blue-700",
  aguardando_video: "bg-orange-100 text-orange-700",
  pronto:           "bg-yellow-100 text-yellow-700",
  aprovado:         "bg-green-100 text-green-700",
  publicado:        "bg-purple-100 text-purple-700",
  erro:             "bg-red-100 text-red-600",
};

const DATE = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit",
});

export default function ReelsPage() {
  const [trabalhos, setTrabalhos]   = useState<Trabalho[]>([]);
  const [loading, setLoading]       = useState(true);
  const [legendas, setLegendas]     = useState<Record<number, string>>({});
  const [ctas, setCtas]             = useState<Record<number, string[]>>({});
  const [salvando, setSalvando]     = useState<Record<number, boolean>>({});
  const [gerando, setGerando]       = useState<Record<number, boolean>>({});

  async function carregar() {
    setLoading(true);
    try {
      const res  = await fetch("/api/reels");
      const data: Trabalho[] = await res.json();
      setTrabalhos(data);
      const initLeg: Record<number, string>   = {};
      const initCta: Record<number, string[]> = {};
      for (const t of data) {
        initLeg[t.id] = t.legenda ?? "";
        initCta[t.id] = t.cta ?? ["whatsapp"];
      }
      setLegendas(initLeg);
      setCtas(initCta);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  // Auto-refresh quando há jobs aguardando vídeo
  useEffect(() => {
    const temRenderizando = trabalhos.some(t => t.status === "aguardando_video" || t.status === "gerando");
    if (!temRenderizando) return;
    const timer = setInterval(carregar, 15_000);
    return () => clearInterval(timer);
  }, [trabalhos]);

  async function gerar(id: number, modo: "completo" | "nova_abertura" = "completo") {
    setGerando(g => ({ ...g, [id]: true }));
    // Atualiza status local imediatamente
    setTrabalhos(ts => ts.map(t => t.id === id ? { ...t, status: "gerando" } : t));
    try {
      const res  = await fetch("/api/reels/gerar", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id, modo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro desconhecido.");
      // Recarrega todos os trabalhos para pegar estado atualizado
      await carregar();
    } catch (e) {
      alert(`Erro ao gerar: ${e instanceof Error ? e.message : e}`);
      await carregar();
    } finally {
      setGerando(g => ({ ...g, [id]: false }));
    }
  }

  async function toggleCta(id: number, value: string) {
    const atual = ctas[id] ?? ["whatsapp"];
    const next  = atual.includes(value) ? atual.filter(v => v !== value) : [...atual, value];
    setCtas(c => ({ ...c, [id]: next }));
    await fetch(`/api/reels?id=${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ cta: next }),
    });
  }

  async function aprovar(id: number) {
    await fetch(`/api/reels?id=${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: "aprovado" }),
    });
    setTrabalhos(ts => ts.map(t => t.id === id ? { ...t, status: "aprovado" } : t));
  }

  async function salvarLegenda(id: number) {
    setSalvando(s => ({ ...s, [id]: true }));
    try {
      await fetch(`/api/reels?id=${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ legenda: legendas[id] }),
      });
      setTrabalhos(ts => ts.map(t => t.id === id ? { ...t, legenda: legendas[id] } : t));
    } finally {
      setSalvando(s => ({ ...s, [id]: false }));
    }
  }

  async function excluir(id: number) {
    if (!confirm("Excluir este trabalho?")) return;
    await fetch(`/api/reels?id=${id}`, { method: "DELETE" });
    setTrabalhos(ts => ts.filter(t => t.id !== id));
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.869V15.13a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">Reels</h1>
              <p className="text-xs text-gray-400 leading-tight">Achado do Dia — Instagram</p>
            </div>
          </div>
          <NavBar active="/reels" />
        </div>
      </header>

      <main className="flex-1 py-6">
        <div className="max-w-4xl mx-auto px-4 flex flex-col gap-4">

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <svg className="w-8 h-8 text-pink-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : trabalhos.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">🎬</p>
              <p className="text-sm font-medium">Nenhum Reels criado ainda.</p>
              <p className="text-xs mt-1">
                Acesse um produto em{" "}
                <a href="/produtos" className="text-pink-500 hover:underline">Produtos</a>{" "}
                e clique em "Gerar Reels".
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {trabalhos.map(t => {
                const roteiro: Roteiro | null = (() => {
                  try { return t.roteiro_narracao ? JSON.parse(t.roteiro_narracao) : null; } catch { return null; }
                })();
                const isGerando  = gerando[t.id] || t.status === "gerando";
                const legendaAlterada = legendas[t.id] !== (t.legenda ?? "");

                return (
                  <div key={t.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

                    {/* ── Cabeçalho do card ─────────────────────────────── */}
                    <div className="flex items-start gap-4 p-5">
                      <div className="flex-shrink-0">
                        {t.foto_url ? (
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
                            <Image src={t.foto_url} alt={t.descricao} fill className="object-contain" unoptimized />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-300">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <p className="font-semibold text-gray-800 text-sm line-clamp-2">{t.descricao}</p>
                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                              <span>#{t.id} · Produto #{t.produto_id} · {DATE.format(new Date(t.criado_em))}</span>
                              <span className={t.tipo === "imagem" ? "text-blue-400" : "text-pink-400"}>
                                · {t.tipo === "imagem" ? "🖼️ Imagem" : "🎬 Vídeo"}
                                {t.abertura && t.tipo !== "imagem" && ` · ${ABERTURAS[t.abertura]?.label}`}
                              </span>
                              {t.custo_estimado && (
                                <span
                                  className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono cursor-help"
                                  title={`Claude: $${t.custo_estimado.claude} · ElevenLabs: $${t.custo_estimado.elevenlabs}`}
                                >
                                  ~${t.custo_estimado.total.toFixed(4)}
                                </span>
                              )}
                            </p>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 flex items-center gap-1 ${STATUS_COLOR[t.status]}`}>
                            {isGerando && (
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            )}
                            {STATUS_LABEL[t.status]}
                          </span>
                        </div>

                        {/* Erro */}
                        {t.status === "erro" && t.erro && (
                          <p className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 font-mono">{t.erro}</p>
                        )}

                        {/* ── Tipo: Vídeo ou Imagem ────────────────────── */}
                        {(t.status === "pendente" || t.status === "erro") && !isGerando && (
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Formato:</span>
                            {(["video", "imagem"] as const).map(op => (
                              <button
                                key={op}
                                type="button"
                                onClick={async () => {
                                  setTrabalhos(ts => ts.map(x => x.id === t.id ? { ...x, tipo: op } : x));
                                  await fetch(`/api/reels?id=${t.id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ tipo: op }),
                                  });
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-xs font-semibold transition-colors ${
                                  t.tipo === op
                                    ? "border-pink-400 bg-pink-50 text-pink-700"
                                    : "border-gray-200 bg-white text-gray-500 hover:border-pink-300"
                                }`}
                              >
                                {op === "video" ? "🎬 Vídeo" : "🖼️ Imagem"}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* ── Seletor de CTA (pendente ou erro) ────────── */}
                        {(t.status === "pendente" || t.status === "erro") && !isGerando && (
                          <div className="mt-3 flex flex-col gap-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Chamada para ação no vídeo</p>
                            <div className="flex flex-wrap gap-2">
                              {CTA_OPTIONS.map(opt => {
                                const sel = (ctas[t.id] ?? ["whatsapp"]).includes(opt.value);
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => toggleCta(t.id, opt.value)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-xs font-semibold transition-colors ${
                                      sel
                                        ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                                        : "border-gray-200 bg-white text-gray-500 hover:border-indigo-300"
                                    }`}
                                  >
                                    <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                      sel ? "border-indigo-500 bg-indigo-500" : "border-gray-300"
                                    }`}>
                                      {sel && (
                                        <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </div>
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                            {(ctas[t.id] ?? []).length > 2 && (
                              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                                Apenas as 2 primeiras vão para o vídeo; as demais ficam só na legenda.
                              </p>
                            )}
                          </div>
                        )}

                        {/* ── Botão re-renderizar (aguardando_video sem Actions) ── */}
                        {t.status === "aguardando_video" && !isGerando && (
                          <button
                            onClick={async () => {
                              const res = await fetch("/api/reels/renderizar", {
                                method:  "POST",
                                headers: { "Content-Type": "application/json" },
                                body:    JSON.stringify({ id: t.id }),
                              });
                              const data = await res.json();
                              if (!res.ok) alert(`Erro: ${data.error}`);
                              else await carregar();
                            }}
                            className="mt-3 flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Tentar renderizar
                          </button>
                        )}

                        {/* ── Botão gerar (pendente ou erro) ───────────── */}
                        {(t.status === "pendente" || t.status === "erro") && (
                          <button
                            onClick={() => gerar(t.id)}
                            disabled={isGerando}
                            className="mt-3 flex items-center gap-2 px-4 py-2 bg-pink-500 text-white text-sm font-semibold rounded-xl hover:bg-pink-600 disabled:opacity-50 transition-colors"
                          >
                            {isGerando ? (
                              <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Gerando mídia…
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Gerar mídia
                              </>
                            )}
                          </button>
                        )}

                        {/* ── Roteiro gerado ────────────────────────────── */}
                        {roteiro && !isGerando && (
                          <div className="mt-4 flex flex-col gap-3">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Roteiro de narração</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {[
                                { label: "Abertura",   fala: roteiro.abertura_fala,   cor: "border-pink-200 bg-pink-50" },
                                { label: "Corpo",      fala: roteiro.corpo_fala,      cor: "border-blue-200 bg-blue-50" },
                                { label: "Fechamento", fala: roteiro.fechamento_fala, cor: "border-green-200 bg-green-50" },
                              ].map(({ label, fala, cor }) => (
                                <div key={label} className={`rounded-xl border p-3 ${cor}`}>
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                                  <p className="text-sm text-gray-800 italic">"{fala}"</p>
                                </div>
                              ))}
                            </div>

                            {/* Áudio */}
                            {t.audio_url && (
                              <div className="flex flex-col gap-1">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Narração</p>
                                <audio controls src={t.audio_url} className="w-full h-10" />
                              </div>
                            )}

                            {/* Prévia */}
                            {t.video_url && t.tipo === "imagem" && (
                              <img src={t.video_url} alt="Prévia"
                                className="w-full max-w-xs rounded-xl shadow" />
                            )}
                            {t.video_url && t.tipo !== "imagem" && (
                              <video src={t.video_url} controls
                                className="w-full max-w-xs rounded-xl"
                                poster={t.capa_url ?? undefined} />
                            )}
                          </div>
                        )}

                        {/* ── Legenda editável ──────────────────────────── */}
                        {(t.legenda !== null || t.status === "pronto" || t.status === "aprovado") && !isGerando && (
                          <div className="mt-3 flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Legenda do post</label>
                            <textarea
                              rows={3}
                              value={legendas[t.id] ?? ""}
                              onChange={e => setLegendas(l => ({ ...l, [t.id]: e.target.value }))}
                              className="w-full rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none px-3 py-2 text-sm transition-colors resize-none"
                            />
                            {t.hashtags && t.hashtags.length > 0 && (
                              <p className="text-xs text-gray-400 leading-relaxed">{t.hashtags.join(" ")}</p>
                            )}
                            {legendaAlterada && (
                              <button
                                onClick={() => salvarLegenda(t.id)}
                                disabled={salvando[t.id]}
                                className="self-end text-xs px-3 py-1.5 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 transition-colors"
                              >
                                {salvando[t.id] ? "Salvando…" : "Salvar legenda"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Rodapé com ações ──────────────────────────────── */}
                    <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-t border-gray-100 flex-wrap">

                      {/* Gerar outra abertura */}
                      {(t.status === "pronto" || t.status === "aprovado") && (
                        <button
                          onClick={() => gerar(t.id, "nova_abertura")}
                          disabled={isGerando}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-pink-300 bg-white text-pink-600 hover:bg-pink-50 disabled:opacity-50 transition-colors"
                        >
                          {isGerando ? "Gerando…" : "Gerar outra abertura"}
                        </button>
                      )}

                      {/* Aprovar */}
                      <button
                        onClick={() => aprovar(t.id)}
                        disabled={t.status !== "pronto"}
                        title={t.status !== "pronto" ? "Disponível quando o roteiro estiver pronto" : ""}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                          t.status === "pronto"
                            ? "border-green-400 bg-green-50 text-green-700 hover:bg-green-100"
                            : "border-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Aprovar
                      </button>

                      {/* Publicar */}
                      <button
                        disabled={t.status !== "aprovado"}
                        title={t.status !== "aprovado" ? "Aprove antes de publicar" : "Fase 3 — em breve"}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-400 cursor-not-allowed transition-colors"
                      >
                        Publicar no Instagram
                      </button>

                      {t.instagram_link && (
                        <a
                          href={t.instagram_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                        >
                          Ver no Instagram
                        </a>
                      )}

                      <button
                        onClick={() => excluir(t.id)}
                        className="ml-auto px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-400">
        Logística Outlet — Reels Automáticos
      </footer>
    </div>
  );
}
