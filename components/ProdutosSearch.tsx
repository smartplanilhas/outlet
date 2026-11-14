"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  defaultValue: string;
  triagemParam?: string;
  categoriaParam?: string;
}

export default function ProdutosSearch({ defaultValue, triagemParam, categoriaParam }: Props) {
  const [val, setVal] = useState(defaultValue);
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (triagemParam) params.set("triagem", triagemParam);
      if (categoriaParam) params.set("categoria", categoriaParam);
      if (val.trim()) params.set("q", val.trim());
      const qs = params.toString();
      router.push(`/produtos${qs ? `?${qs}` : ""}`);
    }, 400);
    return () => clearTimeout(t);
  }, [val, triagemParam, categoriaParam, router]);

  return (
    <div className="relative w-full sm:w-72">
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder="Buscar descrição, código, endereço..."
        className="w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none pl-9 pr-8 py-2 text-sm transition-colors"
      />
      <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      {val && (
        <button
          onClick={() => setVal("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Limpar busca"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
