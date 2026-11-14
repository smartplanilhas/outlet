"use client";

import { useRouter } from "next/navigation";

type Saldo = "" | "com" | "sem";

interface Props {
  current:         Saldo;
  triagemParam?:   string;
  categoriaParam?: string;
  qParam?:         string;
  statusParam?:    string;
}

const OPTIONS: { value: Saldo; label: string }[] = [
  { value: "",    label: "Todos"     },
  { value: "com", label: "Com saldo" },
  { value: "sem", label: "Sem saldo" },
];

export default function SaldoFilter({ current, triagemParam, categoriaParam, qParam, statusParam }: Props) {
  const router = useRouter();

  function go(saldo: Saldo) {
    const params = new URLSearchParams();
    if (triagemParam)   params.set("triagem",   triagemParam);
    if (categoriaParam) params.set("categoria", categoriaParam);
    if (qParam)         params.set("q",         qParam);
    if (statusParam)    params.set("status",    statusParam);
    if (saldo)          params.set("saldo",     saldo);
    const qs = params.toString();
    router.push(`/produtos${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {OPTIONS.map(o => (
        <button
          key={o.value}
          onClick={() => go(o.value)}
          className={`px-3 py-1 text-xs font-semibold rounded-xl border-2 transition-all ${
            current === o.value
              ? o.value === "com"
                ? "border-green-500 bg-green-50 text-green-700"
                : o.value === "sem"
                ? "border-red-400 bg-red-50 text-red-600"
                : "border-blue-500 bg-blue-50 text-blue-700"
              : "border-gray-200 text-gray-500 hover:border-gray-400"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
