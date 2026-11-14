"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function ConsultaInput({ defaultValue }: { defaultValue?: string }) {
  const [val, setVal]   = useState(defaultValue ?? "");
  const router          = useRouter();
  const inputRef        = useRef<HTMLInputElement>(null);

  function buscar(termo: string) {
    const t = termo.trim();
    if (!t) return;
    router.push(`/consulta?q=${encodeURIComponent(t)}`);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      buscar(e.currentTarget.value);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-600">
        Consultar por ID ou Código de barras
      </label>
      <div className="flex gap-3">
        <input
          ref={inputRef}
          autoFocus
          autoComplete="off"
          inputMode="text"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Digite o ID (#42) ou o código de barras do produto..."
          className="flex-1 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none px-4 py-3 text-base font-mono transition-colors"
        />
        <button
          type="button"
          onClick={() => buscar(val)}
          className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          Buscar
        </button>
      </div>
      <p className="text-xs text-gray-400">
        Ex: <code className="bg-gray-100 px-1 rounded">42</code> para ID, ou <code className="bg-gray-100 px-1 rounded">7891234567890</code> para código de barras.
      </p>
    </div>
  );
}
