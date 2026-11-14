"use client";

export default function ContinuarButton({ id }: { id: number }) {
  return (
    <button
      onClick={() => {
        localStorage.setItem("triagem_ativa_id", String(id));
        window.location.href = "/";
      }}
      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
    >
      Continuar
    </button>
  );
}
