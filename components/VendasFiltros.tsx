"use client";

import { useRouter } from "next/navigation";

const PERIODOS = [
  { value: "",       label: "Tudo"   },
  { value: "hoje",   label: "Hoje"   },
  { value: "ontem",  label: "Ontem"  },
  { value: "semana", label: "Semana" },
  { value: "mes",    label: "Mês"    },
];

const PGTOS = [
  { value: "",         label: "Todos"    },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix",      label: "PIX"      },
  { value: "credito",  label: "Crédito"  },
  { value: "debito",   label: "Débito"   },
];

const CONTAS = [
  { value: "",    label: "Todas" },
  { value: "FLP", label: "FLP"  },
  { value: "ADR", label: "ADR"  },
];

interface Props {
  periodo: string;
  pgto:    string;
  conta:   string;
}

export default function VendasFiltros({ periodo, pgto, conta }: Props) {
  const router = useRouter();

  function update(key: string, value: string) {
    const vals: Record<string, string> = { periodo, pgto, conta, [key]: value };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(vals)) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    router.push(`/vendas${qs ? `?${qs}` : ""}`);
  }

  function chip(active: boolean) {
    return `px-3 py-1.5 text-xs font-semibold rounded-xl border-2 transition-all ${
      active
        ? "border-blue-500 bg-blue-50 text-blue-700"
        : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700"
    }`;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3 flex flex-col gap-3">

      {/* Período */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide w-12 flex-shrink-0">
          Período
        </span>
        {PERIODOS.map(p => (
          <button key={p.value} onClick={() => update("periodo", p.value)} className={chip(periodo === p.value)}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Pagamento */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide w-12 flex-shrink-0">
          Pgto
        </span>
        {PGTOS.map(p => (
          <button key={p.value} onClick={() => update("pgto", p.value)} className={chip(pgto === p.value)}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Conta */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide w-12 flex-shrink-0">
          Conta
        </span>
        {CONTAS.map(c => (
          <button key={c.value} onClick={() => update("conta", c.value)} className={chip(conta === c.value)}>
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
