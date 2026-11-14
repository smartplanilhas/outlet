export type ProdutoStatus = "" | "quebrado" | "incompleto";

export const STATUS_OPTIONS: { value: ProdutoStatus; label: string; color: string; badge: string }[] = [
  { value: "",           label: "Normal",     color: "border-gray-200 text-gray-500 hover:border-gray-400",                     badge: "" },
  { value: "quebrado",   label: "Quebrado",   color: "border-red-400   bg-red-50   text-red-600",                               badge: "bg-red-100 text-red-700" },
  { value: "incompleto", label: "Incompleto", color: "border-orange-400 bg-orange-50 text-orange-600",                          badge: "bg-orange-100 text-orange-700" },
];

export function statusBadge(status: string | null) {
  return STATUS_OPTIONS.find(o => o.value === (status ?? "")) ?? STATUS_OPTIONS[0];
}
