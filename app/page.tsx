import TriageForm from "@/components/TriageForm";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">Logística Outlet</h1>
              <p className="text-xs text-gray-400 leading-tight">Triagem de produtos</p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <a href="/" className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">Triagem</a>
            <a href="/produtos" className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">Produtos salvos</a>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 py-6">
        <TriageForm />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-400">
        Logística Outlet — Triagem e Pesquisa de Preços
      </footer>
    </div>
  );
}
