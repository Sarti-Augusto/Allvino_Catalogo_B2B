import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-allvino-background text-allvino-text font-sans relative overflow-hidden">
      {/* Soft decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-allvino-primary-container rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-allvino-secondary-container rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-75"></div>

      <div className="max-w-2xl text-center space-y-6 relative z-10 glass-panel rounded-2xl p-10 border border-allvino-outline-variant/30 shadow-xl">
        <h1 className="text-5xl font-extrabold font-serif text-allvino-primary tracking-tight">
          Allvino
        </h1>
        <p className="text-xl text-allvino-on-surface-variant font-light">
          Catálogo Digital e Geração de PDF B2B
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/admin/login"
            className="px-6 py-3 font-semibold rounded-md border border-allvino-primary text-allvino-primary hover:bg-allvino-primary hover:text-white transition duration-300 text-sm"
          >
            Painel Admin
          </Link>
          <a
            href="/api/export-pdf"
            className="px-6 py-3 font-semibold rounded-md bg-allvino-primary text-white hover:bg-allvino-primary-container transition duration-300 text-sm"
          >
            Baixar Catálogo (PDF)
          </a>
        </div>
      </div>
    </main>
  );
}
