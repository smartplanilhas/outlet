"use client";

import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";

interface ConfigLoja {
  id?: number;
  whatsapp: string;
  endereco: string;
  horario: string;
  link_bio: string;
  instagram_usuario: string;
  voz_id: string;
}

const EMPTY: ConfigLoja = {
  whatsapp:          "",
  endereco:          "",
  horario:           "",
  link_bio:          "",
  instagram_usuario: "",
  voz_id:            "1oZawzZ4adgYtgm1oMqN",
};

export default function ConfiguracoesPage() {
  const [fields, setFields]   = useState<ConfigLoja>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    fetch("/api/config-loja")
      .then(r => r.json())
      .then(d => { if (d) setFields({ ...EMPTY, ...d }); })
      .finally(() => setLoading(false));
  }, []);

  function set(key: keyof ConfigLoja, value: string) {
    setFields(f => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/config-loja", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none px-3 py-2.5 text-sm transition-colors bg-white";

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">Configurações</h1>
              <p className="text-xs text-gray-400 leading-tight">Dados da loja</p>
            </div>
          </div>
          <NavBar active="/configuracoes" />
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="max-w-2xl mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <svg className="w-8 h-8 text-gray-300 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <form onSubmit={salvar} className="flex flex-col gap-6">

              {/* Contato */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
                <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Contato e endereço</h2>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    WhatsApp (com código do país, ex.: 5515999999999)
                  </label>
                  <input
                    value={fields.whatsapp}
                    onChange={e => set("whatsapp", e.target.value)}
                    placeholder="5515999999999"
                    className={inp}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Endereço da loja
                  </label>
                  <input
                    value={fields.endereco}
                    onChange={e => set("endereco", e.target.value)}
                    placeholder="ex.: Rua das Flores, 123 — Sorocaba/SP"
                    className={inp}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Horário de funcionamento
                  </label>
                  <input
                    value={fields.horario}
                    onChange={e => set("horario", e.target.value)}
                    placeholder="ex.: Seg–Sex 9h–18h · Sáb 9h–13h"
                    className={inp}
                  />
                </div>
              </div>

              {/* Instagram */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
                <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Instagram</h2>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Usuário do Instagram (sem @)
                  </label>
                  <input
                    value={fields.instagram_usuario}
                    onChange={e => set("instagram_usuario", e.target.value)}
                    placeholder="ex.: lojaoutletsorocaba"
                    className={inp}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Link da bio (catálogo ou WhatsApp)
                  </label>
                  <input
                    value={fields.link_bio}
                    onChange={e => set("link_bio", e.target.value)}
                    placeholder="ex.: wa.me/5515999999999"
                    className={inp}
                  />
                </div>
              </div>

              {/* Voz ElevenLabs */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
                <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide flex items-center gap-2">
                  Narração (ElevenLabs)
                </h2>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    ID da voz
                  </label>
                  <input
                    value={fields.voz_id}
                    onChange={e => set("voz_id", e.target.value)}
                    placeholder="1oZawzZ4adgYtgm1oMqN"
                    className={inp + " font-mono"}
                  />
                  <p className="text-xs text-gray-400">
                    Padrão: <span className="font-mono">1oZawzZ4adgYtgm1oMqN</span> (voz "Will – Varejo").
                    Encontre outros IDs em elevenlabs.io/voice-library.
                  </p>
                </div>
              </div>

              {/* Salvar */}
              <div className="flex items-center justify-end gap-3">
                {saved && (
                  <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Salvo!
                  </span>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Salvando...
                    </>
                  ) : "Salvar configurações"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-400">
        Logística Outlet — Configurações
      </footer>
    </div>
  );
}
