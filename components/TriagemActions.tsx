"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  id: number;
  nome: string | null;
}

export default function TriagemActions({ id, nome }: Props) {
  const [mode, setMode]         = useState<"idle" | "editing" | "deleting">("idle");
  const [draft, setDraft]       = useState(nome ?? "");
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  async function handleSave() {
    setLoading(true);
    try {
      await fetch(`/api/triagens?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: draft.trim() || null }),
      });
      setMode("idle");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await fetch(`/api/triagens?id=${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  // ── Modo: confirmação de exclusão ──
  if (mode === "deleting") {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-gray-500">
          Os produtos ficam sem triagem (não são apagados).
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            {loading
              ? <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              : null
            }
            Confirmar exclusão
          </button>
          <button
            onClick={() => setMode("idle")}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // ── Modo: editar nome ──
  if (mode === "editing") {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") { setDraft(nome ?? ""); setMode("idle"); }
          }}
          placeholder={`Triagem #${id}`}
          className="text-sm border border-blue-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 w-56"
        />
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "..." : "Salvar"}
        </button>
        <button
          onClick={() => { setDraft(nome ?? ""); setMode("idle"); }}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  // ── Modo: idle ──
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => { setDraft(nome ?? ""); setMode("editing"); }}
        className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Editar nome
      </button>
      <button
        onClick={() => setMode("deleting")}
        className="px-3 py-1.5 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Apagar
      </button>
    </div>
  );
}
