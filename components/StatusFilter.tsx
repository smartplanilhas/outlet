"use client";

import { useRouter } from "next/navigation";
import { STATUS_OPTIONS, type ProdutoStatus } from "@/lib/status";

interface Props {
  current:         ProdutoStatus | "";
  triagemParam?:   string;
  categoriaParam?: string;
  qParam?:         string;
  saldoParam?:     string;
}

export default function StatusFilter({ current, triagemParam, categoriaParam, qParam, saldoParam }: Props) {
  const router = useRouter();

  function go(status: ProdutoStatus) {
    const params = new URLSearchParams();
    if (triagemParam)   params.set("triagem",   triagemParam);
    if (categoriaParam) params.set("categoria", categoriaParam);
    if (qParam)         params.set("q",         qParam);
    if (saldoParam)     params.set("saldo",     saldoParam);
    if (status)         params.set("status",    status);
    const qs = params.toString();
    router.push(`/produtos${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {STATUS_OPTIONS.map(o => (
        <button
          key={o.value}
          onClick={() => go(o.value)}
          className={`px-3 py-1 text-xs font-semibold rounded-xl border-2 transition-all ${
            current === o.value
              ? o.value === ""
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : o.color
              : "border-gray-200 text-gray-500 hover:border-gray-400"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
