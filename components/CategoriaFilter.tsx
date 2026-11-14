"use client";

import { useRouter } from "next/navigation";
import { CATEGORIAS } from "@/lib/categorias";

interface Props {
  current: string;
  triagemParam?: string;
}

export default function CategoriaFilter({ current, triagemParam }: Props) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const cat = e.target.value;
    const params = new URLSearchParams();
    if (triagemParam) params.set("triagem", triagemParam);
    if (cat) params.set("categoria", cat);
    const qs = params.toString();
    router.push(qs ? `/produtos?${qs}` : "/produtos");
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className="text-sm border border-gray-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400 transition-colors text-gray-700 min-w-[220px]"
    >
      <option value="">Todas as categorias</option>
      {CATEGORIAS.map(c => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  );
}
