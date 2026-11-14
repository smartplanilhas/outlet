"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{ padding: "10px 24px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
    >
      Imprimir
    </button>
  );
}
